import { redis } from "../../config/redis.config.js";
import { logger } from "../winston.js";

class CacheService {
  async set(key: string, value: string, ttlSeconds: number) {
    try {
      await redis.set(key, value, "EX", ttlSeconds);
    } catch (error) {
      logger.warn("Failed to set cache value", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async get(key: string) {
    try {
      return await redis.get(key);
    } catch (error) {
      logger.warn("Failed to get cache value", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  async remember<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    try {
      const cachedValue = await redis.get(key);

      if (cachedValue) {
        logger.debug("Cache hit", { key });
        return JSON.parse(cachedValue) as T;
      }

      logger.debug("Cache miss", { key });
    } catch (error) {
      logger.warn("Failed to read value from cache", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const freshValue = await producer();

    try {
      await redis.set(key, JSON.stringify(freshValue), "EX", ttlSeconds);
      logger.debug("Cache populated", { key, ttlSeconds });
    } catch (error) {
      logger.warn("Failed to write value to cache", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return freshValue;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    try {
      const value = await redis.get(key);
      const parsedValue = Number(value ?? fallback);

      return Number.isFinite(parsedValue) ? parsedValue : fallback;
    } catch (error) {
      logger.warn("Failed to read numeric value from cache", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      return fallback;
    }
  }

  /**
   * Bumps a cache version counter. Readers treat a missing key as their
   * fallback (0 or 1), and a plain INCR on a missing key returns 1, so the
   * first invalidation after a deploy or Redis flush would change nothing.
   * A missing key therefore starts at 2, atomically.
   */
  async increment(key: string): Promise<number | null> {
    try {
      const next = await redis.eval(
        "if redis.call('EXISTS', KEYS[1]) == 0 then redis.call('SET', KEYS[1], 1) end return redis.call('INCR', KEYS[1])",
        1,
        key
      );
      return Number(next);
    } catch (error) {
      logger.warn("Failed to increment cache value", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    try {
      return await redis.del(...keys);
    } catch (error) {
      logger.warn("Failed to delete cache keys", {
        keys,
        error: error instanceof Error ? error.message : String(error),
      });

      return 0;
    }
  }
}

export const cacheService = new CacheService();
