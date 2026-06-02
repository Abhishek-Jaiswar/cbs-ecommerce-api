import { productCategoryRepository } from "./product-category.repository.js";
import { productCategoryCache } from "./product-category.cache.js";
import type { TCreateCategory, TUpdateCategory } from "./product-category.types.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/app-error.js";

class ProductCategoryService {
  async getCategories(page: number, limit: number) {
    return productCategoryCache.getOrSetCategoryList(page, limit, () =>
      productCategoryRepository.getCategories(page, limit)
    );
  }

  async getCategoryById(id: string) {
    const category = await productCategoryCache.getOrSetCategoryDetails(id, () =>
      productCategoryRepository.getCategoryById(id)
    );

    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await productCategoryCache.getOrSetCategorySlug(slug, () =>
      productCategoryRepository.getCategoryBySlug(slug)
    );

    if (!category) {
      throw new NotFoundError("Category with this slug not found.");
    }

    return category;
  }

  async getCategoryTree() {
    return productCategoryCache.getOrSetCategoryTree(() =>
      productCategoryRepository.getCategoryTree()
    );
  }

  async getCategoriesByParentId(parentId: string | null) {
    return productCategoryCache.getOrSetCategoryChildren(parentId, () =>
      productCategoryRepository.getCategoriesByParentId(parentId)
    );
  }

  async createCategory(payload: TCreateCategory) {
    // 1. Check slug uniqueness
    const existingBySlug = await productCategoryRepository.getCategoryBySlug(payload.slug);
    if (existingBySlug) {
      throw new ConflictError("Category slug already exists.");
    }

    // 2. Validate parent category if present
    if (payload.parentId) {
      const parent = await productCategoryRepository.getCategoryById(payload.parentId);
      if (!parent) {
        throw new NotFoundError("Parent category not found.");
      }
    }

    // 3. Create
    const category = await productCategoryRepository.createCategory(payload);

    // 4. Invalidate cache
    await productCategoryCache.invalidateCategory(category.id, category.slug);

    return category;
  }

  async updateCategory(id: string, payload: TUpdateCategory) {
    // 1. Find existing category
    const category = await productCategoryRepository.getCategoryById(id);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    // 2. Check slug uniqueness if changed
    if (payload.slug && payload.slug !== category.slug) {
      const existingBySlug = await productCategoryRepository.getCategoryBySlug(payload.slug);
      if (existingBySlug) {
        throw new ConflictError("Category slug already exists.");
      }
    }

    // 3. Validate parent and trace cycles if parentId is modified
    if (payload.parentId !== undefined && payload.parentId !== category.parentId) {
      if (payload.parentId !== null) {
        // Prevent setting parent to itself
        if (payload.parentId === id) {
          throw new BadRequestError("A category cannot be its own parent.");
        }

        // Trace ancestors of the target parent to prevent cyclic reference
        await this.checkCyclicRelation(id, payload.parentId);

        const parent = await productCategoryRepository.getCategoryById(payload.parentId);
        if (!parent) {
          throw new NotFoundError("Target parent category not found.");
        }
      }
    }

    // 4. Update
    const updatedCategory = await productCategoryRepository.updateCategory(id, payload);

    // 5. Invalidate cache for the old and new details
    await productCategoryCache.invalidateCategory(category.id, category.slug);
    if (updatedCategory.slug !== category.slug) {
      await productCategoryCache.invalidateCategory(updatedCategory.id, updatedCategory.slug);
    }

    return updatedCategory;
  }

  async deleteCategory(id: string) {
    // 1. Find category
    const category = await productCategoryRepository.getCategoryById(id);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    // 2. Prevent deletion if it has subcategories
    if (category.children && category.children.length > 0) {
      throw new BadRequestError(
        "Cannot delete category that has subcategories. Please reassign or delete children first."
      );
    }

    // 3. Prevent deletion if it has products
    if (category._count && category._count.products > 0) {
      throw new BadRequestError(
        "Cannot delete category that has active products. Please reassign products first."
      );
    }

    // 4. Delete
    await productCategoryRepository.deleteCategory(id);

    // 5. Invalidate cache
    await productCategoryCache.invalidateCategory(category.id, category.slug);

    return { id, success: true };
  }

  /**
   * Traces the parent chain upwards to detect and prevent cycles
   */
  private async checkCyclicRelation(id: string, targetParentId: string): Promise<void> {
    let currentParentId: string | null = targetParentId;

    while (currentParentId) {
      if (currentParentId === id) {
        throw new BadRequestError(
          "Cyclic hierarchy detected: Category cannot be a child of its own descendant."
        );
      }

      const parentCategory = await productCategoryRepository.getCategoryById(currentParentId);
      currentParentId = parentCategory?.parentId ?? null;
    }
  }
}

export const productCategoryService = new ProductCategoryService();
