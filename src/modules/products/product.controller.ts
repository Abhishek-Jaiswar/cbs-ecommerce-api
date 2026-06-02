import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { BadRequestError } from "../../utils/errors/app-error.js";
import { productService } from "./products.service.js";
import {
  BasicInfoSchema,
  productColorSchema,
  productSizeSchema,
  productVariantSchema,
  productSpecificationSchema,
  productStatusSchema,
  type TBasicInfoDTO,
} from "./product.schema.js";

class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

      const result = await productService.getProductsForListing(page, limit);

      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Product ID is required");
      }

      const product = await productService.getProductsById(id);

      return res.status(200).json({
        success: true,
        message: "Product details fetched successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;
      if (!slug) {
        throw new BadRequestError("Product slug is required");
      }

      const product = await productService.getProductBySlug(slug);

      return res.status(200).json({
        success: true,
        message: "Product details fetched successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBasicInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = BasicInfoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const basicInfo = await productService.createBasicInfo(validation.data);

      return res.status(201).json({
        success: true,
        message: "Product basic info created successfully",
        data: basicInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBasicInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Product ID is required");
      }

      const validation = BasicInfoSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatePayload = Object.fromEntries(
        Object.entries(validation.data).filter(([, v]) => v !== undefined)
      ) as Partial<TBasicInfoDTO>;

      const updated = await productService.updateBasicInfo(id, updatePayload);

      return res.status(200).json({
        success: true,
        message: "Product basic info updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrCreateColor(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const schema = productColorSchema.omit({ productId: true });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const color = await productService.updateOrCreateProductColors(productId, {
        ...validation.data,
        productId,
      });

      return res.status(200).json({
        success: true,
        message: "Product color updated or created successfully",
        data: color,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteColor(req: Request, res: Response, next: NextFunction) {
    try {
      const colorId = req.params.colorId as string;
      if (!colorId) {
        throw new BadRequestError("Color ID is required");
      }

      await productService.deleteProductColor(colorId);

      return res.status(200).json({
        success: true,
        message: "Product color deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrCreateSize(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const schema = productSizeSchema.omit({ productId: true });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const size = await productService.updateOrCreateProductSizes(productId, {
        ...validation.data,
        productId,
      });

      return res.status(200).json({
        success: true,
        message: "Product size updated or created successfully",
        data: size,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSize(req: Request, res: Response, next: NextFunction) {
    try {
      const sizeId = req.params.sizeId as string;
      if (!sizeId) {
        throw new BadRequestError("Size ID is required");
      }

      await productService.deleteProductSizes(sizeId);

      return res.status(200).json({
        success: true,
        message: "Product size deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const schema = productVariantSchema.omit({ productId: true });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const variant = await productService.createProductVariant(productId, {
        ...validation.data,
        productId,
      });

      return res.status(201).json({
        success: true,
        message: "Product variant created successfully",
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variantId = req.params.variantId as string;
      if (!variantId) {
        throw new BadRequestError("Variant ID is required");
      }

      await productService.deleteProductVariant(variantId);

      return res.status(200).json({
        success: true,
        message: "Product variant deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestError("No files uploaded");
      }

      const colorId = req.body.colorId as string | undefined;

      const uploaded = await productService.uploadProductImage({
        images: files,
        productId,
        colorId: colorId || "",
      });

      return res.status(201).json({
        success: true,
        message: "Product images uploaded successfully",
        data: uploaded,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const file = req.file;
      if (!file) {
        throw new BadRequestError("No file uploaded");
      }

      const colorId = req.body.colorId as string | undefined;

      const uploaded = await productService.uploadProductImage({
        images: [file],
        productId,
        colorId: colorId || "",
      });

      return res.status(201).json({
        success: true,
        message: "Product image uploaded successfully",
        data: uploaded[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const imageId = req.params.imageId as string;
      if (!productId || !imageId) {
        throw new BadRequestError("Product ID and Image ID are required");
      }

      await productService.deleteProductImage(productId, imageId);

      return res.status(200).json({
        success: true,
        message: "Product image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async createSpecifications(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      if (!productId) {
        throw new BadRequestError("Product ID is required");
      }

      const schema = z.array(productSpecificationSchema);
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const created = await productService.createProductSpecifications(productId, validation.data);

      return res.status(201).json({
        success: true,
        message: "Product specifications created successfully",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSpecification(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const specificationId = req.params.specificationId as string;

      if (!productId || !specificationId) {
        throw new BadRequestError("Product ID and Specification ID are required");
      }

      await productService.deleteProductSpecification(productId, specificationId);

      return res.status(200).json({
        success: true,
        message: "Product specification deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Product ID is required");
      }

      await productService.deleteProduct(id);

      return res.status(200).json({
        success: true,
        message: "Product and its associated media/details deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new BadRequestError("Product ID is required");
      }

      const validation = productStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updated = await productService.updateProductStatus(id, validation.data.status);

      return res.status(200).json({
        success: true,
        message: "Product status updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
