import { CloudinaryStorageProvider } from "./cloudinary/cloudinary-storage.provider.js";
import type { IStorageProvider } from "./storage-provider.interface.js";
import type { StorageAsset } from "./storage.types.js";

class UploadService {
  constructor(private readonly storage: IStorageProvider) {}

  async upload(file: Express.Multer.File, folder: string): Promise<StorageAsset> {
    return this.storage.upload(file.buffer, folder);
  }

  async uploadMany(files: Express.Multer.File[], folder: string): Promise<StorageAsset[]> {
    if (!files.length) {
      return [];
    }

    return Promise.all(files.map((file) => this.storage.upload(file.buffer, folder)));
  }

  async delete(storageKey: string): Promise<boolean> {
    return this.storage.delete(storageKey);
  }

  async deleteMany(storageKeys: string[]): Promise<boolean> {
    return this.storage.deleteMany(storageKeys);
  }
}

const storageProvider = new CloudinaryStorageProvider();

export const uploadService = new UploadService(storageProvider);
