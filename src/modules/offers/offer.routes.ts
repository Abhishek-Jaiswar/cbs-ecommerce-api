import express, { Router } from "express";
import { offerController } from "./offer.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Public routes for fetching active promotions
router.get("/", offerController.getOffers);
router.get("/:id", offerController.getOfferById);

// Admin-only offer management routes
router.post("/", requireAuth, requireRole("ADMIN"), offerController.createOffer);
router.put("/:id", requireAuth, requireRole("ADMIN"), offerController.updateOffer);
router.put("/:id/status", requireAuth, requireRole("ADMIN"), offerController.toggleStatus);
router.delete("/:id", requireAuth, requireRole("ADMIN"), offerController.deleteOffer);

export default router;
