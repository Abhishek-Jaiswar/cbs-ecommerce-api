import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const ANNOUNCEMENT_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const ANNOUNCEMENT_VERSION_FALLBACK = 1;
const ANNOUNCEMENT_LIST_VERSION_KEY = "announcement:list:version";
const ACTIVE_ANNOUNCEMENTS_VERSION_KEY = "announcement:active:version";

const buildAnnouncementDetailsKey = (id: string) => `announcement:details:${id}`;
const buildAnnouncementListKey = (version: number, page: number, limit: number) =>
  `announcement:list:v${version}:page:${page}:limit:${limit}`;
const buildActiveAnnouncementsKey = (version: number) =>
  `announcement:active:v${version}`;

class AnnouncementCache {
  private async getListVersion() {
    return cacheService.getNumber(ANNOUNCEMENT_LIST_VERSION_KEY, ANNOUNCEMENT_VERSION_FALLBACK);
  }

  private async getActiveVersion() {
    return cacheService.getNumber(ACTIVE_ANNOUNCEMENTS_VERSION_KEY, ANNOUNCEMENT_VERSION_FALLBACK);
  }

  async getOrSetAnnouncementDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildAnnouncementDetailsKey(id), ANNOUNCEMENT_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetAnnouncementList<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    return cacheService.remember(
      buildAnnouncementListKey(version, page, limit),
      ANNOUNCEMENT_CACHE_TTL_SECONDS,
      producer
    );
  }

  async getOrSetAnnouncementActiveList<T>(producer: () => Promise<T>) {
    const version = await this.getActiveVersion();
    return cacheService.remember(
      buildActiveAnnouncementsKey(version),
      ANNOUNCEMENT_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateAnnouncementLists() {
    const nextVersion = await cacheService.increment(ANNOUNCEMENT_LIST_VERSION_KEY);
    const nextActiveVersion = await cacheService.increment(ACTIVE_ANNOUNCEMENTS_VERSION_KEY);
    logger.info("Announcement lists cache versions incremented (invalidated)", {
      nextVersion,
      nextActiveVersion,
    });
  }

  async invalidateAnnouncement(id: string) {
    const deletedCount = await cacheService.delete(buildAnnouncementDetailsKey(id));
    logger.info("Individual announcement cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateAnnouncementLists();
  }
}

export const announcementCache = new AnnouncementCache();
