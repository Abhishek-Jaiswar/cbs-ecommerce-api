import type {
 Request,
 Response,
 NextFunction,
} from "express";

import {
 landingPageService,
} from "./landing.service.js";

class LandingPageController {

  create =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .create(
        req.body
      );

      return res
      .status(201)
      .json({
        success: true,
        message:
          "Landing page created successfully",
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  getAll =
  async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .getAll();

      return res
      .status(200)
      .json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  getById =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .getById(
        req.params.id as string
      );

      return res
      .status(200)
      .json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  getBySlug =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .getBySlug(
        req.params.slug as string
      );

      return res
      .status(200)
      .json({
        success: true,
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  update =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .update(
        req.params.id as string,
        req.body
      );

      return res
      .status(200)
      .json({
        success: true,
        message:
          "Landing page updated successfully",
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  delete =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .delete(
        req.params.id as string
      );

      return res
      .status(200)
      .json({
        success: true,
        message:
          "Landing page deleted successfully",
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  publish =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .publish(
        req.params.id as string
      );

      return res
      .status(200)
      .json({
        success: true,
        message:
          "Landing page published",
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

  unpublish =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try {

      const result =
      await landingPageService
      .unpublish(
        req.params.id as string
      );

      return res
      .status(200)
      .json({
        success: true,
        message:
          "Landing page unpublished",
        data: result,
      });

    } catch (error) {
      next(error);
    }

  };

}

export const landingPageController =
new LandingPageController();