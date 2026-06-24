import { Router } from "express";
import { landingPageController } from "./landing.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = Router();

// Public routes
router.get("/", landingPageController.getAll);
router.get("/slug/:slug", landingPageController.getBySlug);

// Admin routes
router.get("/:id", requireAuth, requireRole("ADMIN"), landingPageController.getById);
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  landingPageController.create
);
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
  landingPageController.update
);
router.delete("/:id", requireAuth, requireRole("ADMIN"), landingPageController.delete);
router.patch("/:id/publish", requireAuth, requireRole("ADMIN"), landingPageController.publish);
router.patch("/:id/unpublish", requireAuth, requireRole("ADMIN"), landingPageController.unpublish);

export default router;
