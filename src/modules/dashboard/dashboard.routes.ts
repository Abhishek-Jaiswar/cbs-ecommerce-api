import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { dashboardController } from "./dashboard.controller.js";

const router: Router = express.Router();

router.get("/overview", requireAuth, requireRole("ADMIN"), dashboardController.getOverviewStats);

export default router;
