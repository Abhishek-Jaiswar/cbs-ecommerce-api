import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const BRAND_CACHE_TTL_SECONDS = 60 * 60; // 1 hour (brands are read-heavy and updated infrequently)
const BRAND_VERSION_FALLBACK = 1;
const BRAND_LIST_VERSION_KEY = "brand:list:version";

const buildBrandDetailsKey = (id: string) => `brand:details:${id}`;
const buildBrandListKey = (version: number, page: number, limit: number) =>
  `brand:list:v${version}:page:${page}:limit:${limit}`;

class BrandCache {
  private async getListVersion() {
    return cacheService.getNumber(BRAND_LIST_VERSION_KEY, BRAND_VERSION_FALLBACK);
  }

  async getOrSetBrandDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildBrandDetailsKey(id), BRAND_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetBrandList<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildBrandListKey(version, page, limit),
      BRAND_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateBrandLists() {
    const nextVersion = await cacheService.increment(BRAND_LIST_VERSION_KEY);
    logger.info("Brand lists cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateBrand(id: string) {
    const deletedCount = await cacheService.delete(buildBrandDetailsKey(id));
    logger.info("Individual brand cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateBrandLists();
  }
}

export const brandCache = new BrandCache();
