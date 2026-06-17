import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { dashboardController } from "./dashboard.controller.js";

const router: Router = express.Router();

router.get("/overview", requireAuth, requireRole("ADMIN"), dashboardController.getOverviewStats);
router.get("/utm-reports", requireAuth, requireRole("ADMIN"), dashboardController.getUtmReports);
router.get("/campaign-budgets", requireAuth, requireRole("ADMIN"), dashboardController.getCampaignBudgets);
router.post("/campaign-budgets", requireAuth, requireRole("ADMIN"), dashboardController.upsertCampaignBudget);
router.post("/events", dashboardController.logEvent);

export default router;
