import { prisma } from "../../lib/prisma.js";
import type { TCreateBrand, TUpdateBrandImage } from "./brands.types.js";

class BrandRepository {
  async getBrands(page: number, limit: number) {
    const [itmes, total] = await prisma.$transaction([
      prisma.productBrand.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          image: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.productBrand.count(),
    ]);

    return {
      itmes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBrandsById(brandId: string) {
    return prisma.productBrand.findUnique({
      where: {
        id: brandId,
      },
      select: {
        id: true,
        name: true,
        image: true,
        storageKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createBrand(payload: TCreateBrand) {
    return prisma.productBrand.create({
      data: {
        name: payload.name,
        image: payload.image,
        storageKey: payload.storageKey,
        altText: payload.altText ?? null,
      },
    });
  }

  async deleteBrand(brandId: string) {
    return prisma.productBrand.delete({
      where: {
        id: brandId,
      },
    });
  }

  async updateBrandImage(brandId: string, payload: TUpdateBrandImage) {
    return prisma.productBrand.update({
      where: {
        id: brandId,
      },
      data: {
        image: payload.image,
        storageKey: payload.storageKey,
      },
    });
  }

  async updateBrand(brandId: string, payload: Partial<TCreateBrand>) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.productBrand.update({
      where: {
        id: brandId,
      },
      data,
    });
  }
}

export const brandRepository = new BrandRepository();
