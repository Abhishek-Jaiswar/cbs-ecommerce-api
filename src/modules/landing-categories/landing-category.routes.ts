import { Router } from "express";
import { landingCategoryController } from "./landing-category.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = Router();

// Public route to get active landing categories
router.get("/active", landingCategoryController.getActiveCategories);

// Admin routes to manage landing categories
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  landingCategoryController.getAllCategories
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  landingCategoryController.create
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  landingCategoryController.update
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  landingCategoryController.updateStatus
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  landingCategoryController.delete
);

export default router;
