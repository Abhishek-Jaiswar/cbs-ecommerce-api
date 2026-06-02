import { reviewRepository } from "./reviews.repository.js";
import { reviewCache } from "./reviews.cache.js";
import type { TCreateReview, TUpdateReview } from "./reviews.types.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

class ReviewService {
  async getReviewsByProductId(productId: string, page: number, limit: number) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    return reviewCache.getOrSetProductReviews(productId, page, limit, () =>
      reviewRepository.getReviewsByProductId(productId, page, limit)
    );
  }

  async getReviewById(id: string) {
    const review = await reviewCache.getOrSetReviewDetails(id, () =>
      reviewRepository.getReviewById(id)
    );

    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    return review;
  }

  async createReview(payload: TCreateReview) {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({
      where: {
        id: payload.productId,
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found.");
    }

    // 2. Prevent duplicate review by same user on same product (unique index constraint)
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: payload.userId,
          productId: payload.productId,
        },
      },
    });

    if (existing) {
      throw new ConflictError("You have already reviewed this product.");
    }

    // 3. Create
    const review = await reviewRepository.createReview(payload);

    // 4. Invalidate caches
    await reviewCache.invalidateReview(review.id, payload.productId);

    return review;
  }

  async updateReview(id: string, userId: string, userRole: string, payload: TUpdateReview) {
    // 1. Find existing review
    const review = await reviewRepository.getReviewById(id);

    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    // 2. Access control: owner or ADMIN
    if (review.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Access Denied: You cannot edit this review.");
    }

    // 3. Update
    const updated = await reviewRepository.updateReview(id, payload);

    // 4. Invalidate caches
    await reviewCache.invalidateReview(id, review.productId);

    return updated;
  }

  async deleteReview(id: string, userId: string, userRole: string) {
    // 1. Find existing review
    const review = await reviewRepository.getReviewById(id);

    if (!review) {
      throw new NotFoundError("Review not found.");
    }

    // 2. Access control: owner or ADMIN
    if (review.userId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError("Access Denied: You cannot delete this review.");
    }

    // 3. Delete
    await reviewRepository.deleteReview(id);

    // 4. Invalidate caches
    await reviewCache.invalidateReview(id, review.productId);

    return { id, success: true };
  }
}

export const reviewService = new ReviewService();
