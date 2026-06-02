import winston from "winston";
import { Env, isDevelopment } from "../config/env.config.js";
import { getCorrelationId } from "../utils/correlationId.js";

const correlationFormat = winston.format((info) => {
  info.correlationId = getCorrelationId();
  return info;
});

const devFormat = winston.format.combine(
  correlationFormat(),
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;
    return `${timestamp} [${level}] [${correlationId}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
    }`;
  })
);
const prodFormat = winston.format.combine(
  correlationFormat(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: Env.LOG_LEVEL || "info",
  format: isDevelopment ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
      handleExceptions: true,
    }),

    new winston.transports.File({
      filename: "logs/app.log",
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],

  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
    }),
  ],

  exitOnError: false,
});
