import {
  createLandingPageSchema,
  updateLandingPageSchema,
} from "./landing.schema.js";

import { LandingPageRepository }
from "./landing.repository.js";

import { landingPageCache }
from "./landing.cache.js";

class LandingPageService {

  async create(
    body: unknown
  ) {

    const data =
    createLandingPageSchema
    .parse(body);

    const result =
    await LandingPageRepository
    .create({
      title: data.title,
      slug: data.slug,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
      isPublished: data.isPublished,
      description: data.description ?? null,
      sections: data.sections,
    });

    await landingPageCache
    .invalidateLandingPages();

    return result;

  }

  async getAll() {

    return landingPageCache
    .getOrSetLandingPages(

      async () => {

        return LandingPageRepository
        .findAll();

      }

    );

  }

  async getById(
    id: string
  ) {

    return landingPageCache
    .getOrSetLandingDetails(

      id,

      async () => {

        return LandingPageRepository
        .findById(id);

      }

    );

  }

  async getBySlug(
    slug: string
  ) {

    return LandingPageRepository
    .findByslug(slug);

  }

  async update(
    id: string,

    body: unknown
  ) {

    const data =
    updateLandingPageSchema
    .parse(body);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imagePublicId !== undefined) updateData.imagePublicId = data.imagePublicId;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.sections !== undefined) updateData.sections = data.sections;
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }

    const result =
    await LandingPageRepository
    .update(
      id,
      updateData
    );

    await landingPageCache
    .invalidateLanding(
      id
    );

    return result;

  }

  async delete(
    id: string
  ) {

    await LandingPageRepository
    .remove(id);

    await landingPageCache
    .invalidateLanding(
      id
    );

    return {
      success: true,
    };

  }

  async publish(
    id: string
  ) {

    const result =
    await LandingPageRepository
    .publish(id);

    await landingPageCache
    .invalidateLanding(
      id
    );

    return result;

  }

  async unpublish(
    id: string
  ) {

    const result =
    await LandingPageRepository
    .publish(id);

    await landingPageCache
    .invalidateLanding(
      id
    );

    return result;

  }

}

export const landingPageService =
new LandingPageService();