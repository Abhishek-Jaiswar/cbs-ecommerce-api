import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

router.get("/products");
router.get("/products/:id");
router.get("/products/active");

router.post("/products", requireAuth, requireRole("ADMIN"));

router.put("/products/:id", requireAuth, requireRole("ADMIN"));
router.put("/products/:id/colors", requireAuth, requireRole("ADMIN"));
router.put("/products/:id/sizes", requireAuth, requireRole("ADMIN"));
router.put("/products/:id/images", requireAuth, requireRole("ADMIN"));
router.put("/products/:id/variants", requireAuth, requireRole("ADMIN"));
router.put("/products/:id/specifications", requireAuth, requireRole("ADMIN"));

router.delete("/products/:id/colors/:id", requireAuth, requireRole("ADMIN"));
router.delete("/products/:id/sizes/:id", requireAuth, requireRole("ADMIN"));
router.delete("/products/:id/iamges/:id", requireAuth, requireRole("ADMIN"));
router.delete("/products/:id/variants/:id", requireAuth, requireRole("ADMIN"));
router.delete("/products/:id/specification/:id", requireAuth, requireRole("ADMIN"));
router.delete("/products/:id", requireAuth, requireRole("ADMIN"));

export default router;
