import express, { Router } from "express";
import { cartController } from "./cart.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router: Router = express.Router();

// Guard all cart endpoints
router.use(requireAuth);

router.get("/", cartController.getUserCart);
router.post("/add-to-cart", cartController.addToCart);
router.put("/items/:cartItemId", cartController.updateCartItemQuantity);
router.delete("/items/:cartItemId", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

export default router;
