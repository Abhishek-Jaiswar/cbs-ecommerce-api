import type { Request, Response, NextFunction } from "express";
import { createBlogTagBodySchema, updateBlogTagBodySchema } from "./blog-tags.schema.js";
import { blogTagService } from "./blog-tags.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";
import type { TUpdateBlogTag } from "./blog-tags.types.js";

class BlogTagController {
  async getBlogTags(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await blogTagService.getBlogTags(page, limit);

      return res.status(200).json({
        success: true,
        message: "Blog tags fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogTagById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      const tag = await blogTagService.getBlogTagById(id);

      return res.status(200).json({
        success: true,
        message: "Blog tag details fetched successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlogTagBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;

      if (!slug) {
        throw new BadRequestError("Tag slug is required");
      }

      const tag = await blogTagService.getBlogTagBySlug(slug);

      return res.status(200).json({
        success: true,
        message: "Blog tag details fetched successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBlogTag(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createBlogTagBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const tag = await blogTagService.createBlogTag(validation.data);

      return res.status(201).json({
        success: true,
        message: "Blog tag created successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBlogTag(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      const validation = updateBlogTagBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload: TUpdateBlogTag = {};
      if (validation.data.name !== undefined) updatePayload.name = validation.data.name;
      if (validation.data.slug !== undefined) updatePayload.slug = validation.data.slug;
      if (validation.data.isActive !== undefined) updatePayload.isActive = validation.data.isActive;

      const tag = await blogTagService.updateBlogTag(id, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Blog tag updated successfully",
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBlogTag(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Tag ID is required");
      }

      await blogTagService.deleteBlogTag(id);

      return res.status(200).json({
        success: true,
        message: "Blog tag deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogTagController = new BlogTagController();
