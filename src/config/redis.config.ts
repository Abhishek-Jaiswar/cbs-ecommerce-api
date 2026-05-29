import { Redis } from "ioredis";
import { logger } from "../lib/winston.js";
import { Env } from "./env.config.js";

export const redis = new Redis(Env.REDIS_URL, {
  lazyConnect: true,
});

export const testRedisConnection = async (): Promise<void> => {
  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    const response = await redis.ping();

    if (response != "PONG") {
      throw new Error(`Unexpected PING response: , ${response}`);
    }

    logger.info(`Redis server replied: #${response}`);
    logger.info("Redis is ready, PING/PONG health check passed.");
  } catch (error) {
    logger.error("Redis health-check failed.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const closedConnection = async (): Promise<void> => {
  try {
    if (redis.status === "ready") {
      await redis.quit();
      logger.info("Redis connection closed gracefully.");
    } else {
      logger.info(
        `Redis connection not in a closable state (status: ${redis.status}), skipping quit.`
      );
    }
  } catch (error) {
    logger.error(
      `Failed to close Redis connection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
