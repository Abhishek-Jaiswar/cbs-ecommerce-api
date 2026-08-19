import type { NextFunction, Request, Response } from "express";
import { searchService } from "./search.service.js";

class SearchController {
  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req.query.q || req.query.query || req.query.search || "") as string).trim();
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 60);

      const categoryId = req.query.categoryId ? (req.query.categoryId as string) : undefined;
      const brandId = req.query.brandId ? (req.query.brandId as string) : undefined;
      const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== "" ? Number(req.query.minPrice) : undefined;
      const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : undefined;
      const minRating = req.query.minRating !== undefined && req.query.minRating !== "" ? Number(req.query.minRating) : undefined;

      const isSale = req.query.isSale === "true" ? true : undefined;
      const isFeatured = req.query.isFeatured === "true" ? true : undefined;
      const inStockOnly = req.query.inStockOnly === "true" ? true : undefined;

      const sortParam = (req.query.sort as string) || "relevance";
      const validSorts = [
        "relevance",
        "price_asc",
        "price_desc",
        "newest",
        "name_asc",
        "name_desc",
        "rating_desc",
        "discount_desc",
      ] as const;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sort = validSorts.includes(sortParam as any) ? (sortParam as typeof validSorts[number]) : "relevance";

      const results = await searchService.searchProducts({
        query,
        page,
        limit,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        minRating,
        isSale,
        isFeatured,
        inStockOnly,
        sort,
      });

      return res.status(200).json({
        status: "success",
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req.query.q || req.query.query || "") as string).trim();
      const suggestions = await searchService.getSuggestions(query);

      return res.status(200).json({
        status: "success",
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
