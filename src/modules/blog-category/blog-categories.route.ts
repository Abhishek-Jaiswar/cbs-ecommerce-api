import express, {
  Router,
} from "express";

import {
  blogCategoryController,
} from "./blog-categories.controller.js";

import {
  requireAuth,
} from "../../middlewares/require-auth.js";

import {
  requireRole,
} from "../../middlewares/require-role.js";

const router: Router =
  express.Router();




router.get(
  "/",
  blogCategoryController.getCategories
);

router.get(
  "/:id",
  blogCategoryController.getCategoryById
);

router.get(
  "/slug/:slug",
  blogCategoryController.getCategoryBySlug
);



router.post(
  "/",
 

  blogCategoryController.createCategory
);

router.put(
  "/:id",

 

  blogCategoryController.updateCategory
);

router.delete(
  "/:id",

 

  blogCategoryController.deleteCategory
);

export default router;