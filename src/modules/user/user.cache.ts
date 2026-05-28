import { cacheService } from "../../lib/shared/cache.js";
import { logger } from "../../lib/winston.js";

const USER_CACHE_TTL_SECONDS = 60 * 5;
const USER_LIST_VERSION_FALLBACK = 1;
const USER_LIST_VERSION_KEY = "user:list:version";
const USER_OTP_TTL_SECONDS = 60 * 10;

const buildUserDetailsKey = (userId: string) => `user:details:${userId}`;

const buildUserMeKey = (userId: string) => `user:me:${userId}`;

const buildUserListKey = (version: number, page: number, limit: number) =>
  `user:list:v${version}:page:${page}:limit:${limit}`;

const buildUserOtpKey = (email: string) => `forgot-password:otp:${email}`;

const buildPasswordResetVerifiedKey = (email: string) => `forgot-password:verified:${email}`;

const buildEmailVerificationOtpKey = (email: string) => `email-verification:otp:${email}`;

class UserCache {
  private async getListVersion() {
    return cacheService.getNumber(USER_LIST_VERSION_KEY, USER_LIST_VERSION_FALLBACK);
  }

  async getOrSetUserDetails<T>(userId: string, producer: () => Promise<T>) {
    return cacheService.remember(buildUserDetailsKey(userId), USER_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetUserMe<T>(userId: string, producer: () => Promise<T>) {
    return cacheService.remember(buildUserMeKey(userId), USER_CACHE_TTL_SECONDS, producer);
  }

  async getOrSetUserList<T>(page: number, limit: number, producer: () => Promise<T>) {
    const version = await this.getListVersion();

    return cacheService.remember(
      buildUserListKey(version, page, limit),
      USER_CACHE_TTL_SECONDS,
      producer
    );
  }

  async invalidateUserLists() {
    const nextVersion = await cacheService.increment(USER_LIST_VERSION_KEY);

    if (nextVersion === null) {
      return;
    }

    logger.info("User list cache invalidated", {
      versionKey: USER_LIST_VERSION_KEY,
      nextVersion,
    });
  }

  async invalidateUser(userId: string) {
    const deletedKeys = await cacheService.delete(
      buildUserDetailsKey(userId),
      buildUserMeKey(userId)
    );

    logger.info("User cache invalidated", {
      userId,
      deletedKeys,
    });

    await this.invalidateUserLists();
  }

  async setUserOtp(email: string, hashedOtp: string) {
    return await cacheService.set(buildUserOtpKey(email), hashedOtp, USER_OTP_TTL_SECONDS);
  }

  async getUserOtp(email: string) {
    return cacheService.get(buildUserOtpKey(email));
  }

  async deleteUserOtp(email: string) {
    return cacheService.delete(buildUserOtpKey(email));
  }

  async setPasswordResetVerified(email: string, userId: string) {
    return cacheService.set(buildPasswordResetVerifiedKey(email), userId, USER_OTP_TTL_SECONDS);
  }

  async getPasswordResetVerifiedUserId(email: string) {
    return cacheService.get(buildPasswordResetVerifiedKey(email));
  }

  async deletePasswordResetVerified(email: string) {
    return cacheService.delete(buildPasswordResetVerifiedKey(email));
  }

  async setEmailVerificationOtp(email: string, hashedOtp: string) {
    return cacheService.set(buildEmailVerificationOtpKey(email), hashedOtp, USER_OTP_TTL_SECONDS);
  }

  async getEmailVerificationOtp(email: string) {
    return cacheService.get(buildEmailVerificationOtpKey(email));
  }

  async deleteEmailVerificationOtp(email: string) {
    return cacheService.delete(buildEmailVerificationOtpKey(email));
  }
}

export const userCache = new UserCache();
