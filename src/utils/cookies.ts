import type { Response } from "express";
import { isDevelopment, Env } from "../config/env.config.js";

export const setAuthCookies = (res: Response, token: string) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: Env.COOKIE_SAME_SITE || (isDevelopment ? "lax" : "none"),
    domain: Env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: Env.COOKIE_SAME_SITE || (isDevelopment ? "lax" : "none"),
    domain: Env.COOKIE_DOMAIN,
    path: "/",
  });
};
