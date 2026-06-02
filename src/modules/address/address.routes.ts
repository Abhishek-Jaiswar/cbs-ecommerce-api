import express, { Router } from "express";
import { addressController } from "./address.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router: Router = express.Router();

// All address routes require JWT authentication
router.use(requireAuth);

router.get("/", addressController.getMyAddresses);
router.get("/:id", addressController.getAddressById);
router.post("/", addressController.createAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);

export default router;
