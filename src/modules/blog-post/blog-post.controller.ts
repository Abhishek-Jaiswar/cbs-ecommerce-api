import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createBlogPostBodySchema,
  updateBlogPostBodySchema,
} from "./blog-post.schema.js";

import {
  blogPostService,
} from "./blog-post.service.js";

import {
  BadRequestError,
} from "../../utils/errors/app-error.js";

import type {
  TUpdateBlogPost,
} from "./blog-post.type.js";

class BlogPostController {
  // GET POSTS

  async getPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 10,
          1
        ),
        100
      );

      const result =
        await blogPostService.getPosts(
          page,
          limit
        );

      return res.status(200).json({
        success: true,
        message:
          "Posts fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET BY ID

  async getPostById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        String(
          req.params.id
        );

      if (!id) {
        throw new BadRequestError(
          "Post ID required"
        );
      }

      const result =
        await blogPostService.getPostById(
          id
        );

      return res.status(200).json({
        success: true,
        message:
          "Post fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET BY SLUG

  async getPostBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const slug =
        String(
          req.params.slug
        );

      if (!slug) {
        throw new BadRequestError(
          "Slug required"
        );
      }

      const result =
        await blogPostService.getPostBySlug(
          slug
        );

      return res.status(200).json({
        success: true,
        message:
          "Post fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // CREATE

  async createPost(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validation =
        createBlogPostBodySchema.safeParse(
          req.body
        );

      if (
        !validation.success
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Validation failed",

          errors:
            validation.error.issues.map(
              (
                issue
              ) =>
                issue.message
            ),
        });
      }

      const result =
        await blogPostService.createPost(
          validation.data
        );

      return res.status(201).json({
        success: true,

        message:
          "Post created successfully",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE

  async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        String(
          req.params.id
        );

      if (!id) {
        throw new BadRequestError(
          "Post ID required"
        );
      }

      const validation =
        updateBlogPostBodySchema.safeParse(
          req.body
        );

      if (
        !validation.success
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Validation failed",

          errors:
            validation.error.issues.map(
              (
                issue
              ) =>
                issue.message
            ),
        });
      }

      const payload:
        TUpdateBlogPost =
          {};

      Object.assign(
        payload,
        validation.data
      );

      const updated =
        await blogPostService.updatePost(
          id,
          payload
        );

      return res.status(200).json({
        success: true,

        message:
          "Post updated successfully",

        data:
          updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE

  async deletePost(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id =
        String(
          req.params.id
        );

      if (!id) {
        throw new BadRequestError(
          "Post ID required"
        );
      }

      await blogPostService.deletePost(
        id
      );

      return res.status(200).json({
        success:
          true,

        message:
          "Post deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogPostController =
  new BlogPostController();