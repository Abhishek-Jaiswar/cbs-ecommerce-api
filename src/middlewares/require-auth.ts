import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Env } from "../config/env.config.js";
import type { JwtPayload } from "../types/global-type.js";
import { UnauthorizedError } from "../utils/errors/app-error.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing.",
      });
    }

    const payload = jwt.verify(token, Env.JWT_SECRET) as JwtPayload;

    req.user = {
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error(error);
    next(new UnauthorizedError("Invalid or expired token."));
  }
};
