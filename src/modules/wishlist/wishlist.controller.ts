import type { NextFunction, Request, Response } from "express";
import { wishlistService } from "./wishlist.service.js";
import { ToggleWishlistSchema } from "./wishlist.schema.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";

export class WishlistController {
  async getUserWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const wishlist = await wishlistService.getUserWishlist(userId);

      return res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully",
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleWishlistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = ToggleWishlistSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const result = await wishlistService.toggleWishlistItem(userId, validation.data.productId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeWishlistItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const wishlistItemId = req.params.wishlistItemId as string;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!wishlistItemId) {
        throw new BadRequestError("Wishlist item ID is required");
      }

      const result = await wishlistService.removeWishlistItem(userId, wishlistItemId);

      return res.status(200).json({
        success: true,
        message: "Wishlist item removed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
