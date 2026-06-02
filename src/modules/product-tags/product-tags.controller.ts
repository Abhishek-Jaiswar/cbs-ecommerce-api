import type { Request, Response, NextFunction } from "express";
import { createProductTagBodySchema, updateProductTagBodySchema } from "./product-tags.schema.js";
import { productTagService } from "./product-tags.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";
import type { TUpdateProductTag } from "./product-tags.types.js";

class ProductTagController {
  async getProductTags(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await productTagService.getProductTags(page, limit);

      return res.status(200).json({
        success: true,
        message: "Tags fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductTagById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      const tag = await productTagService.getProductTagById(id);

      return res.status(200).json({
        success: true,
        message: "Tag details fetched successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductTagBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;

      if (!slug) {
        throw new BadRequestError("Tag slug is required");
      }

      const tag = await productTagService.getProductTagBySlug(slug);

      return res.status(200).json({
        success: true,
        message: "Tag details fetched successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProductTag(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createProductTagBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const tag = await productTagService.createProductTag(validation.data);

      return res.status(201).json({
        success: true,
        message: "Tag created successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductTag(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      const validation = updateProductTagBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload: TUpdateProductTag = {};
      if (validation.data.name !== undefined) updatePayload.name = validation.data.name;
      if (validation.data.slug !== undefined) updatePayload.slug = validation.data.slug;

      const tag = await productTagService.updateProductTag(id, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Tag updated successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProductTag(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      await productTagService.deleteProductTag(id);

      return res.status(200).json({
        success: true,
        message: "Tag deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productTagController = new ProductTagController();
