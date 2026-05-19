import express, { type Application, type Request, type Response } from "express";

export const startApp = (): Application => {
  const app = express();

  app.get("/", (req: Request, res: Response) => {
    return res.send({
      status: "Working fine",
      load: "Will be calculated",
    });
  });

  return app;
};
