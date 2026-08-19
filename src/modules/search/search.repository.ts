import { prisma } from "../../lib/prisma.js";

export interface ISearchOptions {
  query?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  isSale?: boolean | undefined;
  isFeatured?: boolean | undefined;
  inStockOnly?: boolean | undefined;
  sort?:
    | "relevance"
    | "price_asc"
    | "price_desc"
    | "newest"
    | "name_asc"
    | "name_desc"
    | "rating_desc"
    | "discount_desc"
    | undefined;
}

export interface ISearchResultItem {
  id: string;
  name: string;
  slug: string;
  excerpt: string;
  price: number;
  originalPrice: number | null;
  isNew: boolean;
  isFeatured: boolean;
  isSale: boolean;
  categoryId: string;
  brandId: string | null;
  createdAt: Date;
  brand?: { name: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: { id: string; position: number; isPrimary: boolean; media: { url: string } }[];
  reviews?: { rating: number }[];
  variants?: { id: string; physicalQty: number; committedQty: number }[];
  avgRating?: number;
  reviewCount?: number;
  stock?: number;
  relevance?: number;
}

function generateQueryVariations(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  set.add(normalized);

  for (const token of tokens) {
    set.add(token);

    if (token.endsWith("s") && token.length > 3) set.add(token.slice(0, -1));
    if (token.endsWith("es") && token.length > 4) set.add(token.slice(0, -2));
    if (token.endsWith("ies") && token.length > 4) set.add(token.slice(0, -3) + "y");

    // E-commerce & Jewelry specific typo normalization
    if (token === "earing" || token === "earings" || token === "earring" || token === "earrings") {
      set.add("earring");
      set.add("earrings");
      set.add("earing");
      set.add("earings");
    }
    if (token === "pendant" || token === "pendants" || token === "pendent" || token === "pendents") {
      set.add("pendant");
      set.add("pendants");
      set.add("pendent");
    }
    if (token === "necklace" || token === "necklaces" || token === "neklace" || token === "neckles") {
      set.add("necklace");
      set.add("necklaces");
    }
    if (token === "ring" || token === "rings") {
      set.add("ring");
      set.add("rings");
    }
    if (token === "bracelet" || token === "bracelets") {
      set.add("bracelet");
      set.add("bracelets");
    }
  }

  return Array.from(set);
}

class SearchRepository {
  /**
   * Performs weighted multi-tier search matching titles, categories, tags, brands, and fuzzy variations.
   */
  async searchProducts(options: ISearchOptions) {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 12, 1), 60);
    const rawQuery = (options.query || "").trim();
    const variations = generateQueryVariations(rawQuery);

