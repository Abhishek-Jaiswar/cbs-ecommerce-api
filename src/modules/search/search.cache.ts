import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";
import type { ISearchOptions } from "./search.repository.js";

const SEARCH_CACHE_TTL_SECOND = 60 * 15; // 15 minutes
const SEARCH_VERSION_FALLBACK = 1;
const SEARCH_LIST_VERSION_KEY = "product:search:version";

const buildSearchQueryKey = (version: number, options: ISearchOptions) => {
  const q = (options.query || "").trim().toLowerCase();
  const page = options.page || 1;
  const limit = options.limit || 12;
  const cat = options.categoryId || "all";
  const minP = options.minPrice ?? "any";
  const maxP = options.maxPrice ?? "any";
  const sort = options.sort || "relevance";
  const sale = options.isSale ? "sale" : "all";
  const featured = options.isFeatured ? "feat" : "all";

  return `search:query:v${version}:q=${encodeURIComponent(q)}:p=${page}:l=${limit}:cat=${cat}:min=${minP}:max=${maxP}:sort=${sort}:s=${sale}:f=${featured}`;
};

class SearchCache {
  private async getListVersion() {
    return cacheService.getNumber(SEARCH_LIST_VERSION_KEY, SEARCH_VERSION_FALLBACK);
  }

  async getOrSetSearchResults<T>(options: ISearchOptions, producer: () => Promise<T>) {
    const version = await this.getListVersion();
    const key = buildSearchQueryKey(version, options);
    return cacheService.remember(key, SEARCH_CACHE_TTL_SECOND, producer);
  }

  async invalidateSearchCache() {
    const nextVersion = await cacheService.increment(SEARCH_LIST_VERSION_KEY);
    logger.info("Search cache version incremented (invalidated)", { nextVersion });
  }
}

export const searchCache = new SearchCache();
