import type { Request, Response } from "express";
import { uploadService } from "./upload.service.js";

class UploadController {
  uploadImage = async (
    req: Request,
    res: Response
  ) => {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File required",
      });
    }

    const result =
      await uploadService.uploadImage(file);

    return res.status(200).json({
      success: true,
      data: result,
    });
  };
}

export const uploadController =
  new UploadController();