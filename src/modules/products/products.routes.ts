import express, { Router } from "express";
import { productController } from "./product.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = express.Router();

// Public routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.get("/slug/:slug", productController.getProductBySlug);

// Admin-only routes
router.post("/", requireAuth, requireRole("ADMIN"), productController.createBasicInfo);
router.put("/:id", requireAuth, requireRole("ADMIN"), productController.updateBasicInfo);
router.patch("/:id/status", requireAuth, requireRole("ADMIN"), productController.updateStatus);

// Colors management
router.post(
  "/:productId/colors",
  requireAuth,
  requireRole("ADMIN"),
  productController.updateOrCreateColor
);
router.delete("/colors/:colorId", requireAuth, requireRole("ADMIN"), productController.deleteColor);

// Sizes management
router.post(
  "/:productId/sizes",
  requireAuth,
  requireRole("ADMIN"),
  productController.updateOrCreateSize
);
router.delete("/sizes/:sizeId", requireAuth, requireRole("ADMIN"), productController.deleteSize);

// Variants management
router.post(
  "/:productId/variants",
  requireAuth,
  requireRole("ADMIN"),
  productController.createVariant
);
router.delete(
  "/variants/:variantId",
  requireAuth,
  requireRole("ADMIN"),
  productController.deleteVariant
);

// Images management
router.post(
  "/:productId/images",
  requireAuth,
  requireRole("ADMIN"),
  upload.array("files", 20),
  productController.uploadImages
);
router.post(
  "/:productId/image",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  productController.uploadSingleImage
);
router.delete(
  "/:productId/images/:imageId",
  requireAuth,
  requireRole("ADMIN"),
  productController.deleteImage
);

// Specifications management
router.post(
  "/:productId/specifications",
  requireAuth,
  requireRole("ADMIN"),
  productController.createSpecifications
);
router.delete(
  "/:productId/specifications/:specificationId",
  requireAuth,
  requireRole("ADMIN"),
  productController.deleteSpecification
);

// Product deletion
router.delete("/:id", requireAuth, requireRole("ADMIN"), productController.deleteProduct);

export default router;
