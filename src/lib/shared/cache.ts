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

  async increment(key: string): Promise<number | null> {
    try {
      return await redis.incr(key);
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
