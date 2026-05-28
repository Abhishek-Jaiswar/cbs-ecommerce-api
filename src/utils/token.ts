import { Env } from "../config/env.config.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/global-type.js";

export function generateAccessToken(payload: JwtPayload) {
  const token = jwt.sign(payload, Env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return token;
}
