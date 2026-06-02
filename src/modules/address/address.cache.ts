import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const ADDRESS_CACHE_TTL_SECONDS = 60 * 10; // 10 minutes (addresses are updated slightly more than categories)
const buildUserAddressListKey = (userId: string) => `address:list:${userId}`;
const buildAddressDetailsKey = (id: string) => `address:details:${id}`;

class AddressCache {
  async getOrSetUserAddresses<T>(userId: string, producer: () => Promise<T>) {
    return cacheService.remember(
      buildUserAddressListKey(userId),
      ADDRESS_CACHE_TTL_SECONDS,
      producer
    );
  }

  async getOrSetAddressDetails<T>(id: string, producer: () => Promise<T>) {
    return cacheService.remember(buildAddressDetailsKey(id), ADDRESS_CACHE_TTL_SECONDS, producer);
  }

  async invalidateUserAddresses(userId: string) {
    const deletedCount = await cacheService.delete(buildUserAddressListKey(userId));
    logger.info("User addresses cache invalidated", {
      userId,
      deletedCount,
    });
  }

  async invalidateAddress(id: string, userId: string) {
    const deletedCount = await cacheService.delete(buildAddressDetailsKey(id));
    logger.info("Individual address cache invalidated", {
      id,
      deletedCount,
    });

    await this.invalidateUserAddresses(userId);
  }
}

export const addressCache = new AddressCache();
