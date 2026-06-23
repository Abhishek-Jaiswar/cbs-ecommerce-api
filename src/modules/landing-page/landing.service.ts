import {
  createLandingPageSchema,
  updateLandingPageSchema,
} from "./landing.schema.js";

import {
  LandingPageRepository,
} from "./landing.repository.js";

import {
  landingPageCache,
} from "./landing.cache.js";

class LandingPageService {

  async create(
    body: unknown
  ) {

    const parsed =
      createLandingPageSchema
      .parse(body);

    const data = {

      title:
        parsed.title,

      slug:
        parsed.slug,

      description:
        parsed.description ?? null,

      imageUrl:
        parsed.imageUrl,

      imagePublicId:
        parsed.imagePublicId,

      sections:
        parsed.sections ?? null,

      isPublished:
        parsed.isPublished,

    };

    const result =
      await LandingPageRepository
      .create(data);

    await landingPageCache
      .invalidateLandingPages();

    return result;

  }

  async getAll() {

    return landingPageCache
      .getOrSetLandingPages(
        () =>
          LandingPageRepository
          .findAll()
      );

  }

  async getById(
    id: string
  ) {

    return landingPageCache
      .getOrSetLandingDetails(

        id,

        () =>
          LandingPageRepository
          .findById(id)

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

    const parsed =
      updateLandingPageSchema
      .parse(body);

    const data = {

      ...(parsed.title !== undefined && {
        title:
        parsed.title,
      }),

      ...(parsed.slug !== undefined && {
        slug:
        parsed.slug,
      }),

      ...(parsed.description !== undefined && {
        description:
        parsed.description,
      }),

      ...(parsed.imageUrl !== undefined && {
        imageUrl:
        parsed.imageUrl,
      }),

      ...(parsed.imagePublicId !== undefined && {
        imagePublicId:
        parsed.imagePublicId,
      }),

      ...(parsed.sections !== undefined && {
        sections:
        parsed.sections,
      }),

      ...(parsed.isPublished !== undefined && {
        isPublished:
        parsed.isPublished,
      }),

    };

    const result =
      await LandingPageRepository
      .update(
        id,
        data
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
      .invalidateLanding(id);

    return result;

  }

  async unpublish(
    id: string
  ) {

    const result =
      await LandingPageRepository
      .publish(id);

    await landingPageCache
      .invalidateLanding(id);

    return result;

  }

}

export const landingPageService =
new LandingPageService();