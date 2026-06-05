import type { Request, Response, NextFunction } from "express";
import {
  createOfferSchema,
  updateOfferSchema,
  toggleOfferStatusSchema,
} from "./offer.schema.js";
import { offerService } from "./offer.service.js";
import { BadRequestError } from "../../utils/errors/app-error.js";

class OfferController {
  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await offerService.getOffers(page, limit);

      return res.status(200).json({
        success: true,
        message: "Offers fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOfferById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Offer ID is required");
      }

      const offer = await offerService.getOfferById(id);

      return res.status(200).json({
        success: true,
        message: "Offer details fetched successfully",
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createOfferSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const offer = await offerService.createOffer(validation.data);

      return res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Offer ID is required");
      }

      const validation = updateOfferSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const offer = await offerService.updateOffer(id, validation.data);

      return res.status(200).json({
        success: true,
        message: "Offer updated successfully",
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Offer ID is required");
      }

      const validation = toggleOfferStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const offer = await offerService.updateStatus(id, validation.data.isActive);

      return res.status(200).json({
        success: true,
        message: "Offer status updated successfully",
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Offer ID is required");
      }

      await offerService.deleteOffer(id);

      return res.status(200).json({
        success: true,
        message: "Offer deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const offerController = new OfferController();
