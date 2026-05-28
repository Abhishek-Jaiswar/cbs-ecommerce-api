import type { Roles } from "../../types/global-type.js";

export type TUserRes = {
  id: string;
  name: string;
  email: string;
  role: Roles;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserPayload = {
  name: string;
  email: string;
  password: string;
};

export type TLoginPayload = Omit<TUserPayload, "name">;
