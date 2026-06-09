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
}

export const dashboardController = new DashboardController();
