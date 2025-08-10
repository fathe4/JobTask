import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import { UserRole } from "../types";

/**
 * Get all users (Admin only)
 * Supports pagination and filtering
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { page = 1, limit = 10, role, search, verified } = req.query;

  const result = await userService.getAllUsers(
    parseInt(page as string),
    parseInt(limit as string),
    role as UserRole | "all",
    search as string,
    verified as "all" | "verified" | "unverified"
  );

  handleServiceResponse(res, result);
};

/**
 * Get current user's profile
 * Requires authentication
 */
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  // User ID comes from authenticated middleware
  const userId = req.user!.id;

  const result = await userService.getUserProfile(userId);
  handleServiceResponse(res, result);
};

/**
 * Update current user's profile (name only)
 * Requires authentication
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;
  const { fullName } = req.body;

  const result = await userService.updateUserProfile(userId, {
    fullName,
  });

  handleServiceResponse(res, result);
};

/**
 * Change current user's password
 * Requires authentication
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  const result = await userService.changePassword(
    userId,
    currentPassword,
    newPassword
  );
  handleServiceResponse(res, result);
};

/**
 * Change user role (Admin only)
 * Requires authentication and admin role
 */
export const changeUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const { role } = req.body;

  const result = await userService.changeUserRole(userId, role as UserRole);
  handleServiceResponse(res, result);
};
