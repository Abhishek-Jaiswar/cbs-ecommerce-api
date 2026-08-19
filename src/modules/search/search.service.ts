import { searchCache } from "./search.cache.js";
import { searchRepository, type ISearchOptions } from "./search.repository.js";
import { offerService } from "../offers/offer.service.js";
import { applyOffersToProduct } from "../offers/offer-calculation.helper.js";

class SearchService {
  async searchProducts(options: ISearchOptions) {
    return await searchCache.getOrSetSearchResults(options, async () => {
      const result = await searchRepository.searchProducts(options);

      try {
        const activeOffers = await offerService.getActiveOffers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.items = result.items.map((product: any) =>
          applyOffersToProduct(product, activeOffers)
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Fallback silently if active offers service is not available
      }

      return result;
    });
  }

  async getSuggestions(query: string) {
    if (!query || query.trim().length < 2) {
      return { categories: [], products: [] };
    }
    return await searchRepository.getSuggestions(query);
  }
}

export const searchService = new SearchService();
