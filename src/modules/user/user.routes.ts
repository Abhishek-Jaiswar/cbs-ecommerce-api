import express, { Router } from "express";
import { userController } from "./user.controller.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import { requireRole } from "../../middlewares/require-role.js";

const router: Router = express.Router();

router.get("/get-me", requireAuth, userController.getMe);
router.get("/get-all", requireAuth, requireRole("ADMIN"), userController.getAll);

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

router.post("/email-verification/request-otp", userController.requestEmailVerificationOtp);
router.post("/email-verification/verify-otp", userController.verifyEmail);

router.post("/forgot-password/request-otp", userController.requestPasswordResetOtp);
router.post("/forgot-password/verify-otp", userController.requestOtpVerification);
router.put("/forgot-password/reset-password", userController.resetPassword);

// Administrative Routes
router.get("/:id", requireAuth, requireRole("ADMIN"), userController.getUserById);
router.patch("/:id/role", requireAuth, requireRole("ADMIN"), userController.updateUserRole);
router.delete("/:id", requireAuth, requireRole("ADMIN"), userController.deleteUser);

export default router;
