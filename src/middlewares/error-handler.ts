import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";

import { getCorrelationId } from "../utils/correlationId.js";
import { isDevelopment } from "../config/env.config.js";
import { logger } from "../lib/winston.js";
import type { ErrorResponse } from "../types/error-response.js";

interface AppError extends Error {
  statusCode?: number;
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal server error";

  const correlationId = getCorrelationId();

  const response: ErrorResponse = {
    status: "error",
    message,
    correlationId,
  };

  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  logger.error("API Error", {
    correlationId,
    message,
    statusCode,
    stack: isDevelopment ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(statusCode).json(response);
};
