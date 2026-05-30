import type { Express } from "express";
import cloudinary from "../../lib/cloudinary.js";
import { logger } from "../../lib/winston.js";
import type { CloudinaryAsset } from "../../types/cloudinary-types.js";

class UploadService {
  private uploadToCloudinary(buffer: Buffer, folder: string): Promise<CloudinaryAsset> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload failed"));
          }

          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async upload(file: Express.Multer.File, productId: string): Promise<CloudinaryAsset> {
    const folder = `products/${productId}`;

    return this.uploadToCloudinary(file.buffer, folder);
  }

  async uploadMany(files: Express.Multer.File[], productId: string): Promise<CloudinaryAsset[]> {
    if (!files.length) {
      return [];
    }

    const folder = `products/${productId}`;

    return Promise.all(files.map((file) => this.uploadToCloudinary(file.buffer, folder)));
  }

  async deleteFromCloudinary(publicId: string | null | undefined): Promise<boolean> {
    if (!publicId) {
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);

      return result.result === "ok" || result.result === "not found";
    } catch (error) {
      logger.error("Cloudinary delete failed", {
        publicId,
        error,
      });

      return false;
    }
  }

  async deleteManyFromCloudinary(publicIds: Array<string | null | undefined>): Promise<boolean> {
    const validPublicIds = publicIds.filter(
      (publicId): publicId is string => typeof publicId === "string" && publicId.trim().length > 0
    );

    if (!validPublicIds.length) {
      return true;
    }

    try {
      const result = await cloudinary.api.delete_resources(validPublicIds);

      logger.info("Cloudinary bulk delete completed", {
        deleted: result.deleted,
      });

      return true;
    } catch (error) {
      logger.error("Cloudinary bulk delete failed", {
        publicIds: validPublicIds,
        error,
      });

      return false;
    }
  }
}

export const uploadService = new UploadService();
