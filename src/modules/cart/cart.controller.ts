import type { NextFunction, Request, Response } from "express";
import { cartService } from "./cart.service.js";
import { AddToCartSchema } from "./cart.schema.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors/app-error.js";

export class CartController {
  async getUserCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const cart = await cartService.getUserCart(userId);

      return res.status(200).json({
        success: true,
        message: "Cart fetched successfully",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const validation = AddToCartSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((issue) => issue.message),
        });
      }

      const { variantId, quantity } = validation.data;
      const result = await cartService.addToCart(userId, variantId, quantity);

      return res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItemQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const cartItemId = req.params.cartItemId as string;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!cartItemId) {
        throw new BadRequestError("Cart item ID is required");
      }

      const quantity = Number(req.body.quantity);
      if (isNaN(quantity) || !Number.isInteger(quantity)) {
        throw new BadRequestError("Quantity must be a valid integer");
      }

      const result = await cartService.updateCartItemQuantity(userId, cartItemId, quantity);

      return res.status(200).json({
        success: true,
        message: "Cart item quantity updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const cartItemId = req.params.cartItemId as string;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!cartItemId) {
        throw new BadRequestError("Cart item ID is required");
      }

      const result = await cartService.removeCartItem(userId, cartItemId);

      return res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const result = await cartService.clearCart(userId);

      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();

