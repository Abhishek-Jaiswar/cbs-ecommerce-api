import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

class InventoryRepository {
  async getVariantById(id: string) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  }

  async getInventory(params: {
    page: number;
    limit: number;
    search?: string | undefined;
    stockStatus?: string | undefined;
  }) {
    const { page, limit, search, stockStatus } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (search) {
      where.OR = [
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          product: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Load matching variants
    const allVariants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            costPrice: true,
          },
        },
        color: {
          select: {
            id: true,
            name: true,
            hex: true,
          },
        },
        size: {
          select: {
            id: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map and calculate availableQty
    let filtered = allVariants.map((v) => {
      const availableQty = v.physicalQty - v.committedQty;
      return {
        ...v,
        availableQty,
        stock: availableQty, // Backwards compatibility for frontend
      };
    });

    if (stockStatus === "OUT_OF_STOCK") {
      filtered = filtered.filter((v) => v.availableQty <= 0);
    } else if (stockStatus === "LOW_STOCK") {
      filtered = filtered.filter((v) => v.availableQty > 0 && v.availableQty <= v.reorderPoint);
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);

    // Insights aggregates
    const totalPhysicalStock = filtered.reduce((sum, v) => sum + v.physicalQty, 0);
    const totalCommittedStock = filtered.reduce((sum, v) => sum + v.committedQty, 0);
    const totalAvailableStock = totalPhysicalStock - totalCommittedStock;
    const outOfStockCount = filtered.filter((v) => v.availableQty <= 0).length;
    const lowStockCount = filtered.filter((v) => v.availableQty > 0 && v.availableQty <= v.reorderPoint).length;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      insights: {
        totalStock: totalPhysicalStock,
        totalCommitted: totalCommittedStock,
        totalAvailable: totalAvailableStock,
        totalVariants: filtered.length,
        outOfStockCount,
        lowStockCount,
      },
    };
  }

  async updateInventory(
    variantId: string,
    payload: { price?: number | null | undefined; stock?: number | undefined }
  ) {
    const data: Prisma.ProductVariantUpdateInput = {};
    if (payload.price !== undefined) {
      data.price = payload.price;
    }
    if (payload.stock !== undefined) {
      data.physicalQty = payload.stock; // We map 'stock' override to physicalQty
    }
    return prisma.productVariant.update({
      where: {
        id: variantId,
      },
      data,
    });
  }

  async adjustStock(params: {
    variantId: string;
    warehouseId?: string;
    qtyChange: number;
    type: "MANUAL_ADJUSTMENT" | "SHRINKAGE" | "REPLENISHMENT" | "CUSTOMER_RETURN";
    reason?: string;
    userId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: params.variantId },
      });
      if (!variant) {
        throw new Error("Variant not found");
      }

      const previousAvailable = variant.physicalQty - variant.committedQty;

      // Update physicalQty
      const updatedVariant = await tx.productVariant.update({
        where: { id: params.variantId },
        data: {
          physicalQty: {
            increment: params.qtyChange,
          },
        },
      });

      const newAvailable = updatedVariant.physicalQty - updatedVariant.committedQty;

      // Create transaction log
      const transaction = await tx.inventoryTransaction.create({
        data: {
          variantId: params.variantId,
          warehouseId: params.warehouseId || null,
          type: params.type,
          qtyChange: params.qtyChange,
          previousQty: previousAvailable,
          newQty: newAvailable,
          reason: params.reason || null,
          userId: params.userId || null,
        },
      });

      return { variant: updatedVariant, transaction };
    });
  }

  async getTransactions(params: {
    page: number;
    limit: number;
    type?: string;
    variantId?: string;
  }) {
    const { page, limit, type, variantId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (variantId) {
      where.variantId = variantId;
    }

    const [items, total] = await prisma.$transaction([
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              color: { select: { name: true } },
              size: { select: { value: true } },
            },
          },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createSupplier(data: {
    name: string;
    contactName?: string;
    email: string;
    phone?: string;
    address?: string;
  }) {
    return prisma.supplier.create({ data });
  }

  async findSuppliers() {
    return prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
  }

  async createPurchaseOrder(data: {
    poNumber: string;
    supplierId: string;
    notes?: string;
    items: { variantId: string; quantityOrdered: number; unitCost: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
      const poData: any = {
        poNumber: data.poNumber,
        supplierId: data.supplierId,
        totalAmount,
        status: "DRAFT",
      };
      if (data.notes !== undefined) {
        poData.notes = data.notes;
      }
      const po = await tx.purchaseOrder.create({
        data: poData,
      });

      await tx.purchaseOrderItem.createMany({
        data: data.items.map((item) => ({
          poId: po.id,
          variantId: item.variantId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
        })),
      });

      return tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: { items: true },
      });
    });
  }

  async findPurchaseOrders(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseOrder.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPurchaseOrderById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
                color: { select: { name: true } },
                size: { select: { value: true } },
              },
            },
          },
        },
      },
    });
  }

  async updatePurchaseOrderStatus(id: string, status: "DRAFT" | "SENT" | "CANCELLED") {
    return prisma.$transaction(async (tx) => {
      const poBefore = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { status: true, items: true },
      });
      if (!poBefore) {
        throw new Error("Purchase Order not found");
      }

      const updateData: any = { status };
      if (status === "SENT") {
        updateData.orderedAt = new Date();
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
      });

      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!po) {
        throw new Error("Purchase Order not found");
      }

      if (poBefore.status !== "SENT" && status === "SENT") {
        for (const item of po.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { onOrderQty: { increment: item.quantityOrdered } },
          });
        }
      } else if (poBefore.status === "SENT" && status === "CANCELLED") {
        for (const item of po.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { onOrderQty: { decrement: item.quantityOrdered } },
          });
        }
      }

      return po;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  async receivePurchaseOrderItems(
    poId: string,
    items: { variantId: string; quantityReceived: number }[],
    userId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });
      if (!po) {
        throw new Error("Purchase Order not found");
      }

      if (po.status !== "SENT" && po.status !== "PARTIALLY_RECEIVED") {
        throw new Error("Purchase Order must be in SENT or PARTIALLY_RECEIVED status to receive goods");
      }

      for (const receiveItem of items) {
        const poItem = po.items.find((i) => i.variantId === receiveItem.variantId);
        if (!poItem) continue;

        const remainingToReceive = poItem.quantityOrdered - poItem.quantityReceived;
        const actualReceive = Math.min(receiveItem.quantityReceived, remainingToReceive);
        if (actualReceive <= 0) continue;

        await tx.purchaseOrderItem.update({
          where: { poId_variantId: { poId, variantId: receiveItem.variantId } },
          data: {
            quantityReceived: {
              increment: actualReceive,
            },
          },
        });

        const variant = await tx.productVariant.findUnique({
          where: { id: receiveItem.variantId },
        });

        if (variant) {
          const previousAvailable = variant.physicalQty - variant.committedQty;
          const updatedVariant = await tx.productVariant.update({
            where: { id: receiveItem.variantId },
            data: {
              physicalQty: {
                increment: actualReceive,
              },
              onOrderQty: {
                decrement: actualReceive,
              },
            },
          });
          const newAvailable = updatedVariant.physicalQty - updatedVariant.committedQty;

          await tx.inventoryTransaction.create({
            data: {
              variantId: receiveItem.variantId,
              type: "REPLENISHMENT",
              qtyChange: actualReceive,
              previousQty: previousAvailable,
              newQty: newAvailable,
              reason: `Replenishment from Purchase Order ${po.poNumber}`,
              poId: po.id,
              userId: userId || null,
            },
          });
        }
      }

      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { poId },
      });

      const allReceived = updatedPoItems.every((i) => i.quantityReceived >= i.quantityOrdered);
      const someReceived = updatedPoItems.some((i) => i.quantityReceived > 0);

      let newStatus: "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" = "SENT";
      if (allReceived) {
        newStatus = "RECEIVED";
      } else if (someReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      const updateData: any = { status: newStatus };
      if (newStatus === "RECEIVED") {
        updateData.receivedAt = new Date();
      }

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: updateData,
      });

      return tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });
    });
  }

  async createWarehouse(data: {
    name: string;
    code: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) {
    return prisma.warehouse.create({ data });
  }

  async findWarehouses() {
    return prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
  }

  async updateSupplier(id: string, data: {
    name?: string | undefined;
    contactName?: string | null | undefined;
    email?: string | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    status?: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED" | undefined;
  }) {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    return prisma.supplier.update({
      where: { id },
      data: updateData,
    });
  }

  async updateWarehouse(id: string, data: {
    name?: string | undefined;
    code?: string | undefined;
    addressLine?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED" | undefined;
  }) {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    return prisma.warehouse.update({
      where: { id },
      data: updateData,
    });
  }
}

export const inventoryRepository = new InventoryRepository();
