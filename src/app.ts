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
import categoryRoutes from "../src/modules/categories/product-category.routes.js";
import brandRoutes from "../src/modules/brands/brands.routes.js";
import addressRoutes from "../src/modules/address/address.routes.js";
import productTagRoutes from "../src/modules/product-tags/product-tags.routes.js";
import blogTagRoutes from "../src/modules/blog-tags/blog-tags.routes.js";
import reviewRoutes from "../src/modules/reviews/reviews.routes.js";
import productRoutes from "../src/modules/products/products.routes.js";
import cartRoutes from "../src/modules/cart/cart.routes.js";
import wishlistRoutes from "../src/modules/wishlist/wishlist.routes.js";
import couponRoutes from "../src/modules/coupons/coupon.routes.js";
import offerRoutes from "../src/modules/offers/offer.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import paymentRoutes from "../src/modules/payments/payment.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import announcementRoutes from "./modules/announcements/announcement.routes.js";
import blogCategoryRoutes from "./modules/blog-category/blog-categories.route.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import blogPostRoutes from "./modules/blog-post/blog-post.route.js";
import inventoryRoutes from "./modules/inventory-management/inventory.routes.js";
import os from "os";

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
  app.use("/public", express.static("public"));
  app.use(`/api/${Env.API_VERSION}/public`, express.static("public"));

  app.use(correlationMiddleware);
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000, // High limit for general browsing, page assets, and analytics
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Strict limit for auth endpoints to prevent brute-force attacks
    message: "Too many login or registration attempts, please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(`/api/${Env.API_VERSION}`, apiLimiter);
  app.use(`/api/${Env.API_VERSION}/auth/login`, authLimiter);
  app.use(`/api/${Env.API_VERSION}/auth/register`, authLimiter);
  app.use(`/api/${Env.API_VERSION}/auth/forgot-password`, authLimiter);
  app.use(`/api/${Env.API_VERSION}/auth/email-verification`, authLimiter);
  app.use(`/api/${Env.API_VERSION}/auth`, authRoutes);
  app.use(`/api/${Env.API_VERSION}/categories`, categoryRoutes);
  app.use(`/api/${Env.API_VERSION}/brands`, brandRoutes);
  app.use(`/api/${Env.API_VERSION}/addresses`, addressRoutes);
  app.use(`/api/${Env.API_VERSION}/product-tags`, productTagRoutes);
  app.use(`/api/${Env.API_VERSION}/blog-tags`, blogTagRoutes);
  app.use(`/api/${Env.API_VERSION}/reviews`, reviewRoutes);
  app.use(`/api/${Env.API_VERSION}/products`, productRoutes);
  app.use(`/api/${Env.API_VERSION}/cart`, cartRoutes);
  app.use(`/api/${Env.API_VERSION}/wishlist`, wishlistRoutes);
  app.use(`/api/${Env.API_VERSION}/coupons`, couponRoutes);
  app.use(`/api/${Env.API_VERSION}/offers`, offerRoutes);
  app.use(`/api/${Env.API_VERSION}/orders`, orderRoutes);
  app.use(`/api/${Env.API_VERSION}/payments`, paymentRoutes);
  app.use(`/api/${Env.API_VERSION}/dashboard`, dashboardRoutes);
  app.use(`/api/${Env.API_VERSION}/announcements`, announcementRoutes);
  app.use(`/api/${Env.API_VERSION}/blog-categories`, blogCategoryRoutes);
  app.use(`/api/${Env.API_VERSION}/reports`, reportsRoutes);
  app.use(`/api/${Env.API_VERSION}/blog-posts`, blogPostRoutes);
  app.use(`/api/${Env.API_VERSION}/inventory`, inventoryRoutes);

  app.get("/", (_req: Request, res: Response) => {
    const load = os.loadavg();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    return res.status(200).json({
      status: "Working fine",
      api: {
        version: Env.API_VERSION,
        environment: Env.NODE_ENV,
      },
      system: {
        load,
        freeMemory: `${Math.round(freeMem / 1024 / 1024)} MB`,
        totalMemory: `${Math.round(totalMem / 1024 / 1024)} MB`,
      },
    });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
