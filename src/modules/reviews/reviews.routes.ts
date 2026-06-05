import express, { Router } from "express";
import { reviewController } from "./reviews.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

router.get("/product/:productId", reviewController.getReviewsByProductId);
router.get("/admin/get-all", requireAuth, requireRole("ADMIN"), reviewController.getAllReviews);
router.get("/:id", reviewController.getReviewById);

router.post("/", requireAuth, reviewController.createReview);
router.put("/:id", requireAuth, reviewController.updateReview);
router.delete("/:id", requireAuth, reviewController.deleteReview);

export default router;

