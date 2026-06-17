import express, { Router } from "express";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";
import { reportsController } from "./reports.controller.js";

const router: Router = express.Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/history", reportsController.getReportsHistory);
router.post("/generate", reportsController.generateReport);
router.get("/preview", reportsController.getReportPreview);

export default router;
