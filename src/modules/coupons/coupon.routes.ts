import express, { Router } from "express";
import { couponController } from "./coupon.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Public / User checkout coupon validation
router.post("/validate", requireAuth, couponController.validateCoupon);

// Admin-only coupon management routes
router.get("/", requireAuth, requireRole("ADMIN"), couponController.getCoupons);
router.get("/redemptions", requireAuth, requireRole("ADMIN"), couponController.getRedemptions);
router.get("/:id", requireAuth, requireRole("ADMIN"), couponController.getCouponById);
router.post("/", requireAuth, requireRole("ADMIN"), couponController.createCoupon);
router.put("/:id", requireAuth, requireRole("ADMIN"), couponController.updateCoupon);
router.put("/:id/status", requireAuth, requireRole("ADMIN"), couponController.toggleStatus);
router.delete("/:id", requireAuth, requireRole("ADMIN"), couponController.deleteCoupon);

export default router;
