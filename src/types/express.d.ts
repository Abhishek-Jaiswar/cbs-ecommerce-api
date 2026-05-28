import "express";
import type { Roles } from "./global-type";

declare module "express" {
  interface Request {
    user?: {
      userId: string;
      role: Roles;
      name: string;
      email: string;
    };
  }
}
