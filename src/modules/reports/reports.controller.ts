import type { NextFunction, Request, Response } from "express";
import { reportsService } from "./reports.service.js";

class ReportsController {
  async getReportsHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const history = await reportsService.getReportsHistory(userId);

      return res.status(200).json({
        success: true,
        message: "Fetched report generation history",
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { reportType, filter, format, startDate, endDate } = req.body;
      if (!reportType || !filter || !format) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: reportType, filter, and format are required",
        });
      }

      const report = await reportsService.generateReportFile(
        userId,
        reportType,
        filter,
        format,
        startDate,
        endDate
      );

      return res.status(201).json({
        success: true,
        message: "Report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportType, filter, startDate, endDate } = req.query;
      if (!reportType || !filter) {
        return res.status(400).json({
          success: false,
          message: "Missing required query parameters: reportType and filter are required",
        });
      }

      const previewData = await reportsService.getPreviewData(
        reportType as string,
        filter as string,
        startDate as string | undefined,
        endDate as string | undefined
      );

      return res.status(200).json({
        success: true,
        message: "Fetched report preview data",
        data: previewData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
