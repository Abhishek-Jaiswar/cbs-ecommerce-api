import express, { type Application, type Request, type Response } from "express";
import { correlationMiddleware } from "./utils/correlationId.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { globalErrorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";

export const startApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use(correlationMiddleware);
  app.use(requestLogger);

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
