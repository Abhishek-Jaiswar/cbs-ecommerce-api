import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createBlogCategoryBodySchema,
  updateBlogCategoryBodySchema,
} from "./blog-categories.schema.js";

import { blogCategoryService } from "./blog-categories.service.js";

import {
  BadRequestError,
} from "../../utils/errors/app-error.js";

import type {
  TUpdateBlogCategory,
} from "./blog-categories.type.js";

class BlogCategoryController {

  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page =
        Math.max(
          Number(req.query.page) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(req.query.limit) || 10,
            1
          ),
          100
        );

      const result =
        await blogCategoryService.getCategories(
          page,
          limit
        );

      return res.status(200).json({
        success: true,
        message:
          "Categories fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        req.params.id as string;

      if (!id) {
        throw new BadRequestError(
          "Category ID is required"
        );
      }

      const category =
        await blogCategoryService.getCategoryById(
          id
        );

      return res.status(200).json({
        success: true,
        message:
          "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  
  async getCategoryBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const slug =
        req.params.slug as string;

      if (!slug) {
        throw new BadRequestError(
          "Category slug required"
        );
      }

      const category =
        await blogCategoryService.getCategoryBySlug(
          slug
        );

      return res.status(200).json({
        success: true,
        message:
          "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }


  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validation =
        createBlogCategoryBodySchema.safeParse(
          req.body
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,

          message:
            "Validation Failed",

          error:
            validation.error.issues.map(
              (issue) =>
                issue.message
            ),
        });
      }

      const category =
        await blogCategoryService.createCategory(
          validation.data
        );

      return res.status(201).json({
        success: true,

        message:
          "Category created successfully",

        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

 
  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        req.params.id as string;

      if (!id) {
        throw new BadRequestError(
          "Category ID required"
        );
      }

      const validation =
        updateBlogCategoryBodySchema.safeParse(
          req.body
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,

          message:
            "Validation Failed",

          error:
            validation.error.issues.map(
              (issue) =>
                issue.message
            ),
        });
      }

      const updatePayload:
        TUpdateBlogCategory =
        {};

      if (
        validation.data.name !==
        undefined
      ) {
        updatePayload.name =
          validation.data.name;
      }

      if (
        validation.data.slug !==
        undefined
      ) {
        updatePayload.slug =
          validation.data.slug;
      }

      if (
        validation.data
          .isActive !==
        undefined
      ) {
        updatePayload.isActive =
          validation.data.isActive;
      }

      const category =
        await blogCategoryService.updateCategory(
          id,
          updatePayload
        );

      return res.status(200).json({
        success: true,

        message:
          "Category updated successfully",

        data: category,
      });
    } catch (error) {
      next(error);
    }
  }


  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        req.params.id as string;

      if (!id) {
        throw new BadRequestError(
          "Category ID required"
        );
      }

      await blogCategoryService.deleteCategory(
        id
      );

      return res.status(200).json({
        success: true,

        message:
          "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogCategoryController =
  new BlogCategoryController();