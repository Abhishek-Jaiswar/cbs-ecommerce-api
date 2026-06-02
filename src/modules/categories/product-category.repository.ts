import { prisma } from "../../lib/prisma.js";
import type { TCreateCategory, TUpdateCategory } from "./product-category.types.js";

class ProductCategoryRepository {
  async getCategories(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.category.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              children: true,
              products: true,
            },
          },
        },
      }),

      prisma.category.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: {
        slug,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });
  }

  async getCategoryTree() {
    return prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: true, // Support nested categories down to 3 levels
          },
        },
      },
    });
  }

  async createCategory(payload: TCreateCategory) {
    return prisma.category.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        excerpt: payload.excerpt ?? null,
        image: payload.image,
        storageKey: payload.storageKey,
        altText: payload.altText,
        isActive: payload.isActive ?? true,
        parentId: payload.parentId ?? null,
      },
    });
  }

  async updateCategory(id: string, payload: TUpdateCategory) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteCategory(id: string) {
    return prisma.category.delete({
      where: {
        id,
      },
    });
  }

  async getCategoriesByParentId(parentId: string | null) {
    return prisma.category.findMany({
      where: {
        parentId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}

export const productCategoryRepository = new ProductCategoryRepository();
