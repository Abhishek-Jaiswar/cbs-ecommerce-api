import express, { Router } from "express";
import { orderController } from "../orderssss/order.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router: Router = express.Router();

// Authenticated route for verifying Razorpay signatures
router.use(requireAuth);

router.post("/verify", orderController.verifyPayment);

export default router;
