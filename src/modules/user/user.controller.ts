import type { Request, Response, NextFunction } from "express";
import {
  loginSchema,
  OtpSchema,
  registerSchema,
  validateForgetPasswordSchema,
  validateNewPassword,
} from "./user.schema.js";
import { userService } from "./user.service.js";
import { generateAccessToken } from "../../utils/token.js";
import { clearAuthCookies, setAuthCookies } from "../../utils/cookies.js";

class UserController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = registerSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation Failed",
          success: false,
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const user = await userService.registerService(validation.data);

      return res.status(201).json({
        message: "User registered successfully. Please verify your email.",
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const user = await userService.loginService(validation.data);

      const payload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = generateAccessToken(payload);

      setAuthCookies(res, token);

      return res.status(200).json({
        message: "Login successful",
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      const user = await userService.getMe(userId);

      return res.status(200).json({
        success: true,
        message: "Got you!",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit);
      const page = Number(req.query.page);

      const user = await userService.getAllUsers(page, limit);

      if (!user || user.items.length === 0) {
        return res.status(404).json({
          message: "Failed to fetch users",
          success: false,
        });
      }

      return res.status(200).json({
        message: "User fetched successfully",
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateForgetPasswordSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      await userService.requestOtpService(validation.data.email);

      return res.status(201).json({
        message: "If this email exists, an OTP has been sent.",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestOtpVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = OtpSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          success: false,
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const verifiedOtp = await userService.verifyOtpService(
        validation.data.otp,
        validation.data.email
      );

      return res.status(200).json({
        message: "Password reset OTP has been verified",
        success: true,
        data: verifiedOtp,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateNewPassword.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          success: false,
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const updatedPassword = await userService.resetPasswordService(
        validation.data.email,
        validation.data.newPassword
      );

      return res.status(200).json({
        message: "Password reset successfully",
        success: true,
        data: updatedPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestEmailVerificationOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateForgetPasswordSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Failed",
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const result = await userService.requestEmailVerificationOtpService(validation.data.email);

      return res.status(200).json({
        message: result.verified ? "Email is already verified" : "Verification OTP has been sent.",
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = OtpSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          success: false,
          error: validation.error.issues.map((issue) => issue.message),
        });
      }

      const verifiedEmail = await userService.verifyEmailService(
        validation.data.email,
        validation.data.otp
      );

      return res.status(200).json({
        message: "Email verified successfully",
        success: true,
        data: verifiedEmail,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
