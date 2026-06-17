import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const CATEGORY_CACHE_TTL_SECONDS = 60 * 60; 

const CATEGORY_VERSION_FALLBACK = 1;

const CATEGORY_LIST_VERSION_KEY =
  "blog-category:list:version";

const buildCategoryDetailsKey = (id: string) =>
  `blog-category:details:${id}`;

const buildCategorySlugKey = (slug: string) =>
  `blog-category:slug:${slug}`;

const buildCategoryListKey = (
  version: number,
  page: number,
  limit: number
) =>
  `blog-category:list:v${version}:page:${page}:limit:${limit}`;

class BlogCategoryCache {
  
  private async getListVersion() {
    return cacheService.getNumber(
      CATEGORY_LIST_VERSION_KEY,
      CATEGORY_VERSION_FALLBACK
    );
  }

 
  async getOrSetCategoryDetails<T>(
    id: string,
    producer: () => Promise<T>
  ) {
    return cacheService.remember(
      buildCategoryDetailsKey(id),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  
  async getOrSetCategorySlug<T>(
    slug: string,
    producer: () => Promise<T>
  ) {
    return cacheService.remember(
      buildCategorySlugKey(slug),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }


  async getOrSetCategoryList<T>(
    page: number,
    limit: number,
    producer: () => Promise<T>
  ) {
    const version =
      await this.getListVersion();

    return cacheService.remember(
      buildCategoryListKey(
        version,
        page,
        limit
      ),
      CATEGORY_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateCategoryLists() {
    const nextVersion =
      await cacheService.increment(
        CATEGORY_LIST_VERSION_KEY
      );

    logger.info(
      "Category list cache invalidated",
      {
        nextVersion,
      }
    );
  }


  async invalidateCategory(
    id: string,
    slug?: string
  ) {
    const keys = [
      buildCategoryDetailsKey(id),
    ];

    if (slug) {
      keys.push(
        buildCategorySlugKey(slug)
      );
    }

    const deleted =
      await cacheService.delete(
        ...keys
      );

    logger.info(
      "Category cache invalidated",
      {
        id,
        slug,
        deleted,
      }
    );

    await this.invalidateCategoryLists();
  }
}

export const blogCategoryCache =
  new BlogCategoryCache();