import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { orderController } from "./order.controller.js";

const router: Router = express.Router();

router.use(requireAuth);

router.get("/", requireRole("ADMIN"), orderController.getOrders);
