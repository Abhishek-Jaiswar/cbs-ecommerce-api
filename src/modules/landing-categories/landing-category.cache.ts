import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const LANDING_CATEGORY_CACHE_TTL_SECONDS = 60 * 10; // 10 minutes

const buildActiveBannersKey = () => "landing-category:active";

class LandingCategoryCache {
  async getOrSetActiveBanners<T>(producer: () => Promise<T>) {
    return cacheService.remember(
      buildActiveBannersKey(),
      LANDING_CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateActiveBanners() {
    const deletedCount = await cacheService.delete(buildActiveBannersKey());

    logger.info("Landing categories active cache invalidated", {
      deletedCount,
    });
  }
}

export const landingCategoryCache = new LandingCategoryCache();
