import express, { type Application, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { correlationMiddleware } from "./utils/correlationId.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { globalErrorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { Env } from "./config/env.config.js";
import authRoutes from "../src/modules/user/user.routes.js";

export const startApp = (): Application => {
  const app = express();

  const allowedOrigins = new Set(
    Env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  app.set("trust proxy", false); // in production this must be 1
  app.use(helmet());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.disable("x-powered-by");

  app.use(correlationMiddleware);
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(`/api/${Env.API_VERSION}`, apiLimiter);
  app.use(`/api/${Env.API_VERSION}/auth`, authRoutes);
  
  app.get("/", (_req: Request, res: Response) => {
    return res.send({
      status: "Working fine",
      load: "Will be calculated",
    });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
