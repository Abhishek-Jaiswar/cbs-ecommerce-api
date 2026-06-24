import type { Request, Response, NextFunction } from "express";
import { landingPageService } from "./landing.service.js";
import { uploadService } from "../../services/storage/upload.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";

class LandingPageController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.isPublished === "string") {
        req.body.isPublished = req.body.isPublished === "true";
      }
      if (typeof req.body.sections === "string") {
        try {
          req.body.sections = JSON.parse(req.body.sections);
        } catch {
          req.body.sections = undefined;
        }
      }

      if (!req.file) {
        throw new BadRequestError("Banner image file is required");
      }

      const storageAsset = await uploadService.upload(req.file, "landing-pages");
      req.body.imageUrl = storageAsset.url;
      req.body.imagePublicId = storageAsset.storageKey;

      const result = await landingPageService.create(req.body);

      return res.status(201).json({
        success: true,
        message: "Landing page created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.getAll();

      return res.status(200).json({
        success: true,
        data: {
          items: result,
          total: result.length,
          page: 1,
          limit: result.length,
          totalPages: 1,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.getById(String(req.params.id));

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.getBySlug(String(req.params.slug));

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.body.isPublished === "string") {
        req.body.isPublished = req.body.isPublished === "true";
      }
      if (typeof req.body.sections === "string") {
        try {
          req.body.sections = JSON.parse(req.body.sections);
        } catch {
          req.body.sections = undefined;
        }
      }

      if (req.file) {
        const storageAsset = await uploadService.upload(req.file, "landing-pages");
        req.body.imageUrl = storageAsset.url;
        req.body.imagePublicId = storageAsset.storageKey;
      }

      const result = await landingPageService.update(String(req.params.id), req.body);

      return res.status(200).json({
        success: true,
        message: "Landing page updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.delete(String(req.params.id));

      return res.status(200).json({
        success: true,
        message: "Landing page deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.publish(String(req.params.id));

      return res.status(200).json({
        success: true,
        message: "Landing page published",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  unpublish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingPageService.unpublish(String(req.params.id));

      return res.status(200).json({
        success: true,
        message: "Landing page unpublished",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const landingPageController = new LandingPageController();
