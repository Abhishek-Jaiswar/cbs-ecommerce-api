import express, { Router } from "express";
import { productTagController } from "./product-tags.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

router.get("/", productTagController.getProductTags);
router.get("/:id", productTagController.getProductTagById);
router.get("/slug/:slug", productTagController.getProductTagBySlug);

router.post("/", requireAuth, requireRole("ADMIN"), productTagController.createProductTag);

router.put("/:id", requireAuth, requireRole("ADMIN"), productTagController.updateProductTag);

router.delete("/:id", requireAuth, requireRole("ADMIN"), productTagController.deleteProductTag);

export default router;
