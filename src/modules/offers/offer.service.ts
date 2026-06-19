import { offerRepository } from "./offer.repository.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../utils/errors/app-error.js";
import type { TCreateOfferDTO, TUpdateOfferDTO } from "./offer.schema.js";
import { productCache } from "../products/products.cache.js";

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

    const offer = await offerRepository.createOffer(payload);
    await productCache.invalidateProductLists();
    return offer;
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

    const updated = await offerRepository.updateOffer(offerId, payload);
    await productCache.invalidateProductLists();
    return updated;
  }

  async updateStatus(offerId: string, isActive: boolean) {
    await this.getOfferById(offerId);
    const updated = await offerRepository.updateStatus(offerId, isActive);
    await productCache.invalidateProductLists();
    return updated;
  }

  async deleteOffer(offerId: string) {
    await this.getOfferById(offerId);
    await offerRepository.deleteOffer(offerId);
    await productCache.invalidateProductLists();
    return { success: true };
  }

  async getActiveOffers() {
    return offerRepository.getActiveOffers();
  }
}

export const offerService = new OfferService();
