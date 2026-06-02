import express, { Router } from "express";
import { brandController } from "./brands.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = express.Router();

router.get("/", brandController.getBrands);
router.get("/:id", brandController.getBrandById);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  brandController.createBrand
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  brandController.updateBrand
);

router.delete("/:id", requireAuth, requireRole("ADMIN"), brandController.deleteBrand);

export default router;
