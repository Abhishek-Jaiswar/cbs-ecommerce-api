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
    .create(data);

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