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

import { uploadService } from "../../services/storage/upload.service.js";
import { prisma } from "../../lib/prisma.js";

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
      if (req.file) {
        const storageAsset = await uploadService.upload(req.file, "blogs");
        req.body.image = storageAsset.url;
        req.body.storageKey = storageAsset.storageKey;
      } else if (req.body.status === "DRAFT") {
        req.body.image = req.body.image || "https://zenvoraa.in/logo.png";
        req.body.storageKey = req.body.storageKey || "blogs/posts/draft-cover";
      }

      if (!req.body.categoryId && req.body.status === "DRAFT") {
        const defaultCategory = await prisma.blogCategory.findFirst({
          where: { isActive: true }
        });
        if (defaultCategory) {
          req.body.categoryId = defaultCategory.id;
        }
      }

      if (req.body.status === "DRAFT") {
        req.body.altText = req.body.altText || req.body.title || "Draft Post";
        if (req.body.altText.length < 3) {
          req.body.altText = req.body.altText + " Alt";
        }
      }

      // Preprocess tagIds if sent as JSON string from FormData
      if (typeof req.body.tagIds === "string") {
        try {
          req.body.tagIds = JSON.parse(req.body.tagIds);
        } catch {
          req.body.tagIds = [];
        }
      }

      // Preprocess isFeatured
      if (typeof req.body.isFeatured === "string") {
        req.body.isFeatured = req.body.isFeatured === "true";
      }

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

      // Preprocess tagIds if sent as JSON string from FormData
      if (typeof req.body.tagIds === "string") {
        try {
          req.body.tagIds = JSON.parse(req.body.tagIds);
        } catch {
          req.body.tagIds = [];
        }
      }

      // Preprocess isFeatured
      if (typeof req.body.isFeatured === "string") {
        req.body.isFeatured = req.body.isFeatured === "true";
      }

      if (req.file) {
        const storageAsset = await uploadService.upload(req.file, "blogs");
        req.body.image = storageAsset.url;
        req.body.storageKey = storageAsset.storageKey;

        // delete old cover image
        try {
          const existingPost = await blogPostService.getPostById(id);
          if (existingPost?.storageKey && existingPost.storageKey !== "blogs/posts/draft-cover") {
            await uploadService.delete(existingPost.storageKey).catch((err) => {
              console.error("Failed to delete old storage key:", err);
            });
          }
        } catch (err) {
          console.error("Failed to fetch existing post during image swap:", err);
        }
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