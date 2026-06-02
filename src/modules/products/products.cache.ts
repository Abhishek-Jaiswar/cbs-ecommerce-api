import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const PRODUCT_CACHE_TTL_SECOND = 60 * 30;
const PRODUCT_VERSION_FALLBACK = 1;
const PRODUCT_LIST_VERSION_KEY = "product:list:version";

const buildProductDetailsKey = (id: string) => `product:details:${id}`;
const buildProductListKey = (version: number, page: number, limit: number) =>
  `product:list:v${version}:${page}:${limit}`;

class ProductCache {
  private async getListVersion() {
    return cacheService.getNumber(PRODUCT_LIST_VERSION_KEY, PRODUCT_VERSION_FALLBACK);
  }

  async getOrSetProductDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildProductDetailsKey(id), PRODUCT_CACHE_TTL_SECOND, producer);
  }

  async getOrSetProductLists<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildProductListKey(version, page, limit),
      PRODUCT_CACHE_TTL_SECOND,
      producer
    );
  }

  async invalidateProductLists() {
    const nextVersion = await cacheService.increment(PRODUCT_LIST_VERSION_KEY);
    logger.info("Product lists cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateProducts(id: string) {
    const deletedCount = await cacheService.delete(buildProductDetailsKey(id));
    logger.info("Individual product cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateProductLists();
  }
}

export const productCache = new ProductCache();
