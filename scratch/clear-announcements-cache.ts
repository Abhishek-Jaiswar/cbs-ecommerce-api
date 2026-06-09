import { announcementCache } from "../src/modules/announcements/announcement.cache.js";
import { announcementService } from "../src/modules/announcements/announcement.service.js";
import { cacheService } from "../src/lib/shared/cache.js";

async function main() {
  try {
    console.log("Invalidating announcement cache...");
    await announcementCache.invalidateAnnouncementLists();

    const active = await announcementService.getActiveAnnouncements();
    console.log("Active announcements after invalidation:", active);

    const version = await cacheService.getNumber("announcement:active:version", 1);
    console.log("New announcement active version in Redis:", version);
  } catch (error) {
    console.error("Failed to invalidate cache:", error);
  } finally {
    process.exit(0);
  }
}

main();
