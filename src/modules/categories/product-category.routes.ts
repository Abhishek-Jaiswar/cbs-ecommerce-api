import express, { Router } from "express";
import { productCategoryController } from "./product-category.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = express.Router();

router.get("/", productCategoryController.getCategories);
router.get("/tree", productCategoryController.getCategoryTree);
router.get("/:id", productCategoryController.getCategoryById);
router.get("/slug/:slug", productCategoryController.getCategoryBySlug);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  productCategoryController.createCategory
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  productCategoryController.updateCategory
);

router.delete("/:id", requireAuth, requireRole("ADMIN"), productCategoryController.deleteCategory);

export default router;
