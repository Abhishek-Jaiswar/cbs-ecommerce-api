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
        cart: {
          create: {},
        },
        wishlist: {
          create: {},
        },
      },

      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
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
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        cart: {
          include: {
            items: true,
          },
        },
        wishlist: {
          include: {
            items: true,
          },
        },
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
        omit: {
          password: true,
        },
      }),

      prisma.user.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

  async updateUser(userId: string, data: { name?: string; role?: "USER" | "ADMIN"; emailVerified?: boolean }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      omit: { password: true },
    });
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
      },
      omit: { password: true },
    });
  }
}

export const userRepository = new UserRepository();
