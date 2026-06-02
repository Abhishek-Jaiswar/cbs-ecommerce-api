import express, { Router } from "express";
import { blogTagController } from "./blog-tags.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

router.get("/", blogTagController.getBlogTags);
router.get("/:id", blogTagController.getBlogTagById);
router.get("/slug/:slug", blogTagController.getBlogTagBySlug);

router.post("/", requireAuth, requireRole("ADMIN"), blogTagController.createBlogTag);

router.put("/:id", requireAuth, requireRole("ADMIN"), blogTagController.updateBlogTag);

router.delete("/:id", requireAuth, requireRole("ADMIN"), blogTagController.deleteBlogTag);

export default router;
