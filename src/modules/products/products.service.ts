import { BadRequestError, NotFoundError } from "../../utils/errors/app-error.js";
import { productCache } from "./products.cache.js";
import { productRepository } from "./products.repository.js";
import type {
  TBasicInfoDTO,
  TProductColorDTO,
  TProductSizeDTO,
  TProductVariantDTO,
  TProductSpecificationDTO,
} from "./product.schema.js";
import { productCategoryRepository } from "../categories/product-category.repository.js";
import { brandRepository } from "../brands/brands.repository.js";
import type { ProductStatus } from "../../generated/prisma/client.js";
import { nanoid } from "nanoid";
import type { TImageUpload } from "./product.types.js";
import { uploadService } from "../../services/storage/upload.service.js";

class ProductService {
  async getProductsForListing(page: number, limit: number) {
    return await productCache.getOrSetProductLists(page, limit, () =>
      productRepository.getProductsForListing(page, limit)
    );
  }

  async getProductsForAdmin(page: number, limit: number) {
    return await productRepository.getProductsForAdmin(page, limit);
  }

  async getProductsById(id: string) {
    const products = await productCache.getOrSetProductDetails(id, () =>
      productRepository.getProductById(id)
    );

    if (!products) {
      throw new NotFoundError("Product not found");
    }

    return products;
  }

  async getProductBySlug(slug: string) {
    const product = await productCache.getOrSetProductDetails(slug, () =>
      productRepository.getProductBySlug(slug)
    );
    
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  async getProductColors(productId: string) {
    const product = await this.getProductsById(productId);
    return product.colors;
  }

  async getProductSizes(productId: string) {
    const product = await this.getProductsById(productId);
    return product.sizes;
  }

  async createBasicInfo(payload: TBasicInfoDTO) {
    const category = await productCategoryRepository.getCategoryById(payload.categoryId);
    if (!category) {
      throw new BadRequestError("Category is invalid");
    }

    if (payload.brandId) {
      const brand = await brandRepository.getBrandsById(payload.brandId);
      if (!brand) {
        throw new BadRequestError("Brand is invalid");
      }
    }

    const slug = await productRepository.getProductBySlug(payload.slug);
    if (slug) {
      throw new BadRequestError("Slug already exists");
    }

    const basicInfo = await productRepository.createBasicInfo(payload);
    await productCache.invalidateProductLists();

    return basicInfo;
  }

  async updateBasicInfo(productId: string, payload: Partial<TBasicInfoDTO>) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (payload.categoryId) {
      const category = await productCategoryRepository.getCategoryById(payload.categoryId);
      if (!category) {
        throw new BadRequestError("Category is invalid");
      }
    }

    if (payload.brandId) {
      const brand = await brandRepository.getBrandsById(payload.brandId);
      if (!brand) {
        throw new BadRequestError("Brand is invalid");
      }
    }

    if (payload.slug && payload.slug !== product.slug) {
      const existingSlug = await productRepository.getProductBySlug(payload.slug);
      if (existingSlug) {
        throw new BadRequestError("Slug already exists");
      }
    }

    const updated = await productRepository.updateBasicInfo(productId, payload);
    await productCache.invalidateProducts(productId);

    return updated;
  }

  async updateOrCreateProductColors(productId: string, payload: TProductColorDTO) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const productColor = await productRepository.updateOrCreateProductColors(productId, payload);
    await productCache.invalidateProducts(productId);

