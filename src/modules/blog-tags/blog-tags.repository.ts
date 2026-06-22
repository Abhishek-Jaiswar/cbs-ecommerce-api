import { prisma } from "../../lib/prisma.js";
import type { TCreateBlogTag, TUpdateBlogTag } from "./blog-tags.types.js";

class BlogTagRepository {
  async getBlogTags(page: number, limit: number) {
    const [items, total] = await Promise.all([
      prisma.blogTag.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),

      prisma.blogTag.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBlogTagById(id: string) {
    return prisma.blogTag.findUnique({
      where: {
        id,
      },
    });
  }

  async getBlogTagBySlug(slug: string) {
    return prisma.blogTag.findUnique({
      where: {
        slug,
      },
    });
  }

  async createBlogTag(payload: TCreateBlogTag) {
    return prisma.blogTag.create({
      data: payload,
    });
  }

  async updateBlogTag(id: string, payload: TUpdateBlogTag) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.blogTag.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteBlogTag(id: string) {
    return prisma.blogTag.delete({
      where: {
        id,
      },
    });
  }
}

export const blogTagRepository = new BlogTagRepository();
