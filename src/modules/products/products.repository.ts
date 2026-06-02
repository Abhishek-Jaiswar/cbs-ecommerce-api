import { prisma } from "../../lib/prisma.js";
import type {
  TBasicInfoDTO,
  TProductColorDTO,
  TProductSizeDTO,
  TProductVariantDTO,
} from "./product.schema.js";

class ProductRepository {
  async getProductsForListing(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          excerpt: true,
          price: true,
          originalPrice: true,
          isNew: true,
          isFeatured: true,
          isSale: true,
          offerEnds: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.product.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: {
        id,
      },
    });
  }

  async createBasicInfo(payload: TBasicInfoDTO) {
    return prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        brandId: payload.brandId,
        categoryId: payload.categoryId,
        excerpt: payload.excerpt,
        description: payload.description,
        price: payload.price,
        originalPrice: payload.originalPrice ?? null,
        isSale: payload.isSale,
        isFeatured: payload.isFeatured,
        isNew: payload.isNew,
        forListing: payload.forListing,
        offerEnds: payload.offerEnds ?? null,
      },

      select: {
        id: true,
      },
    });
  }

  async updateOrCreateProductColors(productId: string, paylaod: TProductColorDTO) {
    return prisma.productColor.upsert({
      where: {
        productId_name: {
          productId,
          name: paylaod.name,
        },
      },
      create: {
        productId,
        name: paylaod.name,
        hex: paylaod.hex,
      },
      update: {
        hex: paylaod.hex,
      },
    });
  }

  async updateOrCreateProductSizes(productId: string, paylaod: TProductSizeDTO) {
    return prisma.productSize.upsert({
      where: {
        productId_value: {
          productId,
          value: paylaod.value,
        },
      },
      create: {
        productId,
        value: paylaod.value,
      },
      update: {
        value: paylaod.value,
      },
    });
  }

}

export const productRepository = new ProductRepository();
