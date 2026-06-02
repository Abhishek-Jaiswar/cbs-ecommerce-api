import { blogTagRepository } from "./blog-tags.repository.js";
import { blogTagCache } from "./blog-tags.cache.js";
import type { TCreateBlogTag, TUpdateBlogTag } from "./blog-tags.types.js";
import { ConflictError, NotFoundError } from "../../utils/errors/app-error.js";
import { prisma } from "../../lib/prisma.js";

class BlogTagService {
  async getBlogTags(page: number, limit: number) {
    return blogTagCache.getOrSetTagList(page, limit, () =>
      blogTagRepository.getBlogTags(page, limit)
    );
  }

  async getBlogTagById(id: string) {
    const tag = await blogTagCache.getOrSetTagDetails(id, () =>
      blogTagRepository.getBlogTagById(id)
    );

    if (!tag) {
      throw new NotFoundError("Blog tag not found.");
    }

    return tag;
  }

  async getBlogTagBySlug(slug: string) {
    const tag = await blogTagCache.getOrSetTagSlug(slug, () =>
      blogTagRepository.getBlogTagBySlug(slug)
    );

    if (!tag) {
      throw new NotFoundError("Blog tag with this slug not found.");
    }

    return tag;
  }

  async createBlogTag(payload: TCreateBlogTag) {
    // 1. Enforce unique name and slug
    const existingByName = await prisma.blogTag.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existingByName) {
      throw new ConflictError("Blog tag with this name already exists.");
    }

    const existingBySlug = await blogTagRepository.getBlogTagBySlug(payload.slug);
    if (existingBySlug) {
      throw new ConflictError("Blog tag with this slug already exists.");
    }

    // 2. Create
    const tag = await blogTagRepository.createBlogTag(payload);

    // 3. Invalidate caches
    await blogTagCache.invalidateTag(tag.id, tag.slug);

    return tag;
  }

  async updateBlogTag(id: string, payload: TUpdateBlogTag) {
    // 1. Verify existence
    const tag = await blogTagRepository.getBlogTagById(id);
    if (!tag) {
      throw new NotFoundError("Blog tag not found.");
    }

    // 2. Check name uniqueness if changed
    if (payload.name && payload.name !== tag.name) {
      const existingByName = await prisma.blogTag.findUnique({
        where: {
          name: payload.name,
        },
      });

      if (existingByName) {
        throw new ConflictError("Blog tag with this name already exists.");
      }
    }

    // 3. Check slug uniqueness if changed
    if (payload.slug && payload.slug !== tag.slug) {
      const existingBySlug = await blogTagRepository.getBlogTagBySlug(payload.slug);
      if (existingBySlug) {
        throw new ConflictError("Blog tag with this slug already exists.");
      }
    }

    // 4. Update
    const updated = await blogTagRepository.updateBlogTag(id, payload);

    // 5. Invalidate caches
    await blogTagCache.invalidateTag(tag.id, tag.slug);
    if (updated.slug !== tag.slug) {
      await blogTagCache.invalidateTag(updated.id, updated.slug);
    }

    return updated;
  }

  async deleteBlogTag(id: string) {
    // 1. Verify existence
    const tag = await blogTagRepository.getBlogTagById(id);
    if (!tag) {
      throw new NotFoundError("Blog tag not found.");
    }

    // 2. Check if associated with blog posts
    const postCount = await prisma.blogPost.count({
      where: {
        tags: {
          some: {
            id,
          },
        },
      },
    });

    if (postCount > 0) {
      throw new ConflictError("Cannot delete blog tag: it is currently used on active blog posts.");
    }

    // 3. Delete
    await blogTagRepository.deleteBlogTag(id);

    // 4. Invalidate caches
    await blogTagCache.invalidateTag(tag.id, tag.slug);

    return { id, success: true };
  }
}

export const blogTagService = new BlogTagService();
