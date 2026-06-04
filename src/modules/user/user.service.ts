import argon2 from "argon2";
import { userRepository } from "./user.repository.js";
import type { TLoginPayload, TUserPayload, TUserRes } from "./user.types.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors/app-error.js";
import { userCache } from "./user.cache.js";
import crypto from "crypto";
import { emailService } from "../../services/email/mail.service.js";
import { logger } from "../../lib/winston.js";

class UserService {
  async registerService(payload: TUserPayload) {
    const existingUser = await userRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new ConflictError("User already exists with this email.");
    }

    const hashedPassword = await argon2.hash(payload.password, {
      type: argon2.argon2id,
    });

    const user = await userRepository.createUser({
      ...payload,
      password: hashedPassword,
    });

    await userCache.invalidateUserLists();
    await this.sendEmailVerificationOtp(user.email);

    return user;
  }

  async loginService(payload: TLoginPayload): Promise<TUserRes> {
    const { email, password } = payload;

    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError("User with this email not found.");
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError("Please verify your email before logging in.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(userId: string) {
    const user = await userCache.getOrSetUserMe(userId, () => userRepository.getMe(userId));

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  async getAllUsers(page: number, limit: number) {
    return userCache.getOrSetUserList(page, limit, () => userRepository.getAllUsers(page, limit));
  }

  async requestOtpService(email: string) {
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      return;
    }

    const { otp, hashedOtp } = await this.generateHashedOtp();
    await userCache.setUserOtp(email, hashedOtp);
    logger.info(`[DEBUG OTP] Password Reset OTP for ${email}: ${otp}`);
    await emailService.sendResetPasswordOtp(email, otp);
  }

  async verifyOtpService(otp: string, email: string) {
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    const cachedOtp = await userCache.getUserOtp(email);

    if (!cachedOtp) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    const isOtpValid = await argon2.verify(cachedOtp, otp);

    if (!isOtpValid) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    await userCache.deleteUserOtp(email);
    await userCache.setPasswordResetVerified(email, user.id);

    return {
      email,
      verified: true,
    };
  }

  async resetPasswordService(email: string, newPassword: string) {
    const verifiedUserId = await userCache.getPasswordResetVerifiedUserId(email);

    if (!verifiedUserId) {
      throw new BadRequestError("OTP verification is required");
    }

    const user = await userRepository.findUserByEmail(email);

    if (!user || user.id !== verifiedUserId) {
      throw new NotFoundError("Invalid email");
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });

    const updatedPassword = await userRepository.updatePassword(user.id, hashedPassword);

    await userCache.deletePasswordResetVerified(email);
    await userCache.invalidateUser(user.id);

    return updatedPassword;
  }

  async requestEmailVerificationOtpService(email: string) {
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError("User with this email not found.");
    }

    if (user.emailVerified) {
      return {
        email,
        verified: true,
      };
    }

    await this.sendEmailVerificationOtp(email);

    return {
      email,
      verified: false,
    };
  }

  async verifyEmailService(email: string, otp: string) {
    const user = await userRepository.findUserByEmail(email);

    if (!user) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    if (user.emailVerified) {
      await userCache.deleteEmailVerificationOtp(email);

      return {
        email,
        verified: true,
      };
    }

    const cachedOtp = await userCache.getEmailVerificationOtp(email);

    if (!cachedOtp) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    const isOtpValid = await argon2.verify(cachedOtp, otp);

    if (!isOtpValid) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    const verifiedUser = await userRepository.markEmailAsVerified(user.id);

    await userCache.deleteEmailVerificationOtp(email);
    await userCache.invalidateUser(user.id);

    return {
      email: verifiedUser.email,
      verified: verifiedUser.emailVerified,
    };
  }

  private async sendEmailVerificationOtp(email: string) {
    const { otp, hashedOtp } = await this.generateHashedOtp();

    await userCache.setEmailVerificationOtp(email, hashedOtp);
    logger.info(`[DEBUG OTP] Email Verification OTP for ${email}: ${otp}`);
    await emailService.sendOtpEmail(email, otp);
  }

  private async generateHashedOtp() {
    const otp = this.generateOtp();
    const hashedOtp = await argon2.hash(otp, {
      type: argon2.argon2id,
    });

    return {
      otp,
      hashedOtp,
    };
  }

  private generateOtp() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  }

  async updateUserRole(userId: string, role: "USER" | "ADMIN") {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    const updated = await userRepository.updateUser(userId, { role });
    await userCache.invalidateUser(userId);
    return updated;
  }

  async deleteUser(userId: string) {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    await userRepository.deleteUser(userId);
    await userCache.invalidateUser(userId);
    return { id: userId, success: true };
  }
}

export const userService = new UserService();
