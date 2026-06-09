import type { Request, Response, NextFunction } from "express";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./announcement.schema.js";
import { announcementService } from "./announcement.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";

class AnnouncementController {
  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await announcementService.getAnnouncements(page, limit);

      return res.status(200).json({
        success: true,
        message: "Announcements fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.getActiveAnnouncements();

      return res.status(200).json({
        success: true,
        message: "Active announcements fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncementById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Announcement ID is required");
      }

      const announcement = await announcementService.getAnnouncementById(id);

      return res.status(200).json({
        success: true,
        message: "Announcement fetched successfully",
        data: announcement,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createAnnouncementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const announcement = await announcementService.createAnnouncement(validation.data);

      return res.status(201).json({
        success: true,
        message: "Announcement created successfully",
        data: announcement,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Announcement ID is required");
      }

      const validation = updateAnnouncementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const announcement = await announcementService.updateAnnouncement(id, validation.data);

      return res.status(200).json({
        success: true,
        message: "Announcement updated successfully",
        data: announcement,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Announcement ID is required");
      }

      await announcementService.deleteAnnouncement(id);

      return res.status(200).json({
        success: true,
        message: "Announcement deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const announcementController = new AnnouncementController();
