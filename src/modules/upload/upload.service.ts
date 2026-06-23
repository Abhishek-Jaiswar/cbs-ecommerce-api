import cloudinary from "../../lib/cloudinary.js";
import streamifier from "streamifier";

class UploadService {
  async uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder: "landing-pages",
          },
          (error, result) => {
            if (error) return reject(error);

            resolve({
              imageUrl: result?.secure_url,
              imagePublicId: result?.public_id,
            });
          }
        );

      streamifier
        .createReadStream(file.buffer)
        .pipe(stream);
    });
  }
}

export const uploadService =
  new UploadService();