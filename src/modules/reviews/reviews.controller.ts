import type { Request, Response, NextFunction } from "express";
import { createReviewBodySchema, updateReviewBodySchema } from "./reviews.schema.js";
import { reviewService } from "./reviews.service.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";
import type { TCreateReview, TUpdateReview } from "./reviews.types.js";

class ReviewController {
  async getReviewsByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const result = await reviewService.getReviewsByProductId(productId, page, limit);

      return res.status(200).json({
        success: true,
        message: "Product reviews fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      if (!id) {
        throw new BadRequestError("Review ID is required");
      }

      const review = await reviewService.getReviewById(id);

      return res.status(200).json({
        success: true,
        message: "Review details fetched successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = createReviewBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const createPayload: TCreateReview = {
        rating: validation.data.rating,
        comment: validation.data.comment,
        productId: validation.data.productId,
        userId,
      };

      const review = await reviewService.createReview(createPayload);

      return res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!id) {
        throw new BadRequestError("Review ID is required");
      }

      if (!userId || !userRole) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = updateReviewBodySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload: TUpdateReview = {};
      if (validation.data.rating !== undefined) updatePayload.rating = validation.data.rating;
      if (validation.data.comment !== undefined) updatePayload.comment = validation.data.comment;

      const review = await reviewService.updateReview(id, userId, userRole, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!id) {
        throw new BadRequestError("Review ID is required");
      }

      if (!userId || !userRole) {
        throw new UnauthorizedError("Authentication required");
      }

      await reviewService.deleteReview(id, userId, userRole);

      return res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const search = (req.query.search as string) || "";
      const rating = req.query.rating ? Number(req.query.rating) : undefined;

      const result = await reviewService.getAllReviews(page, limit, search, rating);

      return res.status(200).json({
        success: true,
        message: "All reviews fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();

