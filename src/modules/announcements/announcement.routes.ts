import express, { Router } from "express";
import { announcementController } from "./announcement.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

// Public route to get active announcements for marquee
router.get("/", announcementController.getActiveAnnouncements);

// Admin routes for CRUD
router.get("/admin", requireAuth, requireRole("ADMIN"), announcementController.getAnnouncements);
router.get("/:id", requireAuth, requireRole("ADMIN"), announcementController.getAnnouncementById);
router.post("/", requireAuth, requireRole("ADMIN"), announcementController.createAnnouncement);
router.put("/:id", requireAuth, requireRole("ADMIN"), announcementController.updateAnnouncement);
router.delete("/:id", requireAuth, requireRole("ADMIN"), announcementController.deleteAnnouncement);

export default router;
