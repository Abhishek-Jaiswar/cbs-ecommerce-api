import nodemailer from "nodemailer";
import { Env } from "../../config/env.config.js";
import { logger } from "../../lib/winston.js";
import { resetPasswordOtpTemplate } from "./templates/reset-password-otp-template.js";
import { verifyEmailOtpTemplate } from "./templates/verify-email-template.js";

class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Env.MAIL_USER,
        pass: Env.MAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"ZenVoraa" <${Env.MAIL_USER}>`,
        to,
        subject,
        html,
      });

      return info;
    } catch (error) {
      logger.error("Email transport error: ", error);
      throw new Error("Failed to send email", { cause: error });
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    return this.sendEmail(to, "Verify Your Email - ZenVoraa", verifyEmailOtpTemplate(otp));
  }

  async sendResetPasswordOtp(to: string, otp: string) {
    return this.sendEmail(to, "Reset Your Password - ZenVoraa", resetPasswordOtpTemplate(otp));
  }
}

export const emailService = new MailService();
