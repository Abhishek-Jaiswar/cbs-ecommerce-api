import { landingCategoryRepository } from "./landing-category.repository.js";
import { landingCategoryCache } from "./landing-category.cache.js";
import {
  createLandingCategorySchema,
  updateLandingCategorySchema,
  updateLandingCategoryStatusSchema,
} from "./landing-category.schema.js";
import { prisma } from "../../lib/prisma.js";
import { uploadService } from "../../services/storage/upload.service.js";
import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";

class LandingCategoryService {
  async getActiveCategories() {
    return landingCategoryCache.getOrSetActiveBanners(() =>
      landingCategoryRepository.findActive()
    );
  }

  async getAllCategories() {
    return landingCategoryRepository.findAll();
  }

  async create(body: unknown, file: Express.Multer.File | undefined) {
    const parsed = createLandingCategorySchema.parse(body);

    // 1. Verify Category exists
    const category = await prisma.category.findUnique({
      where: { id: parsed.categoryId },
    });
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    // 2. Require file upload
    if (!file) {
      throw new BadRequestError("Banner image file is required.");
    }

    // 3. Upload banner image
    const storageAsset = await uploadService.upload(file, "landing-categories");

    // 4. Create database record
    const result = await landingCategoryRepository.create({
      categoryId: parsed.categoryId,
      label: parsed.label,
      image: storageAsset.url,
      storageKey: storageAsset.storageKey,
      slot: parsed.slot,
      isActive: parsed.isActive,
    });

    // 5. Invalidate cache
    await landingCategoryCache.invalidateActiveBanners();

    return result;
  }

  async update(id: string, body: unknown, file: Express.Multer.File | undefined) {
    const existing = await landingCategoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Landing category banner not found.");
    }

    const parsed = updateLandingCategorySchema.parse(body);

    // 1. Verify Category if categoryId is updated
    if (parsed.categoryId && parsed.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parsed.categoryId },
      });
      if (!category) {
        throw new NotFoundError("Category not found.");
      }
    }

    const updatePayload: any = {
      ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
      ...(parsed.label !== undefined && { label: parsed.label }),
      ...(parsed.slot !== undefined && { slot: parsed.slot }),
      ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
    };

    // 2. Upload new image if provided and delete old image
    if (file) {
      const storageAsset = await uploadService.upload(file, "landing-categories");
      updatePayload.image = storageAsset.url;
      updatePayload.storageKey = storageAsset.storageKey;

      if (existing.storageKey) {
        await uploadService.delete(existing.storageKey).catch((err) => {
          console.error("Failed to delete orphaned landing category banner image:", err);
        });
      }
    }

    // 3. Update database record
    const result = await landingCategoryRepository.update(id, updatePayload);

    // 4. Invalidate cache
    await landingCategoryCache.invalidateActiveBanners();

    return result;
  }

  async updateStatus(id: string, body: unknown) {
    const existing = await landingCategoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Landing category banner not found.");
    }

    const parsed = updateLandingCategoryStatusSchema.parse(body);

    const result = await landingCategoryRepository.update(id, {
      isActive: parsed.isActive,
    });

    await landingCategoryCache.invalidateActiveBanners();

    return result;
  }

  async delete(id: string) {
    const existing = await landingCategoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Landing category banner not found.");
    }

    // 1. Delete associated image from Cloudinary/S3
    if (existing.storageKey) {
      await uploadService.delete(existing.storageKey).catch((err) => {
        console.error("Failed to delete orphaned landing category banner image:", err);
      });
    }

    // 2. Delete database record
    const result = await landingCategoryRepository.delete(id);

    // 3. Invalidate cache
    await landingCategoryCache.invalidateActiveBanners();

    return {
      success: true,
      message: "Landing category banner deleted successfully.",
    };
  }
}

export const landingCategoryService = new LandingCategoryService();
