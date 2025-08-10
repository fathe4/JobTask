import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/User.model";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { ApiResponse } from "../types";
import {
  serviceWrapper,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";
import * as emailService from "./email.service";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5");

// Generate OTP
export const generateOTP = (): { code: string; expiry: Date } => {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  return { code, expiry };
};

// Generate reset token
export const generateResetToken = (): { token: string; expiry: Date } => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return { token, expiry };
};

// Register user
export const registerUser = async (userData: {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "User with this email already exists"
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Generate OTP for email verification
    const { code: otpCode, expiry: otpExpiry } = generateOTP();

    // Create user
    const user = new User({
      fullName: userData.fullName,
      email: userData.email,
      passwordHash,
      role: userData.role || "student",
      emailVerified: false,
      otpCode,
      otpExpiry,
    });

    await user.save();

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(
      userData.email,
      otpCode,
      userData.fullName
    );

    if (!emailResult.success) {
      // Log email error but don't fail registration
      console.error("Failed to send OTP email:", emailResult.message);
    }

    return createSuccessResponse(
      "User registered successfully. Please check your email for verification code.",
      {
        userId: user._id,
        email: user.email,
        emailSent: emailResult.success,
      },
      httpStatus.CREATED
    );
  }, "Registration failed");
};

// Verify OTP
export const verifyOTP = async (
  email: string,
  otpCode: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (!user.otpCode || !user.otpExpiry) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No OTP found for this user");
    }

    if (new Date() > user.otpExpiry) {
      throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
    }

    if (user.otpCode !== otpCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP code");
    }

    // Mark email as verified and clear OTP
    user.emailVerified = true;
    delete user.otpCode;
    delete user.otpExpiry;
    await user.save();

    return createSuccessResponse("Email verified successfully");
  }, "OTP verification failed");
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    // Check if email is verified
    // if (!user.emailVerified) {
    //   throw new ApiError(
    //     httpStatus.FORBIDDEN,
    //     "Please verify your email before logging in"
    //   );
    // }

    // Compare password using instance method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());

    return createSuccessResponse("Login successful", {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  }, "Login failed");
};

// Resend OTP
export const resendOTP = async (email: string): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.emailVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified");
    }

    // Generate new OTP
    const { code: otpCode, expiry: otpExpiry } = generateOTP();
    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(
      email,
      otpCode,
      user.fullName
    );

    if (!emailResult.success) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP email"
      );
    }

    return createSuccessResponse("New OTP sent successfully", {
      emailSent: true,
    });
  }, "Failed to resend OTP");
};

// Forgot password
export const forgotPassword = async (email: string): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Generate reset token
    const { token, expiry } = generateResetToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = expiry;
    await user.save();

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      email,
      token,
      user.fullName
    );

    if (!emailResult.success) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send password reset email"
      );
    }

    return createSuccessResponse("Password reset link sent to your email", {
      emailSent: true,
    });
  }, "Failed to process forgot password request");
};

// Reset password
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid or expired reset token"
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpiry;
    await user.save();

    return createSuccessResponse("Password reset successfully");
  }, "Failed to reset password");
};
