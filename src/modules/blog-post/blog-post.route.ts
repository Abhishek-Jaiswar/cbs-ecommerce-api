import express, {
  type Router,
} from "express";

import {
  blogPostController,
} from "./blog-post.controller.js";

import {
  requireAuth,
} from "../../middlewares/require-auth.js";

import {
  requireRole,
} from "../../middlewares/require-role.js";

const router: Router =
  express.Router();


// PUBLIC


router.get(
  "/",
  blogPostController.getPosts
);

router.get(
  "/slug/:slug",
  blogPostController.getPostBySlug
);

router.get(
  "/:id",
  blogPostController.getPostById
);


// ADMIN


router.post(
  "/",

  requireAuth,

  requireRole(
    "ADMIN"
  ),

  blogPostController.createPost
);


router.put(
  "/:id",

  requireAuth,

  requireRole(
    "ADMIN"
  ),

  blogPostController.updatePost
);


router.delete(
  "/:id",

  requireAuth,

  requireRole(
    "ADMIN"
  ),

  blogPostController.deletePost
);


export default router;