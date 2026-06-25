import type { Request, Response, NextFunction } from "express";
import { landingCategoryService } from "./landing-category.service.js";

class LandingCategoryController {
  getActiveCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingCategoryService.getActiveCategories();

      return res.status(200).json({
        success: true,
        message: "Active landing category banners fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingCategoryService.getAllCategories();

      return res.status(200).json({
        success: true,
        message: "All landing category banners fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await landingCategoryService.create(req.body, req.file);

      return res.status(201).json({
        success: true,
        message: "Landing category banner created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const result = await landingCategoryService.update(id, req.body, req.file);

      return res.status(200).json({
        success: true,
        message: "Landing category banner updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const result = await landingCategoryService.updateStatus(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Landing category banner status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const result = await landingCategoryService.delete(id);

      return res.status(200).json({
        success: true,
        message: "Landing category banner deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const landingCategoryController = new LandingCategoryController();
