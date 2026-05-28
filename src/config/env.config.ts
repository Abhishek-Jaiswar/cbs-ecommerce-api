import { z } from "zod";
import { configDotenv } from "dotenv";
configDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),

  API_VERSION: z.string().min(1),

  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/mydb"),

  JWT_SECRET: z.string().default("your_jwt_secret"),
  JWT_EXPIRES_IN: z.string().default("1h"),

  LOG_LEVEL: z.enum(["error", "warn", "info", "verbose", "debug"]).default("info"),
  SLOW_QUERY_THRESHOLD: z.string().transform(Number).default(10000),

  FRONTEND_URL: z.string().min(1).default("http://localhost:3000"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),

  MAIL_USER: z.string().min(1, { error: "Mail user is required" }),
  MAIL_PASS: z.string().min(1, { error: "Mail user is required" }),

  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
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
