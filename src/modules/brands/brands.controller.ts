import type { Request, Response, NextFunction } from "express";
import { createBrandBodySchema, updateBrandBodySchema } from "./brands.schema.js";
import { brandService } from "./brands.service.js";
import { uploadService } from "../../services/storage/upload.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";
import type { TCreateBrand } from "./brands.types.js";

class BrandController {
  async getBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await brandService.getBrands(page, limit);

      return res.status(200).json({
        success: true,
        message: "Brands fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrandById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Brand ID is required");
      }

      const brand = await brandService.getBrandById(id);

      return res.status(200).json({
        success: true,
        message: "Brand details fetched successfully",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createBrandBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      if (!req.file) {
        throw new BadRequestError("Brand logo file is required");
      }

      // Upload image
      const storageAsset = await uploadService.upload(req.file, "brands");

      const brand = await brandService.createBrand({
        name: validation.data.name,
        image: storageAsset.url,
        storageKey: storageAsset.storageKey,
        altText: validation.data.altText || validation.data.name,
      });

      return res.status(201).json({
        success: true,
        message: "Brand created successfully",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Brand ID is required");
      }

      const validation = updateBrandBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const existingBrand = await brandService.getBrandById(id);

      const updatePayload: Partial<TCreateBrand> = {};
      if (validation.data.name !== undefined) updatePayload.name = validation.data.name;
      if (validation.data.altText !== undefined) updatePayload.altText = validation.data.altText;

      if (req.file) {
        // Upload new image
        const storageAsset = await uploadService.upload(req.file, "brands");

        updatePayload.image = storageAsset.url;
        updatePayload.storageKey = storageAsset.storageKey;
        updatePayload.altText =
          validation.data.altText || validation.data.name || existingBrand.name;

        // Delete old image
        if (existingBrand.storageKey) {
          await uploadService.delete(existingBrand.storageKey).catch((err) => {
            console.error("Failed to delete orphaned brand logo:", err);
          });
        }
      }

      const brand = await brandService.updateBrand(id, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Brand updated successfully",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Brand ID is required");
      }

      const brand = await brandService.getBrandById(id);
      const storageKey = brand.storageKey;

      await brandService.deleteBrand(id);

      if (storageKey) {
        await uploadService.delete(storageKey).catch((err) => {
          console.error("Failed to delete orphaned brand logo:", err);
        });
      }

      return res.status(200).json({
        success: true,
        message: "Brand deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
