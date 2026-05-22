import { PrismaPg } from "@prisma/adapter-pg";
import { Env } from "../config/env.config.js";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { logger } from "./winston.js";

const connectionString = Env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e: Prisma.QueryEvent) => {
  if (e.query.trim() === "SELECT 1") return;

  const isSlow = e.duration >= Env.SLOW_QUERY_THRESHOLD;
  const logLevel = isSlow ? "warn" : "info";
  const message = isSlow ? "SLOW QUERY DETECTED" : "Query";

  logger.log(logLevel, message, {
    query: e.query.toString(),
    params: e.params,
    duration: `${e.duration}ms`,
    threshold: `${Env.SLOW_QUERY_THRESHOLD}ms`,
  });
});

export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    logger.info("Database connection successful");
    return true;
  } catch (error) {
    logger.error("Database connection failed", { error });
    return false;
  }
}

export { prisma };
