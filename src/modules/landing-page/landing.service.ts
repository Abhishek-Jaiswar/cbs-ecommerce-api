import { createLandingPageSchema, updateLandingPageSchema } from "./landing.schema.js";
import { LandingPageRepository } from "./landing.repository.js";
import { landingPageCache } from "./landing.cache.js";
import { NotFoundError, ConflictError } from "../../utils/errors/app-error.js";
import { uploadService } from "../../services/storage/upload.service.js";

class LandingPageService {
  async create(body: unknown) {
    const parsed = createLandingPageSchema.parse(body);

    // Slug unique validation
    const existing = await LandingPageRepository.findByslug(parsed.slug);
    if (existing) {
      throw new ConflictError("Landing page slug already exists.");
    }

    const data = {
      title: parsed.title,

      slug: parsed.slug,

      description: parsed.description ?? null,

      imageUrl: parsed.imageUrl || "",

      imagePublicId: parsed.imagePublicId || "",

      sections: parsed.sections ?? null,

      isPublished: parsed.isPublished,
    };

    const result = await LandingPageRepository.create(data);

    await landingPageCache.invalidateLandingPages();

    return result;
  }

  async getAll() {
    return landingPageCache.getOrSetLandingPages(() => LandingPageRepository.findAll());
  }

  async getById(id: string) {
    const landing = await landingPageCache.getOrSetLandingDetails(
      id,

      () => LandingPageRepository.findById(id)
    );

    if (!landing) {
      throw new NotFoundError("Landing page not found.");
    }

    return landing;
  }

  async getBySlug(slug: string) {
    const landing = await LandingPageRepository.findByslug(slug);

    if (!landing) {
      throw new NotFoundError("Landing page not found.");
    }

    return landing;
  }

  async update(id: string, body: unknown) {
    const existingPage = await LandingPageRepository.findById(id);
    if (!existingPage) {
      throw new NotFoundError("Landing page not found.");
    }

    const parsed = updateLandingPageSchema.parse(body);

    // Slug uniqueness check
    if (parsed.slug && parsed.slug !== existingPage.slug) {
      const existingSlug = await LandingPageRepository.findByslug(parsed.slug);
      if (existingSlug) {
        throw new ConflictError("Landing page slug already exists.");
      }
    }

    const data = {
      ...(parsed.title !== undefined && {
        title: parsed.title,
      }),

      ...(parsed.slug !== undefined && {
        slug: parsed.slug,
      }),

      ...(parsed.description !== undefined && {
        description: parsed.description,
      }),

      ...(parsed.imageUrl !== undefined && {
        imageUrl: parsed.imageUrl,
      }),

      ...(parsed.imagePublicId !== undefined && {
        imagePublicId: parsed.imagePublicId,
      }),

      ...(parsed.sections !== undefined && {
        sections: parsed.sections,
      }),

      ...(parsed.isPublished !== undefined && {
        isPublished: parsed.isPublished,
      }),
    };

    // Clean up old image if new image is provided
    if (parsed.imagePublicId && parsed.imagePublicId !== existingPage.imagePublicId) {
      if (existingPage.imagePublicId) {
        await uploadService.delete(existingPage.imagePublicId).catch((err) => {
          console.error("Failed to delete orphaned landing page image:", err);
        });
      }
    }

    const result = await LandingPageRepository.update(id, data);

    await landingPageCache.invalidateLanding(id);

    return result;
  }

  async delete(id: string) {
    const existingPage = await LandingPageRepository.findById(id);
    if (!existingPage) {
      throw new NotFoundError("Landing page not found.");
    }

    await LandingPageRepository.delete(id);

    if (existingPage.imagePublicId) {
      await uploadService.delete(existingPage.imagePublicId).catch((err) => {
        console.error("Failed to delete orphaned landing page image:", err);
      });
    }

    await landingPageCache.invalidateLanding(id);

    return {
      success: true,
    };
  }

  async publish(id: string) {
    const existingPage = await LandingPageRepository.findById(id);
    if (!existingPage) {
      throw new NotFoundError("Landing page not found.");
    }

    const result = await LandingPageRepository.publish(id);

    await landingPageCache.invalidateLanding(id);

    return result;
  }

  async unpublish(id: string) {
    const existingPage = await LandingPageRepository.findById(id);
    if (!existingPage) {
      throw new NotFoundError("Landing page not found.");
    }

    const result = await LandingPageRepository.unpublish(id);

    await landingPageCache.invalidateLanding(id);

    return result;
  }
}

export const landingPageService = new LandingPageService();
