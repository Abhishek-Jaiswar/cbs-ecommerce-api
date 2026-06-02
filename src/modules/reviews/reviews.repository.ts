import { prisma } from "../../lib/prisma.js";
import type { TCreateReview, TUpdateReview } from "./reviews.types.js";

class ReviewRepository {
  async getReviewsByProductId(productId: string, page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where: {
          productId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.review.count({
        where: {
          productId,
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

  async getReviewById(id: string) {
    return prisma.review.findUnique({
      where: {
        id,
      },
    });
  }

  async createReview(payload: TCreateReview) {
    return prisma.review.create({
      data: payload,
    });
  }

  async updateReview(id: string, payload: TUpdateReview) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.review.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteReview(id: string) {
    return prisma.review.delete({
      where: {
        id,
      },
    });
  }
}

export const reviewRepository = new ReviewRepository();
