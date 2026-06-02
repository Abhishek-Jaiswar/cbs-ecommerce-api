import { prisma } from "../../lib/prisma.js";
import type { TCreateProductTag, TUpdateProductTag } from "./product-tags.types.js";

class ProductTagRepository {
  async getProductTags(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.tag.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),

      prisma.tag.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductTagById(id: string) {
    return prisma.tag.findUnique({
      where: {
        id,
      },
    });
  }

  async getProductTagBySlug(slug: string) {
    return prisma.tag.findUnique({
      where: {
        slug,
      },
    });
  }

  async createProductTag(payload: TCreateProductTag) {
    return prisma.tag.create({
      data: payload,
    });
  }

  async updateProductTag(id: string, payload: TUpdateProductTag) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.tag.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteProductTag(id: string) {
    return prisma.tag.delete({
      where: {
        id,
      },
    });
  }
}

export const productTagRepository = new ProductTagRepository();
