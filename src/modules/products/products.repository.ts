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
        colors: true,
        sizes: true,
        brand: true,
        category: true,
        images: {
          include: {
            media: true,
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

  async createBasicInfo(payload: TBasicInfoDTO) {
    return prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        brandId: payload.brandId,
        categoryId: payload.categoryId,

        productTags: {
          create: payload.tagIds.map((tagId) => ({
            tagId,
          })),
        },

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
}

export const productRepository = new ProductRepository();
