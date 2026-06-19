import { prisma } from "../../lib/prisma.js";

import { blogPostRepository } from "./blog-post.repository.js";

import { blogPostCache } from "./blog-post.cache.js";

import type {
  TCreateBlogPost,
  TUpdateBlogPost,
} from "./blog-post.type.js";

import {
  ConflictError,
  NotFoundError,
} from "../../utils/errors/app-error.js";

class BlogPostService {
  // GET ALL

  async getPosts(
    page: number,
    limit: number
  ) {
    return blogPostCache.getOrSetPostList(
      page,
      limit,

      () =>
        blogPostRepository.getPosts(
          page,
          limit
        )
    );
  }

  // GET BY ID

  async getPostById(
    id: string
  ) {
    const post =
      await blogPostCache.getOrSetPostDetails(
        id,

        () =>
          blogPostRepository.getPostById(
            id
          )
      );

    if (!post) {
      throw new NotFoundError(
        "Blog post not found."
      );
    }

    return post;
  }

  // GET BY SLUG

  async getPostBySlug(
    slug: string
  ) {
    const post =
      await blogPostCache.getOrSetPostSlug(
        slug,

        () =>
          blogPostRepository.getPostBySlug(
            slug
          )
      );

    if (!post) {
      throw new NotFoundError(
        "Blog post not found."
      );
    }

    return post;
  }

  // CREATE

  async createPost(
    payload: TCreateBlogPost
  ) {
    // slug unique

    const existing =
      await blogPostRepository.getPostBySlug(
        payload.slug
      );

    if (existing) {
      throw new ConflictError(
        "Post slug already exists."
      );
    }

    // author exists

    const author =
      await prisma.user.findUnique({
        where: {
          id:
            payload.authorId,
        },
      });

    if (!author) {
      throw new NotFoundError(
        "Author not found."
      );
    }

    // category exists

    const category =
      await prisma.blogCategory.findUnique({
        where: {
          id:
            payload.categoryId,
        },
      });

    if (!category) {
      throw new NotFoundError(
        "Category not found."
      );
    }

    // validate tags

    if (
      payload.tagIds
        ?.length
    ) {
      const tags =
        await prisma.blogTag.findMany({
          where: {
            id: {
              in:
                payload.tagIds,
            },
          },
        });

      if (
        tags.length !==
        payload.tagIds
          .length
      ) {
        throw new NotFoundError(
          "Some tags do not exist."
        );
      }
    }

    const post =
      await blogPostRepository.createPost(
        payload
      );

    await blogPostCache.invalidatePost(
      post.id,
      post.slug
    );

    return post;
  }

  // UPDATE

  async updatePost(
    id: string,

    payload:
      TUpdateBlogPost
  ) {
    const post =
      await blogPostRepository.getPostById(
        id
      );

    if (!post) {
      throw new NotFoundError(
        "Post not found."
      );
    }

    // slug unique

    if (
      payload.slug &&
      payload.slug !==
        post.slug
    ) {
      const existing =
        await blogPostRepository.getPostBySlug(
          payload.slug
        );

      if (existing) {
        throw new ConflictError(
          "Slug already exists."
        );
      }
    }

    // category exists

    if (
      payload.categoryId
    ) {
      const category =
        await prisma.blogCategory.findUnique({
          where: {
            id:
              payload.categoryId,
          },
        });

      if (
        !category
      ) {
        throw new NotFoundError(
          "Category not found."
        );
      }
    }

    // validate tags

    if (
      payload.tagIds
    ) {
      const tags =
        await prisma.blogTag.findMany({
          where: {
            id: {
              in:
                payload.tagIds,
            },
          },
        });

      if (
        tags.length !==
        payload.tagIds
          .length
      ) {
        throw new NotFoundError(
          "Invalid tags."
        );
      }
    }

    const updated =
      await blogPostRepository.updatePost(
        id,
        payload
      );

    await blogPostCache.invalidatePost(
      post.id,
      post.slug
    );

    if (
      updated.slug !==
      post.slug
    ) {
      await blogPostCache.invalidatePost(
        updated.id,
        updated.slug
      );
    }

    return updated;
  }

  // DELETE

  async deletePost(
    id: string
  ) {
    const post =
      await blogPostRepository.getPostById(
        id
      );

    if (!post) {
      throw new NotFoundError(
        "Post not found."
      );
    }

    await blogPostRepository.deletePost(
      id
    );

    await blogPostCache.invalidatePost(
      post.id,
      post.slug
    );

    return {
      success:
        true,
    };
  }
}

export const blogPostService =
  new BlogPostService();