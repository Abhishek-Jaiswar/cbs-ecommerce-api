import express, { Router } from "express";
import { wishlistController } from "./wishlist.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router: Router = express.Router();

router.use(requireAuth);

router.get("/", wishlistController.getUserWishlist);
router.post("/toggle", wishlistController.toggleWishlistItem);
router.delete("/items/:wishlistItemId", wishlistController.removeWishlistItem);

export default router;
