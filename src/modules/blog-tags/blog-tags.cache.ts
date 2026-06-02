import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const TAG_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const TAG_VERSION_FALLBACK = 1;
const TAG_LIST_VERSION_KEY = "blog-tag:list:version";

const buildTagDetailsKey = (id: string) => `blog-tag:details:${id}`;
const buildTagSlugKey = (slug: string) => `blog-tag:slug:${slug}`;
const buildTagListKey = (version: number, page: number, limit: number) =>
  `blog-tag:list:v${version}:page:${page}:limit:${limit}`;

class BlogTagCache {
  private async getListVersion() {
    return cacheService.getNumber(TAG_LIST_VERSION_KEY, TAG_VERSION_FALLBACK);
  }

  async getOrSetTagDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildTagDetailsKey(id), TAG_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetTagSlug<T>(slug: string, producer: () => Promise<T>) {
    return cacheService.remember(buildTagSlugKey(slug), TAG_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetTagList<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildTagListKey(version, page, limit),
      TAG_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateTagLists() {
    const nextVersion = await cacheService.increment(TAG_LIST_VERSION_KEY);
    logger.info("Blog tag lists cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateTag(id: string, slug?: string) {
    const keysToDelete = [buildTagDetailsKey(id)];
    if (slug) {
      keysToDelete.push(buildTagSlugKey(slug));
    }

    const deletedCount = await cacheService.delete(...keysToDelete);
    logger.info("Individual blog tag cache invalidated", {
      id,
      slug,
      deletedCount,
    });

    await this.invalidateTagLists();
  }
}

export const blogTagCache = new BlogTagCache();
