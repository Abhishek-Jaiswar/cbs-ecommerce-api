import { prisma } from "../../lib/prisma.js";
import type { Prisma, ProductStatus } from "../../generated/prisma/client.js";
import type {
  TBasicInfoDTO,
  TProductColorDTO,
  TProductSizeDTO,
  TProductSpecificationDTO,
  TProductVariantWithSku,
} from "./product.schema.js";
import type { TProductImageUpload } from "./product.types.js";

class ProductRepository {
  async getProductsForListing(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: "ACTIVE",
          forListing: true,
        },
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
          forListing: true,
          categoryId: true,
          brandId: true,
          createdAt: true,
          brand: {
            select: {
              name: true,
            },
          },
          productTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          variants: {
            select: {
              id: true,
              stock: true,
            },
          },
          colors: {
            select: {
              id: true,
              name: true,
              hex: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.product.count({
        where: {
          status: "ACTIVE",
          forListing: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductsForAdmin(page: number, limit: number) {
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
          costPrice: true,
          isNew: true,
          isFeatured: true,
          isSale: true,
          offerEnds: true,
          forListing: true,
          categoryId: true,
          status: true,
          brandId: true,
          createdAt: true,
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
      include: {
        colors: true,
        sizes: true,
        brand: true,
        category: true,
        images: {
          include: {
            media: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        variants: true,
        reviews: true,
        offers: true,
        productTags: true,
        specification: true,
      },
    });
  }

  async getProductBySlug(slug: string) {
    return await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        colors: {
          omit: {
            productId: true,
          },
        },
        sizes: {
          omit: {
            productId: true,
          },
        },
        brand: {
          omit: {
            createdAt: true,
            updatedAt: true,
            storageKey: true,
          },
        },
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
            image: true,
            altText: true,
          },
        },
        images: {
          omit: {
            mediaId: true,
            productId: true,
          },
          include: {
            media: {
              select: {
                id: true,
                url: true,
                altText: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            stock: true,
            price: true,
            size: {
              select: {
                id: true,
                value: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                hex: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
        productTags: {
          omit: {
            productId: true,
            tagId: true,
          },
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        specification: {
          omit: {
            productId: true,
          },
        },
      },
    });
  }

  async createBasicInfo(payload: TBasicInfoDTO) {
    return prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId,

        productTags: {
          create: payload.tagIds.map((tagId) => ({
            tagId,
          })),
        },

        excerpt: payload.excerpt,
        description: payload.description,
        price: payload.price,
        originalPrice: payload.originalPrice,
        costPrice: payload.costPrice,
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

  async updateBasicInfo(productId: string, payload: Partial<TBasicInfoDTO>) {
    const data: Prisma.ProductUpdateInput = {
      ...Object.fromEntries(
        Object.entries(payload).filter(([k, v]) => v !== undefined && k !== "tagIds")
      ),
    };

    if (payload.tagIds !== undefined) {
      data.productTags = {
        deleteMany: {},
        create: payload.tagIds.map((tagId) => ({
          tagId,
        })),
      };
    }

    return prisma.product.update({
      where: {
        id: productId,
      },
      data,
    });
  }

  async getProductVariantById(variantId: string) {
    return prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
    });
  }

  async getProductImageById(imageId: string) {
    return prisma.productImage.findUnique({
      where: {
        id: imageId,
      },
      include: {
        media: true,
      },
    });
  }

  async deleteProduct(productId: string) {
    return prisma.product.delete({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });
  }

  async updateOrCreateProductColors(productId: string, payload: TProductColorDTO) {
    return prisma.productColor.upsert({
      where: {
        productId_name: {
          productId,
          name: payload.name,
        },
      },
      create: {
        productId,
        name: payload.name,
        hex: payload.hex,
      },
      update: {
        hex: payload.hex,
      },
    });
  }

  async getProductColorById(colorId: string) {
    return prisma.productColor.findUnique({
      where: {
        id: colorId,
      },
    });
  }

  async deleteProductColor(colorId: string) {
    return prisma.productColor.delete({
      where: {
        id: colorId,
      },

      select: {
        id: true,
      },
    });
  }

  async getProductSizesById(sizeId: string) {
    return prisma.productSize.findUnique({
      where: {
        id: sizeId,
      },
    });
  }

  async updateOrCreateProductSizes(productId: string, payload: TProductSizeDTO) {
    return prisma.productSize.upsert({
      where: {
        productId_value: {
          productId,
          value: payload.value,
        },
      },
      create: {
        productId,
        value: payload.value,
      },
      update: {
        value: payload.value,
      },
    });
  }

  async deleteProductSize(sizeId: string) {
    return prisma.productSize.delete({
      where: {
        id: sizeId,
      },
      select: {
        id: true,
      },
    });
  }

  async createProductVariant(productId: string, payload: TProductVariantWithSku) {
    return prisma.productVariant.create({
      data: {
        productId,
        colorId: payload.colorId,
        sizeId: payload.sizeId,
        stock: payload.stock,
        price: payload.price,
        sku: payload.sku,
      },
    });
  }

  async deleteProductVariant(variantId: string) {
    return prisma.productVariant.delete({
      where: {
        id: variantId,
      },

      select: {
        id: true,
      },
    });
  }

  async uploadProductImageMedia(payload: TProductImageUpload[]) {
    return prisma.$transaction(async (tx) => {
      const createdImages = [];

      for (const item of payload) {
        const media = await tx.media.create({
          data: item.media,
        });

        const image = await tx.productImage.create({
          data: {
            ...item.productImage,
            mediaId: media.id,
          },
          select: {
            id: true,
            mediaId: true,
          },
        });

        createdImages.push(image);
      }

      return createdImages;
    });
  }

  async deleteMedia(mediaId: string) {
    return prisma.media.delete({
      where: {
        id: mediaId,
      },
      select: {
        id: true,
      },
    });
  }

  async deleteProductImageAndPromote(mediaId: string, productId: string, isPrimary: boolean) {
    return prisma.$transaction(async (tx) => {
      await tx.media.delete({
        where: {
          id: mediaId,
        },
      });

      if (isPrimary) {
        const firstRemaining = await tx.productImage.findFirst({
          where: {
            productId,
          },
          orderBy: {
            position: "asc",
          },
        });

        if (firstRemaining) {
          await tx.productImage.update({
            where: {
              id: firstRemaining.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }
      }
    });
  }

  async deleteManyMedia(mediaIds: string[]) {
    return prisma.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });
  }

  async deleteProductImage(productImageId: string) {
    return prisma.productImage.delete({
      where: {
        id: productImageId,
      },
      select: {
        id: true,
      },
    });
  }

  async createManyProductSpecifications(
    productId: string,
    specifications: TProductSpecificationDTO[]
  ) {
    return prisma.productSpecification.createMany({
      data: specifications.map((spec) => ({
        productId,
        key: spec.key,
        value: spec.value,
      })),
      skipDuplicates: true,
    });
  }

  async createSpecificationsAndMaybeUpdateStatus(
    productId: string,
    specifications: TProductSpecificationDTO[],
    status?: ProductStatus
  ) {
    return prisma.$transaction(async (tx) => {
      let created = null;
      if (specifications.length > 0) {
        created = await tx.productSpecification.createMany({
          data: specifications.map((spec) => ({
            productId,
            key: spec.key,
            value: spec.value,
          })),
          skipDuplicates: true,
        });
      }

      if (status) {
        await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            status,
          },
        });
      }

      return created;
    });
  }

  async deleteProductSpecification(specificationId: string) {
    return prisma.productSpecification.delete({
      where: {
        id: specificationId,
      },
      select: {
        id: true,
      },
    });
  }

  async deleteManyProductSpecification(productId: string, specificationId: string) {
    return prisma.productSpecification.deleteMany({
      where: {
        id: specificationId,
        productId,
      },
    });
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    return prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async getAllVariants(params: {
    page: number;
    limit: number;
    search?: string | undefined;
    stockStatus?: string | undefined;
  }) {
    const { page, limit, search, stockStatus } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (search) {
      where.OR = [
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          product: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (stockStatus === "OUT_OF_STOCK") {
      where.stock = 0;
    } else if (stockStatus === "LOW_STOCK") {
      where.stock = {
        gt: 0,
        lte: 10,
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          color: {
            select: {
              id: true,
              name: true,
              hex: true,
            },
          },
          size: {
            select: {
              id: true,
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.productVariant.count({ where }),
    ]);

    const [stats, lowStockCount, outOfStockCount, totalActiveVariants] = await prisma.$transaction([
      prisma.productVariant.aggregate({
        _sum: {
          stock: true,
        },
      }),
      prisma.productVariant.count({
        where: {
          stock: {
            gt: 0,
            lte: 10,
          },
        },
      }),
      prisma.productVariant.count({
        where: {
          stock: 0,
        },
      }),
      prisma.productVariant.count(),
    ]);

    const totalStock = stats._sum.stock ?? 0;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      insights: {
        totalStock,
        totalVariants: totalActiveVariants,
        outOfStockCount,
        lowStockCount,
      },
    };
  }

  async updateProductVariant(
    variantId: string,
    payload: { price?: number | null | undefined; stock?: number | undefined }
  ) {
    const data: Prisma.ProductVariantUpdateInput = {};
    if (payload.price !== undefined) {
      data.price = payload.price;
    }
    if (payload.stock !== undefined) {
      data.stock = payload.stock;
    }
    return prisma.productVariant.update({
      where: {
        id: variantId,
      },
      data,
    });
  }
}

export const productRepository = new ProductRepository();
