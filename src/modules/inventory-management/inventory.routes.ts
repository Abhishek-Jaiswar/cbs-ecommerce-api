import express, { Router } from "express";
import { inventoryController } from "./inventory.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Middleware group for Admin Auth
router.use(requireAuth);
router.use(requireRole("ADMIN"));

// Variants / general stock queries
router.get("/", inventoryController.getInventory);
router.put("/:variantId", inventoryController.updateInventory);
router.post("/adjust", inventoryController.adjustStock);

// Transactions Ledger
router.get("/transactions", inventoryController.getTransactions);

// Suppliers Management
router.get("/suppliers", inventoryController.getSuppliers);
router.post("/suppliers", inventoryController.createSupplier);
router.put("/suppliers/:id", inventoryController.updateSupplier);

// Purchase Orders Management
router.get("/purchase-orders", inventoryController.getPurchaseOrders);
router.post("/purchase-orders", inventoryController.createPurchaseOrder);
router.get("/purchase-orders/:id", inventoryController.getPurchaseOrderById);
router.get("/purchase-orders/:id/pdf", inventoryController.downloadPurchaseOrderPdf);
router.put("/purchase-orders/:id/status", inventoryController.updatePurchaseOrderStatus);
router.post("/purchase-orders/:id/receive", inventoryController.receivePurchaseOrder);

// Warehouses Management
router.get("/warehouses", inventoryController.getWarehouses);
router.post("/warehouses", inventoryController.createWarehouse);
router.put("/warehouses/:id", inventoryController.updateWarehouse);

export default router;
