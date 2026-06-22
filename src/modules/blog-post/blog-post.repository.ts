import { prisma } from "../../lib/prisma.js";

import type {
  TCreateBlogPost,
  TUpdateBlogPost,
} from "./blog-post.type.js";

class BlogPostRepository {
  // GET POSTS

  async getPosts(
    page: number,
    limit: number
  ) {
    const [items, total] =
      await Promise.all([
        prisma.blogPost.findMany({
          skip:
            (page - 1) * limit,

          take:
            limit,

          orderBy: {
            createdAt:
              "desc",
          },

          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            category: true,

            tags: true,
          },
        }),

        prisma.blogPost.count(),
      ]);

    return {
      items,

      total,

      page,

      limit,

      totalPages:
        Math.ceil(
          total /
            limit
        ),
    };
  }

  // GET BY ID

  async getPostById(
    id: string
  ) {
    return prisma.blogPost.findUnique({
      where: {
        id,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        category: true,

        tags: true,
      },
    });
  }

  // GET BY SLUG

  async getPostBySlug(
    slug: string
  ) {
    return prisma.blogPost.findUnique({
      where: {
        slug,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        category: true,

        tags: true,
      },
    });
  }

  // CREATE

async createPost(
  payload: TCreateBlogPost
) {
  const {
    title,
    slug,
    content,
    image,
    storageKey,
    altText,

    authorId,
    categoryId,

    tagIds,

    excerpt,

    status,

    isFeatured,

    publishedAt,
  } = payload;

  return prisma.blogPost.create({
    data: {
      title,

      slug,

      content,

      image,

      storageKey,

      altText,

      ...(excerpt !== undefined && {
        excerpt,
      }),

      ...(status !== undefined && {
        status,
      }),

      ...(isFeatured !== undefined && {
        isFeatured,
      }),

      ...(publishedAt !== undefined && {
        publishedAt,
      }),

      author: {
        connect: {
          id: authorId,
        },
      },

      category: {
        connect: {
          id: categoryId,
        },
      },

      tags: {
        connect:
          tagIds?.map(
            (id) => ({
              id,
            })
          ) ?? [],
      },
    },

    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },

      category: true,

      tags: true,
    },
  });
}

  // UPDATE

  async updatePost(
    id: string,

    payload:
      TUpdateBlogPost
  ) {
    const {
      categoryId,
      tagIds,
      excerpt,
      publishedAt,
      ...rawData
    } = payload;

    const data =
      Object.fromEntries(
        Object.entries(
          rawData
        ).filter(
          ([, value]) =>
            value !==
            undefined
        )
      );

    return prisma.blogPost.update({
      where: {
        id,
      },

      data: {
        ...data,

        ...(excerpt !==
          undefined && {
          excerpt:
            excerpt ??
            null,
        }),

        ...(publishedAt !==
          undefined && {
          publishedAt:
            publishedAt ??
            null,
        }),

        ...(categoryId !==
          undefined && {
          category: {
            connect: {
              id:
                categoryId,
            },
          },
        }),

        ...(tagIds !==
          undefined && {
          tags: {
            set: [],

            connect:
              tagIds.map(
                (
                  id
                ) => ({
                  id,
                })
              ),
          },
        }),
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },

        category:
          true,

        tags:
          true,
      },
    });
  }

  // DELETE

  async deletePost(
    id: string
  ) {
    return prisma.blogPost.delete({
      where: {
        id,
      },
    });
  }
}

export const blogPostRepository =
  new BlogPostRepository();