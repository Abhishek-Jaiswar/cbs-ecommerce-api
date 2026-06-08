import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { orderController } from "./order.controller.js";

const router: Router = express.Router();

router.use(requireAuth);

router.get("/", requireRole("ADMIN"), orderController.getOrders);
router.get("/mine", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);
router.post("/", orderController.placeOrder);
router.patch("/:id/status", requireRole("ADMIN"), orderController.updateOrderStatus);
router.post("/:id/cancel", orderController.cancelOrder);

export default router;
