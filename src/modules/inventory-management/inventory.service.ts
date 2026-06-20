import { NotFoundError, BadRequestError } from "../../utils/errors/app-error.js";
import { inventoryRepository } from "./inventory.repository.js";
import { emailService } from "../../services/email/mail.service.js";
import { productCache } from "../products/products.cache.js";

class InventoryService {
  async getInventory(params: {
    page: number;
    limit: number;
    search?: string | undefined;
    stockStatus?: string | undefined;
  }) {
    return await inventoryRepository.getInventory(params);
  }

  async updateInventory(
    variantId: string,
    payload: { price?: number | null | undefined; stock?: number | undefined }
  ) {
    const variant = await inventoryRepository.getVariantById(variantId);
    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    const oldPhysicalQty = variant.physicalQty;
    const newPhysicalQty = payload.stock !== undefined ? payload.stock : oldPhysicalQty;
    const stockDiff = newPhysicalQty - oldPhysicalQty;

    let updated;
    if (stockDiff !== 0) {
      // Perform manual adjustment transaction
      const res = await inventoryRepository.adjustStock({
        variantId,
        qtyChange: stockDiff,
        type: "MANUAL_ADJUSTMENT",
        reason: "Admin manual stock override",
      });
      updated = res.variant;
    }

    if (payload.price !== undefined) {
      updated = await inventoryRepository.updateInventory(variantId, { price: payload.price });
    }

    if (!updated) {
      updated = variant;
    }

    await productCache.invalidateProducts(variant.productId);

    return updated;
  }

  async adjustStock(params: {
    variantId: string;
    warehouseId?: string;
    qtyChange: number;
    type: "MANUAL_ADJUSTMENT" | "SHRINKAGE" | "REPLENISHMENT" | "CUSTOMER_RETURN";
    reason?: string;
    userId?: string;
  }) {
    const variant = await inventoryRepository.getVariantById(params.variantId);
    if (!variant) {
      throw new NotFoundError("Variant not found");
    }

    const result = await inventoryRepository.adjustStock(params);
    await productCache.invalidateProducts(variant.productId);
    return result;
  }

  async getTransactions(params: {
    page: number;
    limit: number;
    type?: string;
    variantId?: string;
  }) {
    return await inventoryRepository.getTransactions(params);
  }

  async getSuppliers() {
    return await inventoryRepository.findSuppliers();
  }

  async createSupplier(data: {
    name: string;
    contactName?: string;
    email: string;
    phone?: string;
    address?: string;
  }) {
    return await inventoryRepository.createSupplier(data);
  }

  async createPurchaseOrder(data: {
    supplierId: string;
    notes?: string;
    items: { variantId: string; quantityOrdered: number; unitCost: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError("Purchase Order must contain at least one item");
    }

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const poParams: any = {
      poNumber,
      supplierId: data.supplierId,
      items: data.items,
    };
    if (data.notes !== undefined) {
      poParams.notes = data.notes;
    }

    return await inventoryRepository.createPurchaseOrder(poParams);
  }

  async getPurchaseOrders(page: number, limit: number) {
    return await inventoryRepository.findPurchaseOrders(page, limit);
  }

  async getPurchaseOrderById(id: string) {
    const po = await inventoryRepository.findPurchaseOrderById(id);
    if (!po) {
      throw new NotFoundError("Purchase Order not found");
    }
    return po;
  }

  async updatePurchaseOrderStatus(
    id: string,
    status: "DRAFT" | "SENT" | "CANCELLED",
    options?: { email?: string | undefined; subject?: string | undefined; customNotes?: string | undefined }
  ) {
    const po = await inventoryRepository.updatePurchaseOrderStatus(id, status);

    if (status === "SENT") {
      // Trigger email sending asynchronously so we don't block the HTTP response
      this.getPurchaseOrderById(id)
        .then((fullPo) => {
          if (fullPo && fullPo.supplier) {
            const recipientEmail = options?.email || fullPo.supplier.email;
            if (recipientEmail) {
              emailService.sendPurchaseOrderEmail(
                recipientEmail,
                fullPo,
                options?.subject,
                options?.customNotes
              ).catch((emailErr) => {
                console.error("Failed to send purchase order email to supplier:", emailErr);
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to retrieve full PO details for supplier email:", err);
        });
    }

    return po;
  }

  async receivePurchaseOrder(
    poId: string,
    items: { variantId: string; quantityReceived: number }[],
    userId?: string
  ) {
    const result = await inventoryRepository.receivePurchaseOrderItems(poId, items, userId);
    // Invalidate product caches for received items
    for (const item of items) {
      const variant = await inventoryRepository.getVariantById(item.variantId);
      if (variant) {
        await productCache.invalidateProducts(variant.productId);
      }
    }
    return result;
  }

  async getWarehouses() {
    return await inventoryRepository.findWarehouses();
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
    return await inventoryRepository.createWarehouse(data);
  }

  async updateSupplier(id: string, data: {
    name?: string | undefined;
    contactName?: string | null | undefined;
    email?: string | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    status?: "ACTIVE" | "INACTIVE" | "TEMPORARILY_CLOSED" | undefined;
  }) {
    return await inventoryRepository.updateSupplier(id, data);
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
    return await inventoryRepository.updateWarehouse(id, data);
  }
}

export const inventoryService = new InventoryService();
