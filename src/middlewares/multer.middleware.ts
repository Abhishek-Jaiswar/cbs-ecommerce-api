import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only jpg, jped, webp, and png is allowed"));
  }

  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: MAX_FILE_SIZE,
    files: 10,
  },
  fileFilter,
});
