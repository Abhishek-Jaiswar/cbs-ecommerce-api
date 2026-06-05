import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { TCreateOfferDTO, TUpdateOfferDTO } from "./offer.schema.js";

class OfferRepository {
  async getOffers(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.offer.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            select: {
              productId: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          categories: {
            select: {
              categoryId: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.offer.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOfferById(id: string) {
    return prisma.offer.findUnique({
      where: {
        id,
      },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });
  }

  async findOfferBySlug(slug: string) {
    return prisma.offer.findUnique({
      where: {
        slug,
      },
    });
  }

  async createOffer(payload: TCreateOfferDTO) {
    const { productIds, categoryIds, ...offerData } = payload;

    return prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          name: offerData.name,
          slug: offerData.slug,
          description: offerData.description || null,
          discountType: offerData.discountType,
          discountValue: offerData.discountValue,
          startsAt: offerData.startsAt,
          endsAt: offerData.endsAt || null,
          isActive: offerData.isActive,
          priority: offerData.priority,
        },
      });

      if (productIds && productIds.length > 0) {
        await tx.offerProduct.createMany({
          data: productIds.map((productId) => ({
            offerId: offer.id,
            productId,
          })),
        });
      }

      if (categoryIds && categoryIds.length > 0) {
        await tx.offerCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            offerId: offer.id,
            categoryId,
          })),
        });
      }

      return offer;
    });
  }

  async updateOffer(offerId: string, payload: TUpdateOfferDTO) {
    const { productIds, categoryIds, ...offerData } = payload;

    return prisma.$transaction(async (tx) => {
      const data: Prisma.OfferUpdateInput = {};
      if (offerData.name !== undefined) data.name = offerData.name;
      if (offerData.slug !== undefined) data.slug = offerData.slug;
      if (offerData.description !== undefined) data.description = offerData.description;
      if (offerData.discountType !== undefined) data.discountType = offerData.discountType;
      if (offerData.discountValue !== undefined) data.discountValue = offerData.discountValue;
      if (offerData.startsAt !== undefined) data.startsAt = offerData.startsAt;
      if (offerData.endsAt !== undefined) data.endsAt = offerData.endsAt;
      if (offerData.isActive !== undefined) data.isActive = offerData.isActive;
      if (offerData.priority !== undefined) data.priority = offerData.priority;

      const offer = await tx.offer.update({
        where: {
          id: offerId,
        },
        data,
      });

      // Update product associations if provided
      if (productIds !== undefined) {
        await tx.offerProduct.deleteMany({
          where: {
            offerId,
          },
        });

        if (productIds.length > 0) {
          await tx.offerProduct.createMany({
            data: productIds.map((productId) => ({
              offerId,
              productId,
            })),
          });
        }
      }

      // Update category associations if provided
      if (categoryIds !== undefined) {
        await tx.offerCategory.deleteMany({
          where: {
            offerId,
          },
        });

        if (categoryIds.length > 0) {
          await tx.offerCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              offerId,
              categoryId,
            })),
          });
        }
      }

      return offer;
    });
  }

  async updateStatus(offerId: string, isActive: boolean) {
    return prisma.offer.update({
      where: {
        id: offerId,
      },
      data: {
        isActive,
      },
    });
  }

  async deleteOffer(offerId: string) {
    return prisma.offer.delete({
      where: {
        id: offerId,
      },
    });
  }

  // Get active offers for dynamic evaluation on shop items
  async getActiveOffers() {
    const now = new Date();
    return prisma.offer.findMany({
      where: {
        isActive: true,
        startsAt: {
          lte: now,
        },
        OR: [
          {
            endsAt: null,
          },
          {
            endsAt: {
              gte: now,
            },
          },
        ],
      },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });
  }
}

export const offerRepository = new OfferRepository();
