import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const REVIEW_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const REVIEW_VERSION_FALLBACK = 1;

const buildProductReviewListVersionKey = (productId: string) =>
  `reviews:product:${productId}:version`;
const buildProductReviewListKey = (
  productId: string,
  version: number,
  page: number,
  limit: number
) => `reviews:product:${productId}:v${version}:page:${page}:limit:${limit}`;
const buildReviewDetailsKey = (id: string) => `reviews:details:${id}`;

class ReviewCache {
  private async getProductReviewListVersion(productId: string) {
    return cacheService.getNumber(
      buildProductReviewListVersionKey(productId),
      REVIEW_VERSION_FALLBACK
    );
  }

  async getOrSetProductReviews<T>(
    productId: string,
    page: number,
    limit: number,
    producer: () => Promise<T>
  ) {
    const version = await this.getProductReviewListVersion(productId);
    return cacheService.remember(
      buildProductReviewListKey(productId, version, page, limit),
      REVIEW_CACHE_TTL_SECONDS,
      producer
    );
  }

  async getOrSetReviewDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildReviewDetailsKey(id), REVIEW_CACHE_TTL_SECONDS, producer);
  }

  async invalidateProductReviews(productId: string) {
    const nextVersion = await cacheService.increment(buildProductReviewListVersionKey(productId));
    logger.info("Product reviews list cache version incremented (invalidated)", {
      productId,
      nextVersion,
    });
  }

  async invalidateReview(id: string, productId: string) {
    const deletedCount = await cacheService.delete(buildReviewDetailsKey(id));
    logger.info("Individual review cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateProductReviews(productId);
  }
}

export const reviewCache = new ReviewCache();
