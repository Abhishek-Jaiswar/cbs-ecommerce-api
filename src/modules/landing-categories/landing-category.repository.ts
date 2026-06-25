import { prisma } from "../../lib/prisma.js";
import type { TCreateLandingCategory, TUpdateLandingCategory } from "./landing-category.types.js";

class LandingCategoryRepositoryClass {
  async findActive() {
    return prisma.landingCategory.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { slot: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  async findAll() {
    return prisma.landingCategory.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { slot: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  async findById(id: string) {
    return prisma.landingCategory.findUnique({
      where: {
        id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async create(data: TCreateLandingCategory) {
    return prisma.landingCategory.create({
      data: {
        categoryId: data.categoryId,
        label: data.label,
        image: data.image,
        storageKey: data.storageKey,
        slot: data.slot,
        isActive: data.isActive ?? true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async update(id: string, data: TUpdateLandingCategory) {
    return prisma.landingCategory.update({
      where: {
        id,
      },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.landingCategory.delete({
      where: {
        id,
      },
    });
  }
}

export const landingCategoryRepository = new LandingCategoryRepositoryClass();
