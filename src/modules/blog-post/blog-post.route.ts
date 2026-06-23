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

import {
  upload,
} from "../../middlewares/multer.middleware.js";

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
  requireRole("ADMIN"),
  upload.single("file"),
  blogPostController.createPost
);


router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  upload.single("file"),
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