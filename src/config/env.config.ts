import { z } from "zod";
import { configDotenv } from "dotenv";
configDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/mydb"),

  JWT_SECRET: z.string().default("your_jwt_secret"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "verbose", "debug"]).default("info"),
  SLOW_QUERY_THRESHOLD: z.string().transform(Number).default(10000),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Env validation failed: ", error);
      error.issues.forEach((err) => {
        console.error(`- ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

export const Env = parseEnv();

export const isProduction = Env.NODE_ENV === "production";
export const isDevelopment = Env.NODE_ENV === "development";