    return productColor;
  }

  async deleteProductColor(colorId: string) {
    const colors = await productRepository.getProductColorById(colorId);
    if (!colors) {
      throw new NotFoundError("Product color not found");
    }

    await productRepository.deleteProductColor(colorId);
    await productCache.invalidateProducts(colors.productId);
  }

  async updateOrCreateProductSizes(productId: string, payload: TProductSizeDTO) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const productSizes = await productRepository.updateOrCreateProductSizes(productId, payload);
    await productCache.invalidateProducts(productId);

    return productSizes;
  }

  async deleteProductSizes(sizeId: string) {
    const sizes = await productRepository.getProductSizesById(sizeId);
    if (!sizes) {
      throw new NotFoundError("Product sizes not found");
    }

    await productRepository.deleteProductSize(sizeId);
    await productCache.invalidateProducts(sizes.productId);
  }

  async createProductVariant(productId: string, payload: TProductVariantDTO) {
    const product = await productRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const colorExists = product.colors.some((c) => c.id === payload.colorId);
    const sizeExists = product.sizes.some((s) => s.id === payload.sizeId);

    if (!colorExists || !sizeExists) {
      throw new BadRequestError("Specified product color or size does not exist for this product");
    }

    const sku = this.generateVariantSku();

    const newPayload = {
      ...payload,
      sku,
    };

    const variant = await productRepository.createProductVariant(productId, newPayload);
    await productCache.invalidateProducts(productId);

    return variant;
  }

  async deleteProductVariant(variantId: string) {
    const variant = await productRepository.getProductVariantById(variantId);
    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    await productRepository.deleteProductVariant(variantId);
    await productCache.invalidateProducts(variant.productId);
  }

  async uploadProductImage(payload: TImageUpload) {
    const product = await productRepository.getProductById(payload.productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (payload.images.length !== payload.colorIds.length) {
      throw new BadRequestError(
        "The number of uploaded files must match the number of color IDs provided"
      );
    }

    // Verify all color IDs are valid for this product
    for (const colorId of payload.colorIds) {
      if (!colorId) {
        throw new BadRequestError("Color ID is required for every uploaded image");
      }
      const colorExists = product.colors.some((c) => c.id === colorId);
      if (!colorExists) {
        throw new BadRequestError(`Specified color ID ${colorId} does not exist for this product`);
      }
    }

    const uploadedImages = await uploadService.uploadMany(
      payload.images,
      `products/${payload.productId}`
    );

    const hasExistingPrimary = product.images.some((img) => img.isPrimary);
    const maxDbPosition = product.images.reduce((max, img) => Math.max(max, img.position), 0);

    const newPayload = uploadedImages.map((image, index) => {
      const colorId = payload.colorIds[index];
      if (!colorId) {
        throw new BadRequestError(`Missing color ID for image at index ${index}`);
      }

      const position = maxDbPosition + index + 1;

      return {
        media: {
          url: image.url,
          storageKey: image.storageKey,
        },
        productImage: {
          productId: payload.productId,
          colorId,
          position,
          isPrimary: !hasExistingPrimary && index === 0,
        },
      };
    });

    const uploaded = await productRepository.uploadProductImageMedia(newPayload);
    await productCache.invalidateProducts(payload.productId);

    return uploaded;
  }

  async deleteProductImage(productId: string, imageId: string) {
    const image = await productRepository.getProductImageById(imageId);
    if (!image) {
      throw new NotFoundError("Product image not found");
    }

    if (image.productId !== productId) {
      throw new BadRequestError("Product image does not belong to this product");
    }

    await productRepository.deleteProductImageAndPromote(image.mediaId, productId, image.isPrimary);

    if (image.media.storageKey) {
      await uploadService.delete(image.media.storageKey).catch((err) => {
        console.error("Failed to delete product image from storage:", err);
      });
    }

    await productCache.invalidateProducts(image.productId);
  }

  async createProductSpecifications(
    productId: string,
    specifications: TProductSpecificationDTO[],
    status?: ProductStatus
  ) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const created = await productRepository.createSpecificationsAndMaybeUpdateStatus(
      productId,
      specifications,
      status
    );
    await productCache.invalidateProducts(productId);

    return created;
  }

  async deleteProductSpecification(productId: string, specificationId: string) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    await productRepository.deleteProductSpecification(specificationId);
    await productCache.invalidateProducts(productId);
  }

  async deleteProduct(productId: string) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Collect S3 storage keys to delete
    const storageKeys = product.images
      .map((img) => img.media?.storageKey)
      .filter((key): key is string => !!key);

    // Delete media records in DB (cascades and deletes ProductImage)
    const mediaIds = product.images.map((img) => img.mediaId);
    if (mediaIds.length > 0) {
      await productRepository.deleteManyMedia(mediaIds);
    }

    // Delete files from storage
    if (storageKeys.length > 0) {
      await uploadService.deleteMany(storageKeys).catch((err) => {
        console.error("Failed to delete product images from storage:", err);
      });
    }

    // Delete the product from DB (cascade deletes colors, sizes, variants, specifications, reviews)
    await productRepository.deleteProduct(productId);
    await productCache.invalidateProducts(productId);
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const updated = await productRepository.updateProductStatus(productId, status);
    await productCache.invalidateProducts(productId);

    return updated;
  }

  async getAllVariants(params: {
    page: number;
    limit: number;
    search?: string | undefined;
    stockStatus?: string | undefined;
  }) {
    return await productRepository.getAllVariants(params);
  }

  async updateProductVariant(
    variantId: string,
    payload: { price?: number | null | undefined; stock?: number | undefined }
  ) {
    const variant = await productRepository.getProductVariantById(variantId);
    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    const updated = await productRepository.updateProductVariant(variantId, payload);
    await productCache.invalidateProducts(variant.productId);

    return updated;
  }

  private generateVariantSku() {
    return `ZENSKU-${nanoid(8).toUpperCase()}`;
  }
}

export const productService = new ProductService();
