import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";
import { inventoryService } from "./inventory.service.js";
import { generatePdfFromHtml } from "../../services/pdf/pdf-generator.js";
import { poQuoteTemplate } from "../../services/pdf/pdf-templates/po-quote-template.js";

class InventoryController {
  async getInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const search = req.query.search as string | undefined;
      const stockStatus = req.query.stockStatus as string | undefined;

      const result = await inventoryService.getInventory({
        page,
        limit,
        search,
        stockStatus,
      });

      return res.status(200).json({
        success: true,
        message: "Inventory fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const variantId = req.params.variantId as string;
      if (!variantId) {
        throw new BadRequestError("Variant ID is required");
      }

      const updateSchema = z.object({
        price: z.number().nullable().optional(),
        stock: z.number().int().nonnegative().optional(),
      });

      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updated = await inventoryService.updateInventory(variantId, validation.data);

      return res.status(200).json({
        success: true,
        message: "Inventory updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const adjustSchema = z.object({
        variantId: z.string().cuid(),
        warehouseId: z.string().cuid().optional(),
        qtyChange: z.number().int(),
        type: z.enum(["MANUAL_ADJUSTMENT", "SHRINKAGE", "REPLENISHMENT", "CUSTOMER_RETURN"]),
        reason: z.string().optional(),
      });

      const validation = adjustSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      // Read user ID from request auth (if attached)
      const userId = (req as any).user?.id;

      const adjustData: any = {
        variantId: validation.data.variantId,
        qtyChange: validation.data.qtyChange,
        type: validation.data.type,
      };
      if (validation.data.warehouseId !== undefined) {
        adjustData.warehouseId = validation.data.warehouseId;
      }
      if (validation.data.reason !== undefined) {
        adjustData.reason = validation.data.reason;
      }
      if (userId !== undefined) {
        adjustData.userId = userId;
      }

      const result = await inventoryService.adjustStock(adjustData);

      return res.status(200).json({
        success: true,
        message: "Stock adjusted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const type = req.query.type as string | undefined;
      const variantId = req.query.variantId as string | undefined;

      const txParams: any = { page, limit };
      if (type !== undefined) {
        txParams.type = type;
      }
      if (variantId !== undefined) {
        txParams.variantId = variantId;
      }

      const result = await inventoryService.getTransactions(txParams);

      return res.status(200).json({
        success: true,
        message: "Inventory transactions ledger fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await inventoryService.getSuppliers();
      return res.status(200).json({
        success: true,
        message: "Suppliers fetched successfully",
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplierSchema = z.object({
        name: z.string().min(1, "Name is required"),
        contactName: z.string().optional(),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        address: z.string().optional(),
      });

      const validation = supplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const supplierData: any = {
        name: validation.data.name,
        email: validation.data.email,
      };
      if (validation.data.contactName !== undefined) {
        supplierData.contactName = validation.data.contactName;
      }
      if (validation.data.phone !== undefined) {
        supplierData.phone = validation.data.phone;
      }
      if (validation.data.address !== undefined) {
        supplierData.address = validation.data.address;
      }

      const supplier = await inventoryService.createSupplier(supplierData);
      return res.status(201).json({
        success: true,
        message: "Supplier profile created successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const poItemSchema = z.object({
        variantId: z.string().cuid(),
        quantityOrdered: z.number().int().positive(),
        unitCost: z.number().positive(),
      });
      const poSchema = z.object({
        supplierId: z.string().cuid(),
        notes: z.string().optional(),
        items: z.array(poItemSchema).min(1, "At least one item is required"),
      });

      const validation = poSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const poData: any = {
        supplierId: validation.data.supplierId,
        items: validation.data.items,
      };
      if (validation.data.notes !== undefined) {
        poData.notes = validation.data.notes;
      }

      const po = await inventoryService.createPurchaseOrder(poData);
      return res.status(201).json({
        success: true,
        message: "Purchase Order created successfully",
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await inventoryService.getPurchaseOrders(page, limit);
      return res.status(200).json({
        success: true,
        message: "Purchase orders fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const po = await inventoryService.getPurchaseOrderById(id);
      return res.status(200).json({
        success: true,
        message: "Purchase order details fetched successfully",
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const statusSchema = z.object({
        status: z.enum(["DRAFT", "SENT", "CANCELLED"]),
        email: z.string().email().optional().or(z.literal("")),
        subject: z.string().optional(),
        customNotes: z.string().optional(),
      });

      const validation = statusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { status, email, subject, customNotes } = validation.data;
      const po = await inventoryService.updatePurchaseOrderStatus(id, status, {
        email: email || undefined,
        subject,
        customNotes,
      });
      return res.status(200).json({
        success: true,
        message: `Purchase Order status updated to ${status}`,
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  async receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const receiveItemSchema = z.object({
        variantId: z.string().cuid(),
        quantityReceived: z.number().int().nonnegative(),
      });
      const receiveSchema = z.object({
        items: z.array(receiveItemSchema).min(1, "At least one item is required"),
      });

      const validation = receiveSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const userId = (req as any).user?.id;
      const po = await inventoryService.receivePurchaseOrder(id, validation.data.items, userId);

      return res.status(200).json({
        success: true,
        message: "Goods received successfully",
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouses = await inventoryService.getWarehouses();
      return res.status(200).json({
        success: true,
        message: "Warehouses fetched successfully",
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }

  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouseSchema = z.object({
        name: z.string().min(1, "Name is required"),
        code: z.string().min(1, "Code is required").toUpperCase(),
        addressLine: z.string().min(1, "Address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        country: z.string().min(1, "Country is required"),
      });

      const validation = warehouseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const warehouse = await inventoryService.createWarehouse(validation.data);
      return res.status(201).json({
        success: true,
        message: "Warehouse profile created successfully",
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Supplier ID is required");
      }

      const supplierUpdateSchema = z.object({
        name: z.string().min(1, "Name is required").optional(),
        contactName: z.string().nullable().optional(),
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"]).optional(),
      });

      const validation = supplierUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const supplier = await inventoryService.updateSupplier(id, validation.data);
      return res.status(200).json({
        success: true,
        message: "Supplier profile updated successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Warehouse ID is required");
      }

      const warehouseUpdateSchema = z.object({
        name: z.string().min(1, "Name is required").optional(),
        code: z.string().min(1, "Code is required").toUpperCase().optional(),
        addressLine: z.string().min(1, "Address is required").optional(),
        city: z.string().min(1, "City is required").optional(),
        state: z.string().min(1, "State is required").optional(),
        postalCode: z.string().min(1, "Postal code is required").optional(),
        country: z.string().min(1, "Country is required").optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED"]).optional(),
      });

      const validation = warehouseUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const warehouse = await inventoryService.updateWarehouse(id, validation.data);
      return res.status(200).json({
        success: true,
        message: "Warehouse profile updated successfully",
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadPurchaseOrderPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Purchase Order ID is required");
      }

      const po = await inventoryService.getPurchaseOrderById(id);
      if (!po) {
        throw new NotFoundError("Purchase Order not found");
      }

      const html = poQuoteTemplate(po);
      const pdfBuffer = await generatePdfFromHtml(html);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=purchase-order-${po.poNumber}.pdf`);
      return res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
