import { prisma } from "../../lib/prisma.js";
import type { Prisma, ProductStatus } from "../../generated/prisma/client.js";
import type {
  TBasicInfoDTO,
  TProductColorDTO,
  TProductSizeDTO,
  TProductSpecificationDTO,
  TProductVariantWithSku,
  TProductListingQuery,
} from "./product.schema.js";
import type { TProductImageUpload } from "./product.types.js";

type ListingCategory = { slug: string; name: string; excerpt: string | null; image: string; altText: string };
type TagGroup = { group: string; tags: { slug: string; label: string }[] };
type ListingItem = Record<string, unknown>;

/** "Style: Minimal" -> "Style"; tags without a colon are ungrouped. */
const tagGroupOf = (name: string) => {
  const i = name.indexOf(":");
  return i > 0 ? name.slice(0, i).trim() : null;
};

class ProductRepository {
  /**
   * Storefront listing with filters, sorting and offset paging.
   * Sorts always end with `id` so consecutive pages never repeat or skip rows.
   */
  async getProductsForListing(query: TProductListingQuery) {
    const { page, limit } = query;
    const empty = {
      items: [] as ListingItem[],
      total: 0,
      page,
      limit,
      totalPages: 0,
      category: null as ListingCategory | null,
      ...(query.facets ? { facets: { priceRange: { min: 0, max: 0 }, tagGroups: [] as TagGroup[] } } : {}),
    };

    // ---- scope: listed products, optionally within a category subtree -----
    const scope: Prisma.ProductWhereInput = { status: "ACTIVE", forListing: true };
    let category: ListingCategory | null = null;

    if (query.category) {
      const all = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, excerpt: true, image: true, altText: true, parentId: true },
      });
      const root = all.find((c) => c.slug === query.category);
      if (!root) return empty;
      const ids = new Set([root.id]);
      // collect descendants (categories table is small)
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of all) {
          if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
            ids.add(c.id);
            grew = true;
          }
        }
      }
      scope.categoryId = { in: [...ids] };
      category = {
        slug: root.slug,
        name: root.name,
        excerpt: root.excerpt,
        image: root.image,
        altText: root.altText,
      };
    }

    // ---- filters -----------------------------------------------------------
    const and: Prisma.ProductWhereInput[] = [];

    if (query.tags?.length) {
      const tags = await prisma.tag.findMany({
        where: { slug: { in: query.tags } },
        select: { id: true, name: true },
      });
      if (tags.length === 0) return { ...empty, category };
      // "Group: Value" tags: OR within a group, AND across groups.
      const groups = new Map<string, string[]>();
      for (const t of tags) {
        const group = tagGroupOf(t.name) ?? "";
        groups.set(group, [...(groups.get(group) ?? []), t.id]);
      }
      for (const ids of groups.values()) {
        and.push({ productTags: { some: { tagId: { in: ids } } } });
      }
    }
    if (query.search) {
      and.push({
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { excerpt: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      and.push({
        price: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        },
      });
    }
    if (query.sale) and.push({ isSale: true });
    if (query.new) and.push({ isNew: true });
    if (query.featured) and.push({ isFeatured: true });

    const where: Prisma.ProductWhereInput = and.length ? { AND: [scope, ...and] } : scope;

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case "featured":
          return [{ isFeatured: "desc" }, { createdAt: "desc" }];
        case "price-asc":
          return [{ price: "asc" }];
        case "price-desc":
          return [{ price: "desc" }];
        case "name-asc":
          return [{ name: "asc" }];
        case "name-desc":
          return [{ name: "desc" }];
        default:
          return [{ createdAt: "desc" }];
      }
    })();
    orderBy.push({ id: "asc" });

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
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
          offerEnds: true,
          forListing: true,
          categoryId: true,
          brandId: true,
          createdAt: true,
          brand: { select: { name: true } },
          productTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
          variants: { select: { id: true, physicalQty: true, committedQty: true } },
          colors: { select: { id: true, name: true, hex: true } },
          images: {
            take: 1,
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            select: { media: { select: { url: true, altText: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const mappedItems = items.map(({ images, ...product }) => ({
      ...product,
      image: images[0] ? { url: images[0].media.url, alt: images[0].media.altText ?? product.name } : null,
      variants: product.variants.map((v) => ({
        ...v,
        stock: v.physicalQty - (v.committedQty || 0),
      })),
    }));

    const result = {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      category,
    };

    if (!query.facets) return result;

    // ---- facets: price bounds of the category scope + grouped tags in use --
    const [priceAgg, tagRows] = await Promise.all([
      prisma.product.aggregate({ where: scope, _min: { price: true }, _max: { price: true } }),
      prisma.tag.findMany({
        where: { name: { contains: ":" }, products: { some: { product: { status: "ACTIVE", forListing: true } } } },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const groupMap = new Map<string, TagGroup>();
    for (const t of tagRows) {
      const group = tagGroupOf(t.name);
      if (!group) continue;
      const entry = groupMap.get(group) ?? { group, tags: [] };
      entry.tags.push({ slug: t.slug, label: t.name.slice(t.name.indexOf(":") + 1).trim() });
      groupMap.set(group, entry);
    }

    return {
      ...result,
      facets: {
        priceRange: {
          min: Math.floor(Number(priceAgg._min.price ?? 0)),
          max: Math.ceil(Number(priceAgg._max.price ?? 0)),
        },
        tagGroups: [...groupMap.values()],
      },
    };
  }

  async getProductsForAdmin(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          excerpt: true,
          price: true,
          originalPrice: true,
          costPrice: true,
          isNew: true,
          isFeatured: true,
          isSale: true,
          offerEnds: true,
          forListing: true,
          categoryId: true,
          status: true,
          brandId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        colors: true,
        sizes: true,
        brand: true,
        category: true,
        images: {
          include: {
            media: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        variants: true,
        reviews: true,
        offers: true,
        productTags: true,
        specification: true,
      },
    });

    if (!product) return null;

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        stock: v.physicalQty - (v.committedQty || 0),
      })),
    };
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        colors: {
          omit: {
            productId: true,
          },
        },
        sizes: {
          omit: {
            productId: true,
          },
        },
        brand: {
          omit: {
            createdAt: true,
            updatedAt: true,
            storageKey: true,
          },
        },
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
            image: true,
            altText: true,
          },
        },
        images: {
          omit: {
            mediaId: true,
            productId: true,
          },
          include: {
            media: {
              select: {
                id: true,
                url: true,
                altText: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            physicalQty: true,
            committedQty: true,
            price: true,
            size: {
              select: {
                id: true,
                value: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                hex: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
        productTags: {
          omit: {
            productId: true,
            tagId: true,
          },
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        specification: {
          omit: {
            productId: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        stock: v.physicalQty - (v.committedQty || 0),
      })),
    };
  }

  async createBasicInfo(payload: TBasicInfoDTO) {
    return prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId,

        productTags: {
          create: payload.tagIds.map((tagId) => ({
            tagId,
          })),
        },

        excerpt: payload.excerpt,
        description: payload.description,
        price: payload.price,
        originalPrice: payload.originalPrice,
        costPrice: payload.costPrice,
        isSale: payload.isSale,
        isFeatured: payload.isFeatured,
        isNew: payload.isNew,
        forListing: payload.forListing,
        offerEnds: payload.offerEnds ?? null,
      },

      select: {
        id: true,
      },
    });
  }

  async updateBasicInfo(productId: string, payload: Partial<TBasicInfoDTO>) {
    const data: Prisma.ProductUpdateInput = {
      ...Object.fromEntries(
        Object.entries(payload).filter(([k, v]) => v !== undefined && k !== "tagIds")
      ),
    };

    if (payload.tagIds !== undefined) {
      data.productTags = {
        deleteMany: {},
        create: payload.tagIds.map((tagId) => ({
          tagId,
        })),
      };
    }

    return prisma.product.update({
      where: {
        id: productId,
      },
      data,
    });
  }

  async getProductVariantById(variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },
    });
    if (!variant) return null;
    return {
      ...variant,
      stock: variant.physicalQty - (variant.committedQty || 0),
    };
  }

  async getProductImageById(imageId: string) {
    return prisma.productImage.findUnique({
      where: {
        id: imageId,
      },
      include: {
        media: true,
      },
    });
  }

  async deleteProduct(productId: string) {
    return prisma.product.delete({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });
  }

  async updateOrCreateProductColors(productId: string, payload: TProductColorDTO) {
    return prisma.productColor.upsert({
      where: {
        productId_name: {
          productId,
          name: payload.name,
        },
      },
      create: {
        productId,
        name: payload.name,
        hex: payload.hex,
      },
      update: {
        hex: payload.hex,
      },
    });
  }

  async getProductColorById(colorId: string) {
    return prisma.productColor.findUnique({
      where: {
        id: colorId,
      },
    });
  }

  async deleteProductColor(colorId: string) {
    return prisma.productColor.delete({
      where: {
        id: colorId,
      },

      select: {
        id: true,
      },
    });
  }

  async getProductSizesById(sizeId: string) {
    return prisma.productSize.findUnique({
      where: {
        id: sizeId,
      },
    });
  }

  async updateOrCreateProductSizes(productId: string, payload: TProductSizeDTO) {
    return prisma.productSize.upsert({
      where: {
        productId_value: {
          productId,
          value: payload.value,
        },
      },
      create: {
        productId,
        value: payload.value,
      },
      update: {
        value: payload.value,
      },
    });
  }

  async deleteProductSize(sizeId: string) {
    return prisma.productSize.delete({
      where: {
        id: sizeId,
      },
      select: {
        id: true,
      },
    });
  }

  async createProductVariant(productId: string, payload: TProductVariantWithSku) {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        colorId: payload.colorId,
        sizeId: payload.sizeId,
        physicalQty: payload.stock,
        price: payload.price,
        sku: payload.sku,
      },
    });
    return {
      ...variant,
      stock: variant.physicalQty - (variant.committedQty || 0),
    };
  }

  async deleteProductVariant(variantId: string) {
    return prisma.productVariant.delete({
      where: {
        id: variantId,
      },

      select: {
        id: true,
      },
    });
  }

  async uploadProductImageMedia(payload: TProductImageUpload[]) {
    return prisma.$transaction(async (tx) => {
      const createdImages = [];

      for (const item of payload) {
        const media = await tx.media.create({
          data: item.media,
        });

        const image = await tx.productImage.create({
          data: {
            ...item.productImage,
            mediaId: media.id,
          },
          select: {
            id: true,
            mediaId: true,
          },
        });

        createdImages.push(image);
      }

      return createdImages;
    });
  }

  async deleteMedia(mediaId: string) {
    return prisma.media.delete({
      where: {
        id: mediaId,
      },
      select: {
        id: true,
      },
    });
  }

  async deleteProductImageAndPromote(mediaId: string, productId: string, isPrimary: boolean) {
    return prisma.$transaction(async (tx) => {
      await tx.media.delete({
        where: {
          id: mediaId,
        },
      });

      if (isPrimary) {
        const firstRemaining = await tx.productImage.findFirst({
          where: {
            productId,
          },
          orderBy: {
            position: "asc",
          },
        });

        if (firstRemaining) {
          await tx.productImage.update({
            where: {
              id: firstRemaining.id,
            },
            data: {
              isPrimary: true,
            },
          });
        }
      }
    });
  }

  async deleteManyMedia(mediaIds: string[]) {
    return prisma.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });
  }

  async deleteProductImage(productImageId: string) {
    return prisma.productImage.delete({
      where: {
        id: productImageId,
      },
      select: {
        id: true,
      },
    });
  }

  async createManyProductSpecifications(
    productId: string,
    specifications: TProductSpecificationDTO[]
  ) {
    return prisma.productSpecification.createMany({
      data: specifications.map((spec) => ({
        productId,
        key: spec.key,
        value: spec.value,
      })),
      skipDuplicates: true,
    });
  }

  async createSpecificationsAndMaybeUpdateStatus(
    productId: string,
    specifications: TProductSpecificationDTO[],
    status?: ProductStatus
  ) {
    return prisma.$transaction(async (tx) => {
      let created = null;
      if (specifications.length > 0) {
        created = await tx.productSpecification.createMany({
          data: specifications.map((spec) => ({
            productId,
            key: spec.key,
            value: spec.value,
          })),
          skipDuplicates: true,
        });
      }

      if (status) {
        await tx.product.update({
          where: {
            id: productId,
          },
          data: {
            status,
          },
        });
      }

      return created;
    });
  }

  async deleteProductSpecification(specificationId: string) {
    return prisma.productSpecification.delete({
      where: {
        id: specificationId,
      },
      select: {
        id: true,
      },
    });
  }

  async deleteManyProductSpecification(productId: string, specificationId: string) {
    return prisma.productSpecification.deleteMany({
      where: {
        id: specificationId,
        productId,
      },
    });
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    return prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }
}

export const productRepository = new ProductRepository();
