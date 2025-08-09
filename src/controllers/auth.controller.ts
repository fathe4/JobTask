import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { httpStatus } from "../utils/httpStatus";
import { handleServiceResponse } from "../utils/serviceWrapper";

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password, role } = req.body;

  const result = await authService.registerUser({
    fullName,
    email,
    password,
    role,
  });

  handleServiceResponse(res, result);
};

/**
 * Verify OTP for email verification
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otpCode } = req.body;

  const result = await authService.verifyOTP(email, otpCode);

  handleServiceResponse(res, result);
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  handleServiceResponse(res, result);
};

/**
 * Resend OTP for email verification
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const result = await authService.resendOTP(email);

  handleServiceResponse(res, result);
};

/**
 * Request password reset
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  const result = await authService.forgotPassword(email);

  handleServiceResponse(res, result);
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, newPassword } = req.body;

  const result = await authService.resetPassword(token, newPassword);

  handleServiceResponse(res, result);
};

/**
 * Refresh access token (placeholder for future implementation)
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  // TODO: Implement token refresh logic
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Token refresh not implemented yet",
  });
};

/**
 * Logout user (placeholder for future implementation)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement logout logic (token blacklisting)
  res.status(httpStatus.OK).json({
    success: true,
    message: "Logout successful",
  });
};
