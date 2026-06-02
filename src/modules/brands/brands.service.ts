import { brandRepository } from "./brands.repository.js";
import { brandCache } from "./brands.cache.js";
import type { TCreateBrand } from "./brands.types.js";
import { ConflictError, NotFoundError } from "../../utils/errors/app-error.js";

class BrandService {
  async getBrands(page: number, limit: number) {
    return brandCache.getOrSetBrandList(page, limit, () => brandRepository.getBrands(page, limit));
  }

  async getBrandById(id: string) {
    const brand = await brandCache.getOrSetBrandDetails(id, () =>
      brandRepository.getBrandsById(id)
    );

    if (!brand) {
      throw new NotFoundError("Brand not found.");
    }

    return brand;
  }

  async createBrand(payload: TCreateBrand) {
    // Check name uniqueness (Brand names are marked @@unique([name]))
    const existing = await prisma.productBrand.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      throw new ConflictError("Brand with this name already exists.");
    }

    const brand = await brandRepository.createBrand(payload);

    await brandCache.invalidateBrandLists();

    return brand;
  }

  async updateBrand(id: string, payload: Partial<TCreateBrand>) {
    const brand = await brandRepository.getBrandsById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.");
    }

    if (payload.name && payload.name !== brand.name) {
      const existing = await prisma.productBrand.findUnique({
        where: {
          name: payload.name,
        },
      });

      if (existing) {
        throw new ConflictError("Brand with this name already exists.");
      }
    }

    const updated = await brandRepository.updateBrand(id, payload);

    await brandCache.invalidateBrand(id);

    return updated;
  }

  async deleteBrand(id: string) {
    const brand = await brandRepository.getBrandsById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.");
    }

    // Check if brand is referenced by any products (Restrict onDelete)
    const productCount = await prisma.product.count({
      where: {
        brandId: id,
      },
    });

    if (productCount > 0) {
      throw new ConflictError("Cannot delete brand: it is associated with active products.");
    }

    await brandRepository.deleteBrand(id);

    await brandCache.invalidateBrand(id);

    return { id, success: true };
  }
}

// Quick helper to resolve prisma client inside service without importing prisma module if it's already in repo
import { prisma } from "../../lib/prisma.js";

export const brandService = new BrandService();
