import { blogCategoryRepository } from "./blog-categories.repository.js";
import { blogCategoryCache } from "./blog-categories.cache.js";

import type {
  TCreateBlogCategory,
  TUpdateBlogCategory,
} from "./blog-categories.type.js";

import {
  ConflictError,
  NotFoundError,
} from "../../utils/errors/app-error.js";

import { prisma } from "../../lib/prisma.js";

class BlogCategoryService {
 
  async getCategories(
    page: number,
    limit: number
  ) {
    return blogCategoryCache.getOrSetCategoryList(
      page,
      limit,

      () =>
        blogCategoryRepository.getCategories(
          page,
          limit
        )
    );
  }

  
  async getCategoryById(id: string) {
    const category =
      await blogCategoryCache.getOrSetCategoryDetails(
        id,

        () =>
          blogCategoryRepository.getCategoryById(
            id
          )
      );

    if (!category) {
      throw new NotFoundError(
        "Category not found."
      );
    }

    return category;
  }

  
  async getCategoryBySlug(
    slug: string
  ) {
    const category =
      await blogCategoryCache.getOrSetCategorySlug(
        slug,

        () =>
          blogCategoryRepository.getCategoryBySlug(
            slug
          )
      );

    if (!category) {
      throw new NotFoundError(
        "Category not found."
      );
    }

    return category;
  }

  
  async createCategory(
    payload: TCreateBlogCategory
  ) {
   

    const existingByName =
      await prisma.blogCategory.findUnique({
        where: {
          name: payload.name,
        },
      });

    if (existingByName) {
      throw new ConflictError(
        "Category with this name already exists."
      );
    }

    

    const existingBySlug =
      await blogCategoryRepository.getCategoryBySlug(
        payload.slug
      );

    if (existingBySlug) {
      throw new ConflictError(
        "Category with this slug already exists."
      );
    }

   

    const category =
      await blogCategoryRepository.createCategory(
        payload
      );

  

    await blogCategoryCache.invalidateCategory(
      category.id,
      category.slug
    );

    return category;
  }

  
  async updateCategory(
    id: string,
    payload: TUpdateBlogCategory
  ) {
    

    const category =
      await blogCategoryRepository.getCategoryById(
        id
      );

    if (!category) {
      throw new NotFoundError(
        "Category not found."
      );
    }

    

    if (
      payload.name &&
      payload.name !== category.name
    ) {
      const existing =
        await prisma.blogCategory.findUnique({
          where: {
            name: payload.name,
          },
        });

      if (existing) {
        throw new ConflictError(
          "Category name already exists."
        );
      }
    }

    

    if (
      payload.slug &&
      payload.slug !== category.slug
    ) {
      const existing =
        await blogCategoryRepository.getCategoryBySlug(
          payload.slug
        );

      if (existing) {
        throw new ConflictError(
          "Category slug already exists."
        );
      }
    }



    const updated =
      await blogCategoryRepository.updateCategory(
        id,
        payload
      );

  

    await blogCategoryCache.invalidateCategory(
      category.id,
      category.slug
    );

    if (
      updated.slug !==
      category.slug
    ) {
      await blogCategoryCache.invalidateCategory(
        updated.id,
        updated.slug
      );
    }

    return updated;
  }

  
  async deleteCategory(
    id: string
  ) {
    

    const category =
      await blogCategoryRepository.getCategoryById(
        id
      );

    if (!category) {
      throw new NotFoundError(
        "Category not found."
      );
    }

   

    const postCount =
      await prisma.blogPost.count({
        where: {
          categoryId: id,
        },
      });

    if (postCount > 0) {
      throw new ConflictError(
        "Cannot delete category because posts exist."
      );
    }

 

    await blogCategoryRepository.deleteCategory(
      id
    );

    

    await blogCategoryCache.invalidateCategory(
      category.id,
      category.slug
    );

    return {
      success: true,
      id,
    };
  }
}

export const blogCategoryService =
  new BlogCategoryService();