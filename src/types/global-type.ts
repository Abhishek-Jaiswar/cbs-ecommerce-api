export type Roles = "USER" | "ADMIN";

export type JwtPayload = {
  userId: string;
  name: string;
  email: string;
  role: Roles;
};
