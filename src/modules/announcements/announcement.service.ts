import { announcementRepository } from "./announcement.repository.js";
import { announcementCache } from "./announcement.cache.js";
import type { TCreateAnnouncement, TUpdateAnnouncement } from "./announcement.types.js";
import { NotFoundError } from "../../utils/errors/app-error.js";

class AnnouncementService {
  async getAnnouncements(page: number, limit: number) {
    return announcementCache.getOrSetAnnouncementList(page, limit, () =>
      announcementRepository.getAnnouncements(page, limit)
    );
  }

  async getActiveAnnouncements() {
    return announcementCache.getOrSetAnnouncementActiveList(() =>
      announcementRepository.getActiveAnnouncements()
    );
  }

  async getAnnouncementById(id: string) {
    const announcement = await announcementCache.getOrSetAnnouncementDetails(id, () =>
      announcementRepository.getAnnouncementById(id)
    );

    if (!announcement) {
      throw new NotFoundError("Announcement not found.");
    }

    return announcement;
  }

  async createAnnouncement(payload: TCreateAnnouncement) {
    const announcement = await announcementRepository.createAnnouncement(payload);
    await announcementCache.invalidateAnnouncementLists();
    return announcement;
  }

  async updateAnnouncement(id: string, payload: TUpdateAnnouncement) {
    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw new NotFoundError("Announcement not found.");
    }

    const announcement = await announcementRepository.updateAnnouncement(id, payload);
    await announcementCache.invalidateAnnouncement(id);
    return announcement;
  }

  async deleteAnnouncement(id: string) {
    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw new NotFoundError("Announcement not found.");
    }

    await announcementRepository.deleteAnnouncement(id);
    await announcementCache.invalidateAnnouncement(id);
    return { id, success: true };
  }
}

export const announcementService = new AnnouncementService();
