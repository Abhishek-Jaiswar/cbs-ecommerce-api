import { Router } from "express";
import { uploadController } from "./upload.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router: Router = Router();

router.post(
  "/",
  upload.single("file"),
  uploadController.uploadImage
);

export default router;