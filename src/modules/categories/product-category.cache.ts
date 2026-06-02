import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const CATEGORY_CACHE_TTL_SECONDS = 60 * 60; // 1 hour (categories are read-heavy and updated infrequently)
const CATEGORY_VERSION_FALLBACK = 1;
const CATEGORY_LIST_VERSION_KEY = "category:list:version";
const CATEGORY_TREE_VERSION_KEY = "category:tree:version";
const CATEGORY_CHILDREN_VERSION_KEY = "category:children:version";

const buildCategoryDetailsKey = (id: string) => `category:details:${id}`;
const buildCategorySlugKey = (slug: string) => `category:slug:${slug}`;
const buildCategoryListKey = (version: number, page: number, limit: number) =>
  `category:list:v${version}:page:${page}:limit:${limit}`;
const buildCategoryTreeKey = (version: number) => `category:tree:v${version}`;
const buildCategoryChildrenKey = (version: number, parentId: string) =>
  `category:children:v${version}:${parentId}`;

class ProductCategoryCache {
  private async getListVersion() {
    return cacheService.getNumber(CATEGORY_LIST_VERSION_KEY, CATEGORY_VERSION_FALLBACK);
  }

  private async getTreeVersion() {
    return cacheService.getNumber(CATEGORY_TREE_VERSION_KEY, CATEGORY_VERSION_FALLBACK);
  }

  private async getChildrenVersion() {
    return cacheService.getNumber(CATEGORY_CHILDREN_VERSION_KEY, CATEGORY_VERSION_FALLBACK);
  }

  async getOrSetCategoryDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildCategoryDetailsKey(id), CATEGORY_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetCategorySlug<T>(slug: string, producer: () => Promise<T>) {
    return cacheService.remember(buildCategorySlugKey(slug), CATEGORY_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetCategoryList<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildCategoryListKey(version, page, limit),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  async getOrSetCategoryTree<T>(producer: () => Promise<T>) {
    const version = await this.getTreeVersion();
    return cacheService.remember(
      buildCategoryTreeKey(version),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  async getOrSetCategoryChildren<T>(parentId: string | null, producer: () => Promise<T>) {
    const version = await this.getChildrenVersion();
    const parentKey = parentId ?? "root";
    return cacheService.remember(
      buildCategoryChildrenKey(version, parentKey),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateCategoryLists() {
    const nextVersion = await cacheService.increment(CATEGORY_LIST_VERSION_KEY);
    logger.info("Category lists cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateCategoryTree() {
    const nextVersion = await cacheService.increment(CATEGORY_TREE_VERSION_KEY);
    logger.info("Category tree cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateCategoryChildren() {
    const nextVersion = await cacheService.increment(CATEGORY_CHILDREN_VERSION_KEY);
    logger.info("Category children cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateCategory(id: string, slug?: string) {
    const keysToDelete = [buildCategoryDetailsKey(id)];
    if (slug) {
      keysToDelete.push(buildCategorySlugKey(slug));
    }

    const deletedCount = await cacheService.delete(...keysToDelete);
    logger.info("Individual category details cache invalidated", {
      id,
      slug,
      deletedCount,
    });

    // Invalidate aggregated caches
    await Promise.all([
      this.invalidateCategoryLists(),
      this.invalidateCategoryTree(),
      this.invalidateCategoryChildren(),
    ]);
  }
}

export const productCategoryCache = new ProductCategoryCache();