    // 1. Find all matching categories by query variations
    let categoryIds: string[] = [];
    if (variations.length > 0) {
      const matchingCategories = await prisma.category.findMany({
        where: {
          isActive: true,
          OR: variations.flatMap((v) => [
            { name: { contains: v, mode: "insensitive" } },
            { slug: { contains: v, mode: "insensitive" } },
          ]),
        },
        select: { id: true },
      });
      categoryIds = matchingCategories.map((c) => c.id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      status: "ACTIVE",
      forListing: true,
    };

    if (rawQuery.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textConditions: any[] = [];

      if (categoryIds.length > 0) {
        textConditions.push({ categoryId: { in: categoryIds } });
      }

      for (const v of variations) {
        textConditions.push({ name: { contains: v, mode: "insensitive" } });
        textConditions.push({ excerpt: { contains: v, mode: "insensitive" } });
        textConditions.push({ description: { contains: v, mode: "insensitive" } });
        textConditions.push({ brand: { name: { contains: v, mode: "insensitive" } } });
        textConditions.push({ category: { name: { contains: v, mode: "insensitive" } } });
        textConditions.push({ productTags: { some: { tag: { name: { contains: v, mode: "insensitive" } } } } });
      }

      whereClause.OR = textConditions;
    }

    if (options.categoryId) {
      whereClause.categoryId = options.categoryId;
    }
    if (options.brandId) {
      whereClause.brandId = options.brandId;
    }
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      whereClause.price = {};
      if (options.minPrice !== undefined) whereClause.price.gte = options.minPrice;
      if (options.maxPrice !== undefined) whereClause.price.lte = options.maxPrice;
    }
    if (options.isSale !== undefined) {
      whereClause.isSale = options.isSale;
    }
    if (options.isFeatured !== undefined) {
      whereClause.isFeatured = options.isFeatured;
    }
    if (options.inStockOnly) {
      whereClause.variants = {
        some: {
          physicalQty: { gt: 0 },
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (options.sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (options.sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (options.sort === "name_asc") {
      orderBy = { name: "asc" };
    } else if (options.sort === "name_desc") {
      orderBy = { name: "desc" };
    } else if (options.sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          excerpt: true,
          price: true,
          originalPrice: true,
          isNew: true,
          isFeatured: true,
          isSale: true,
          categoryId: true,
          brandId: true,
          createdAt: true,
          brand: {
            select: { name: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            select: {
              id: true,
              position: true,
              isPrimary: true,
              media: { select: { url: true } },
            },
            orderBy: { position: "asc" },
          },
          reviews: {
            select: { rating: true },
          },
          variants: {
            select: { id: true, physicalQty: true, committedQty: true },
          },
        },
        orderBy:
          options.sort === "relevance" || options.sort === "rating_desc" || options.sort === "discount_desc"
            ? undefined
            : orderBy,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Map calculated attributes (price to number, stock, rating)
    let mappedItems: ISearchResultItem[] = products.map((p) => {
      const totalRatings = p.reviews?.reduce((acc, r) => acc + r.rating, 0) || 0;
      const reviewCount = p.reviews?.length || 0;
      const avgRating = reviewCount > 0 ? Number((totalRatings / reviewCount).toFixed(1)) : 0;
      const stock = p.variants?.reduce((acc, v) => acc + Math.max(v.physicalQty - (v.committedQty || 0), 0), 0) || 0;

      return {
        ...p,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        avgRating,
        reviewCount,
        stock,
      };
    });

    // Filter by minRating if requested
    if (options.minRating !== undefined && options.minRating > 0) {
      mappedItems = mappedItems.filter((item) => (item.avgRating || 0) >= (options.minRating || 0));
    }

    // Custom memory sorts for relevance, rating_desc, and discount_desc
    if (options.sort === "relevance" && rawQuery.length > 0) {
      const queryLower = rawQuery.toLowerCase();
      mappedItems.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.name.toLowerCase().includes(queryLower)) scoreA += 5;
        if (b.name.toLowerCase().includes(queryLower)) scoreB += 5;

        if (categoryIds.includes(a.categoryId)) scoreA += 4;
        if (categoryIds.includes(b.categoryId)) scoreB += 4;

        if (a.isFeatured) scoreA += 1;
        if (b.isFeatured) scoreB += 1;

        return scoreB - scoreA;
      });
    } else if (options.sort === "rating_desc") {
      mappedItems.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (options.sort === "discount_desc") {
      mappedItems.sort((a, b) => {
        const discA = a.originalPrice && a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice && b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      });
    }

    const facets = await this.getSearchFacets(rawQuery);

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets,
    };
  }

  private async getSearchFacets(query: string) {
    const rawQuery = query.trim();
    const variations = generateQueryVariations(rawQuery);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { status: "ACTIVE", forListing: true };

    if (variations.length > 0) {
      whereClause.OR = variations.flatMap((v) => [
        { name: { contains: v, mode: "insensitive" } },
        { excerpt: { contains: v, mode: "insensitive" } },
        { brand: { name: { contains: v, mode: "insensitive" } } },
        { category: { name: { contains: v, mode: "insensitive" } } },
      ]);
    }

    const matchingProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        price: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true },
        },
      },
    });

    const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    const brandMap = new Map<string, { id: string; name: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const p of matchingProducts) {
      const numPrice = Number(p.price);
      if (numPrice < minPrice) minPrice = numPrice;
      if (numPrice > maxPrice) maxPrice = numPrice;

      if (p.category) {
        const cat = categoryMap.get(p.category.id);
        if (cat) {
          cat.count += 1;
        } else {
          categoryMap.set(p.category.id, {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            count: 1,
          });
        }
      }

      if (p.brand) {
        const b = brandMap.get(p.brand.id);
        if (b) {
          b.count += 1;
        } else {
          brandMap.set(p.brand.id, {
            id: p.brand.id,
            name: p.brand.name,
            count: 1,
          });
        }
      }
    }

    return {
      categories: Array.from(categoryMap.values()),
      brands: Array.from(brandMap.values()),
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
    };
  }

  async getSuggestions(query: string) {
    const rawQuery = query.trim();
    if (!rawQuery || rawQuery.length < 2) {
      return { categories: [], products: [] };
    }

    const variations = generateQueryVariations(rawQuery);

    const [categories, products] = await prisma.$transaction([
      prisma.category.findMany({
        where: {
          isActive: true,
          OR: variations.flatMap((v) => [
            { name: { contains: v, mode: "insensitive" } },
            { slug: { contains: v, mode: "insensitive" } },
          ]),
        },
        select: { id: true, name: true, slug: true },
        take: 4,
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          forListing: true,
          OR: variations.flatMap((v) => [
            { name: { contains: v, mode: "insensitive" } },
            { excerpt: { contains: v, mode: "insensitive" } },
            { brand: { name: { contains: v, mode: "insensitive" } } },
            { category: { name: { contains: v, mode: "insensitive" } } },
          ]),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          originalPrice: true,
          excerpt: true,
          category: {
            select: { name: true },
          },
          images: {
            select: {
              media: {
                select: { url: true },
              },
            },
            orderBy: { position: "asc" },
            take: 1,
          },
        },
        take: 5,
      }),
    ]);

    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      excerpt: p.excerpt,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      categoryName: p.category?.name || null,
      imageUrl: p.images[0]?.media?.url || null,
    }));

    return {
      categories,
      products: mappedProducts,
    };
  }
}

export const searchRepository = new SearchRepository();