import type { Request, Response } from "express";
import { getCorrelationId } from "../utils/correlationId.js";
import { logger } from "../lib/winston.js";
import type { ErrorResponse } from "../types/error-response.js";

export const notFoundHandler = (req: Request, res: Response): void => {
  const correlationId = getCorrelationId();

  logger.warn("Route not found: ", {
    correlationId,
    path: req.url,
    method: req.method,
  });

  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    correlationId,
  } as ErrorResponse);
};
