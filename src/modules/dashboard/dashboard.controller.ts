import type { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service.js";

class DashboardController {
  async getOverviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getOverviewStats();
      
      return res.status(200).json({
        success: true,
        message: "Dashboard stats retrieved successfully.",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUtmReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await dashboardService.getUtmReports();
      return res.status(200).json({
        success: true,
        message: "UTM campaign reports retrieved successfully.",
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCampaignBudgets(req: Request, res: Response, next: NextFunction) {
    try {
      const budgets = await dashboardService.getCampaignBudgets();
      return res.status(200).json({
        success: true,
        message: "Campaign budgets retrieved successfully.",
        data: budgets,
      });
    } catch (error) {
      next(error);
    }
  }

  async upsertCampaignBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignName, budget, source, medium } = req.body;
      if (!campaignName) {
        return res.status(400).json({
          success: false,
          message: "Campaign name is required",
        });
      }
      
      const newBudget = await dashboardService.upsertCampaignBudget({
        campaignName,
        budget: Number(budget) || 0,
        source: source || null,
        medium: medium || null,
      });

      return res.status(200).json({
        success: true,
        message: "Campaign budget updated successfully.",
        data: newBudget,
      });
    } catch (error) {
      next(error);
    }
  }

  async logEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventName, utmCampaign, utmSource, utmMedium, sessionValue, metadata } = req.body;
      if (!eventName) {
        return res.status(400).json({
          success: false,
          message: "Event name is required",
        });
      }

      const event = await dashboardService.logEvent({
        eventName,
        utmCampaign: utmCampaign || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        sessionValue: sessionValue || null,
        metadata: metadata || null,
      });

      return res.status(201).json({
        success: true,
        message: "Event logged successfully.",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
