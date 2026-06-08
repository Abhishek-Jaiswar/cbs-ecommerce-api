import express, { Router } from "express";
import { orderController } from "./order.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Guard all order routes with authentication
router.use(requireAuth);

// Customer endpoints
router.post("/", orderController.placeOrder);
router.post("/verify-payment", orderController.verifyPayment);
router.get("/user", orderController.getUserOrders);
router.get("/:orderId", orderController.getOrderById);

// Admin endpoints
router.get("/", requireRole("ADMIN"), orderController.getOrders);
router.patch("/:orderId/status", requireRole("ADMIN"), orderController.updateOrderStatus);

export default router;
