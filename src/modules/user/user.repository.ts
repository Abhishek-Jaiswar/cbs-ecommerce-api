import { prisma } from "../../lib/prisma.js";
import type { TUserPayload } from "./user.types.js";

class UserRepository {
  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async createUser(payload: TUserPayload) {
    return await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  async markEmailAsVerified(userId: string) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });
  }

  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });
  }

  async getAllUsers(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.user.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async updatePassword(userId: string, password: string) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password,
      },

      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });
  }
}

export const userRepository = new UserRepository();
