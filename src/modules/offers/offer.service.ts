import { offerRepository } from "./offer.repository.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../utils/errors/app-error.js";
import type { TCreateOfferDTO, TUpdateOfferDTO } from "./offer.schema.js";

class OfferService {
  async getOffers(page: number, limit: number) {
    return offerRepository.getOffers(page, limit);
  }

  async getOfferById(id: string) {
    const offer = await offerRepository.findOfferById(id);
    if (!offer) {
      throw new NotFoundError("Offer not found.");
    }
    return offer;
  }

  async createOffer(payload: TCreateOfferDTO) {
    const existing = await offerRepository.findOfferBySlug(payload.slug);
    if (existing) {
      throw new ConflictError("Offer slug already exists.");
    }

    if (payload.endsAt && payload.endsAt < payload.startsAt) {
      throw new BadRequestError("End date must be after start date.");
    }

    return offerRepository.createOffer(payload);
  }

  async updateOffer(offerId: string, payload: TUpdateOfferDTO) {
    const offer = await this.getOfferById(offerId);

    if (payload.slug && payload.slug !== offer.slug) {
      const existing = await offerRepository.findOfferBySlug(payload.slug);
      if (existing) {
        throw new ConflictError("Offer slug already exists.");
      }
    }

    const startsAt = payload.startsAt || offer.startsAt;
    const endsAt = payload.endsAt !== undefined ? payload.endsAt : offer.endsAt;
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestError("End date must be after start date.");
    }

    return offerRepository.updateOffer(offerId, payload);
  }

  async updateStatus(offerId: string, isActive: boolean) {
    await this.getOfferById(offerId);
    return offerRepository.updateStatus(offerId, isActive);
  }

  async deleteOffer(offerId: string) {
    await this.getOfferById(offerId);
    await offerRepository.deleteOffer(offerId);
    return { success: true };
  }

  async getActiveOffers() {
    return offerRepository.getActiveOffers();
  }
}

export const offerService = new OfferService();
