import type { Request, Response, NextFunction } from "express";
import { createCategoryBodySchema, updateCategoryBodySchema } from "./product-category.schema.js";
import { productCategoryService } from "./product-category.service.js";
import { uploadService } from "../../services/storage/upload.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";
import type { TCreateCategory, TUpdateCategory } from "./product-category.types.js";

class ProductCategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await productCategoryService.getCategories(page, limit);

      return res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Category ID is required");
      }

      const category = await productCategoryService.getCategoryById(id);

      return res.status(200).json({
        success: true,
        message: "Category details fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;

      if (!slug) {
        throw new BadRequestError("Category slug is required");
      }

      const category = await productCategoryService.getCategoryBySlug(slug);

      return res.status(200).json({
        success: true,
        message: "Category details fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await productCategoryService.getCategoryTree();

      return res.status(200).json({
        success: true,
        message: "Category hierarchy tree fetched successfully",
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createCategoryBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      if (!req.file) {
        throw new BadRequestError("Category image file is required");
      }

      // Upload file to storage
      const storageAsset = await uploadService.upload(req.file, "categories");

      const createPayload: TCreateCategory = {
        name: validation.data.name,
        slug: validation.data.slug,
        excerpt: validation.data.excerpt ?? null,
        parentId: validation.data.parentId ?? null,
        isActive: validation.data.isActive,
        image: storageAsset.url,
        storageKey: storageAsset.storageKey,
        altText: validation.data.altText || validation.data.name,
      };

      const category = await productCategoryService.createCategory(createPayload);

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Category ID is required");
      }

      const validation = updateCategoryBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const existingCategory = await productCategoryService.getCategoryById(id);

      const updatePayload: TUpdateCategory = {};
      if (validation.data.name !== undefined) updatePayload.name = validation.data.name;
      if (validation.data.slug !== undefined) updatePayload.slug = validation.data.slug;
      if (validation.data.excerpt !== undefined) updatePayload.excerpt = validation.data.excerpt;
      if (validation.data.parentId !== undefined) updatePayload.parentId = validation.data.parentId;
      if (validation.data.isActive !== undefined) updatePayload.isActive = validation.data.isActive;
      if (validation.data.altText !== undefined) updatePayload.altText = validation.data.altText;

      if (req.file) {
        // Upload new image
        const storageAsset = await uploadService.upload(req.file, "categories");

        updatePayload.image = storageAsset.url;
        updatePayload.storageKey = storageAsset.storageKey;
        updatePayload.altText =
          validation.data.altText || validation.data.name || existingCategory.name;

        // Delete old image if it exists
        if (existingCategory.storageKey) {
          await uploadService.delete(existingCategory.storageKey).catch((err) => {
            console.error("Failed to delete orphaned category image:", err);
          });
        }
      }

      const category = await productCategoryService.updateCategory(id, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Category ID is required");
      }

      const category = await productCategoryService.getCategoryById(id);
      const storageKey = category.storageKey;

      await productCategoryService.deleteCategory(id);

      if (storageKey) {
        await uploadService.delete(storageKey).catch((err) => {
          console.error("Failed to delete orphaned category image:", err);
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productCategoryController = new ProductCategoryController();
