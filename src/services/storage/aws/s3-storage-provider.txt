import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import type { IStorageProvider } from "../storage-provider.interface.js";
import type { StorageAsset } from "../storage.types.js";


export class S3StorageProvider implements IStorageProvider {
  constructor(
    private readonly bucket: string,
    private readonly s3: S3Client
  ) {}

  async upload(buffer: Buffer, folder: string): Promise<StorageAsset> {
    const key = `${folder}/${crypto.randomUUID()}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      })
    );

    return {
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      storageKey: key,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })
    );

    return true;
  }

  async deleteMany(storageKeys: string[]): Promise<boolean> {
    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: storageKeys.map((key) => ({
            Key: key,
          })),
        },
      })
    );

    return true;
  }
}
