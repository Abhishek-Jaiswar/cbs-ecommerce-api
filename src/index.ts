import { startApp } from "./app.js";
import { Env } from "./config/env.config.js";
import { testConnection } from "./lib/prisma.js";
import { logger } from "./lib/winston.js";

const startServer = async () => {
  try {
    const app = startApp();
    await testConnection();

    const server = app.listen(Env.PORT, () => {
      logger.info(`Server started successfully `, {
        port: `http://localhost:${Env.PORT}`,
        environment: Env.NODE_ENV,
      });
    });

    const gracefullShutdown = (signal: string) => {
      logger.info(`${signal} recieved, starting gracefull shutdown...`);

      server.close(() => {
        logger.warn("HTTP Server closed");
        logger.info("Gracefull shutdown completed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout...");
        process.exit(1);
      }, 3000);
    };

    process.on("SIGTERM", () => gracefullShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefullShutdown("SIGNINT"));

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled Rejection", err);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server: ", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
};

startServer();
