import { announcementRepository } from "../src/modules/announcements/announcement.repository.js";
import { announcementService } from "../src/modules/announcements/announcement.service.js";
import { cacheService } from "../src/lib/shared/cache.js";

async function main() {
  try {
    const dbActive = await announcementRepository.getActiveAnnouncements();
    console.log("Active announcements directly from Database:", dbActive);

    const serviceActive = await announcementService.getActiveAnnouncements();
    console.log("Active announcements from Service wrapper:", serviceActive);

    // Let's get active version and key
    const version = await cacheService.getNumber("announcement:active:version", 1);
    const key = `announcement:active:v${version}`;
    const rawCache = await cacheService.get(key);
    console.log(`Raw cache value for key ${key}:`, rawCache);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
