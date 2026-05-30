import type { StorageAsset } from "./storage.types.js";

export interface IStorageProvider {
  upload(buffer: Buffer, folder: string): Promise<StorageAsset>;
  delete(storageKey: string): Promise<boolean>;
  deleteMany(storageIds: string[]): Promise<boolean>;
}
