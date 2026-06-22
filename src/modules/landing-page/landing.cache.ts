import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const LANDING_PAGE_CACHE_TTL_SECONDS = 60 * 10;

const buildLandingListKey = () => "landing-page:list";
const buildLandingDetailsKey = (id : string) => `landing-page:details:${id}`;

class LandingPageCache{

    async getOrSetLandingPages<T>(
        producer: () => Promise<T>
    ){
        return cacheService.remember(
            buildLandingListKey(),
            LANDING_PAGE_CACHE_TTL_SECONDS,
            producer
        );
    }

    async getOrSetLandingDetails<T>(
        id : string,
        producer: () => Promise<T>
    ){

        return cacheService.remember(
            buildLandingDetailsKey(id),
            LANDING_PAGE_CACHE_TTL_SECONDS,
            producer
        );

    }

    async invalidateLandingPages() {

        const deletedCount = 
        await cacheService.delete(
            buildLandingListKey()
        );

        logger.info(
            "Landing pages cache invalidated",
            {
                deletedCount
            }
        )
    }

    async invalidateLanding(
        id : string
    ) {

        const deletedCount = 
         
        await cacheService.delete(
            buildLandingDetailsKey(id)
        );

        logger.info(
            "Landing page cache invalidated",
            {
                id, 
                deletedCount
            }
        );

        await this.invalidateLandingPages();
    }
}

export const landingPageCache = 
new LandingPageCache();