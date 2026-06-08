import express, { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Authenticated route for verifying Razorpay signatures
router.use(requireAuth);

router.post("/verify", paymentController.verifyPayment);
router.get("/", requireRole("ADMIN"), paymentController.getPayments);

export default router;
