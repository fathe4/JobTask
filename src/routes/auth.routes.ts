import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { fullName, email, password, role? }
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP for email verification
 * @access  Public
 * @body    { email, otpCode }
 */
router.post("/verify-otp", authController.verifyOTP);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP for email verification
 * @access  Public
 * @body    { email }
 */
router.post("/resend-otp", authController.resendOTP);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    { email }
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    { token, newPassword }
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 * @body    { refreshToken? }
 */
router.post("/logout", authController.logout);

export default router;
