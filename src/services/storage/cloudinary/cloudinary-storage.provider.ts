import cloudinary from "../../../lib/cloudinary.js";
import { logger } from "../../../lib/winston.js";
import type { IStorageProvider } from "../storage-provider.interface.js";
import type { StorageAsset } from "../storage.types.js";

export class CloudinaryStorageProvider implements IStorageProvider {
  async upload(buffer: Buffer, folder: string): Promise<StorageAsset> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload failed"));
          }

          resolve({
            url: result.secure_url,
            storageKey: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(storageKey);

      return result.result === "ok" || result.result === "not found";
    } catch (error) {
      logger.error("Cloudinary delete failed", error);

      return false;
    }
  }

  async deleteMany(storageKeys: string[]): Promise<boolean> {
    try {
      if (!storageKeys.length) {
        return true;
      }

      await cloudinary.api.delete_resources(storageKeys);

      return true;
    } catch (error) {
      logger.error("Cloudinary bulk delete failed", error);

      return false;
    }
  }
}
