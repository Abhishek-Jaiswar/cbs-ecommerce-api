import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const BLOG_CACHE_TTL_SECONDS =
  60 * 60;

const BLOG_VERSION_FALLBACK =
  1;

const BLOG_LIST_VERSION_KEY =
  "blog-post:list:version";

const buildPostDetailsKey = (
  id: string
) =>
  `blog-post:details:${id}`;

const buildPostSlugKey = (
  slug: string
) =>
  `blog-post:slug:${slug}`;

const buildPostListKey = (
  version: number,
  page: number,
  limit: number
) =>
  `blog-post:list:v${version}:page:${page}:limit:${limit}`;

class BlogPostCache {
  private async getListVersion() {
    return cacheService.getNumber(
      BLOG_LIST_VERSION_KEY,

      BLOG_VERSION_FALLBACK
    );
  }

  async getOrSetPostDetails<T>(
    id: string,

    producer: () => Promise<T>
  ) {
    return cacheService.remember(
      buildPostDetailsKey(id),

      BLOG_CACHE_TTL_SECONDS,

      producer
    );
  }

  async getOrSetPostSlug<T>(
    slug: string,

    producer: () => Promise<T>
  ) {
    return cacheService.remember(
      buildPostSlugKey(slug),

      BLOG_CACHE_TTL_SECONDS,

      producer
    );
  }

  async getOrSetPostList<T>(
    page: number,

    limit: number,

    producer: () => Promise<T>
  ) {
    const version =
      await this.getListVersion();

    return cacheService.remember(
      buildPostListKey(
        version,
        page,
        limit
      ),

      BLOG_CACHE_TTL_SECONDS,

      producer
    );
  }

  async invalidatePostLists() {
    const nextVersion =
      await cacheService.increment(
        BLOG_LIST_VERSION_KEY
      );

    logger.info(
      "Blog post lists invalidated",

      {
        nextVersion,
      }
    );
  }

  async invalidatePost(
    id: string,

    slug?: string
  ) {
    const keys = [
      buildPostDetailsKey(id),
    ];

    if (slug) {
      keys.push(
        buildPostSlugKey(
          slug
        )
      );
    }

    const deleted =
      await cacheService.delete(
        ...keys
      );

    logger.info(
      "Blog post cache invalidated",

      {
        id,

        slug,

        deleted,
      }
    );

    await this.invalidatePostLists();
  }
}

export const blogPostCache =
  new BlogPostCache();