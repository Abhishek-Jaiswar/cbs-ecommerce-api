import { productTagRepository } from "./product-tags.repository.js";
import { productTagCache } from "./product-tags.cache.js";
import type { TCreateProductTag, TUpdateProductTag } from "./product-tags.types.js";
import { ConflictError, NotFoundError } from "../../utils/errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

class ProductTagService {
  async getProductTags(page: number, limit: number) {
    return productTagCache.getOrSetTagList(page, limit, () =>
      productTagRepository.getProductTags(page, limit)
    );
  }

  async getProductTagById(id: string) {
    const tag = await productTagCache.getOrSetTagDetails(id, () =>
      productTagRepository.getProductTagById(id)
    );

    if (!tag) {
      throw new NotFoundError("Tag not found.");
    }

    return tag;
  }

  async getProductTagBySlug(slug: string) {
    const tag = await productTagCache.getOrSetTagSlug(slug, () =>
      productTagRepository.getProductTagBySlug(slug)
    );

    if (!tag) {
      throw new NotFoundError("Tag with this slug not found.");
    }

    return tag;
  }

  async createProductTag(payload: TCreateProductTag) {
    // 1. Enforce unique name and slug
    const existingByName = await prisma.tag.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existingByName) {
      throw new ConflictError("Tag with this name already exists.");
    }

    const existingBySlug = await productTagRepository.getProductTagBySlug(payload.slug);
    if (existingBySlug) {
      throw new ConflictError("Tag with this slug already exists.");
    }

    // 2. Create
    const tag = await productTagRepository.createProductTag(payload);

    // 3. Invalidate caches
    await productTagCache.invalidateTag(tag.id, tag.slug);

    return tag;
  }

  async updateProductTag(id: string, payload: TUpdateProductTag) {
    // 1. Verify existence
    const tag = await productTagRepository.getProductTagById(id);
    if (!tag) {
      throw new NotFoundError("Tag not found.");
    }

    // 2. Check name uniqueness if changed
    if (payload.name && payload.name !== tag.name) {
      const existingByName = await prisma.tag.findUnique({
        where: {
          name: payload.name,
        },
      });

      if (existingByName) {
        throw new ConflictError("Tag with this name already exists.");
      }
    }

    // 3. Check slug uniqueness if changed
    if (payload.slug && payload.slug !== tag.slug) {
      const existingBySlug = await productTagRepository.getProductTagBySlug(payload.slug);
      if (existingBySlug) {
        throw new ConflictError("Tag with this slug already exists.");
      }
    }

    // 4. Update
    const updated = await productTagRepository.updateProductTag(id, payload);

    // 5. Invalidate caches
    await productTagCache.invalidateTag(tag.id, tag.slug);
    if (updated.slug !== tag.slug) {
      await productTagCache.invalidateTag(updated.id, updated.slug);
    }

    return updated;
  }

  async deleteProductTag(id: string) {
    // 1. Verify existence
    const tag = await productTagRepository.getProductTagById(id);
    if (!tag) {
      throw new NotFoundError("Tag not found.");
    }

    // 2. Check if associated with active products
    const productTagCount = await prisma.productTag.count({
      where: {
        tagId: id,
      },
    });

    if (productTagCount > 0) {
      throw new ConflictError("Cannot delete tag: it is currently used on active products.");
    }

    // 3. Delete
    await productTagRepository.deleteProductTag(id);

    // 4. Invalidate caches
    await productTagCache.invalidateTag(tag.id, tag.slug);

    return { id, success: true };
  }
}

export const productTagService = new ProductTagService();
