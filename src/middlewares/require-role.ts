import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors/app-error.js";

type Role = "USER" | "ADMIN";

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Access Denied"));
    }

    next();
  };
};
