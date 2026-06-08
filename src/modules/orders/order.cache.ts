import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const ORDER_CACHE_TTL_SECONDS = 60 * 60 * 3;
const ORDER_VERSION_FALLBACK = 0;
const ORDER_LIST_VERSION_KEY = "order:list:version";

const buildOrderDetailsKey = (orderId: string) => `order:details:${orderId}`;
const buildOrdersListKey = (version: number, page: number, limit: number, userId?: string) =>
  userId
    ? `order:list:user:${userId}:v${version}:${page}:${limit}`
    : `order:list:all:v${version}:${page}:${limit}`;

class OrderCache {
  async getListVersion() {
    return await cacheService.getNumber(ORDER_LIST_VERSION_KEY, ORDER_VERSION_FALLBACK);
  }

  async getOrSetOrderDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildOrderDetailsKey(id), ORDER_CACHE_TTL_SECONDS, producer);
  }

  async geOrSetOrderLists<T>(
    page: number,
    limit: number,
    userId: string | undefined,
    producer: () => Promise<T>
  ) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildOrdersListKey(version, page, limit, userId),
      ORDER_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateOrderLists() {
    const nextVersion = await cacheService.increment(ORDER_LIST_VERSION_KEY);
    logger.info("Order lists cache version incremented (invalidated)", {
      nextVersion,
    });
  }

  async invalidateOrders(id: string) {
    const deletedCount = await cacheService.delete(buildOrderDetailsKey(id));
    logger.info("Individual product cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateOrderLists();
  }
}

export const orderCache = new OrderCache();
