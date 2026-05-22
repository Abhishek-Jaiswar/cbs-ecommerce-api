import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/winston.js";
import { getCorrelationId } from "../utils/correlationId.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info("HTTP REQUEST", {
      correlationId: getCorrelationId(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });

  next();
};
