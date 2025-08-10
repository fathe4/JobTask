import { User } from "../models/User.model";
import { ApiResponse, UserRole } from "../types";
import {
  serviceWrapper,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";
import bcrypt from "bcrypt";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");

/**
 * Get all users with pagination and filtering (Admin only)
 */
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  role?: UserRole | "all",
  search?: string,
  verified?: "all" | "verified" | "unverified"
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Build query filter
    const filter: any = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (verified && verified !== "all") {
      if (verified === "verified") {
        filter.emailVerified = true;
      } else if (verified === "unverified") {
        filter.emailVerified = false;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users and total count
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -otpCode -resetPasswordToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return createSuccessResponse("Users retrieved successfully", {
      users: users.map((user) => ({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }, "Failed to retrieve users");
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findById(userId).select(
      "-passwordHash -otpCode -resetPasswordToken"
    );

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return createSuccessResponse("Profile retrieved successfully", {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }, "Failed to retrieve profile");
};

/**
 * Update user profile (only name changes allowed)
 */
export const updateUserProfile = async (
  userId: string,
  updateData: {
    fullName?: string;
  }
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Update only allowed fields
    if (updateData.fullName) {
      user.fullName = updateData.fullName;
    }

    await user.save();

    return createSuccessResponse("Profile updated successfully", {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt,
      },
    });
  }, "Failed to update profile");
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Current password is incorrect"
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordHash = newPasswordHash;

    await user.save();

    return createSuccessResponse("Password changed successfully");
  }, "Failed to change password");
};

/**
 * Change user role (Admin only operation)
 */
export const changeUserRole = async (
  targetUserId: string,
  newRole: UserRole
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Validate role
    const validRoles: UserRole[] = ["admin", "student", "supervisor"];
    if (!validRoles.includes(newRole)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    // Find target user
    const user = await User.findById(targetUserId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Check if role is already the same
    if (user.role === newRole) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `User already has the role: ${newRole}`
      );
    }

    // Update role
    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    return createSuccessResponse("User role updated successfully", {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt,
      },
      roleChange: {
        from: oldRole,
        to: newRole,
        changedAt: user.updatedAt,
      },
    });
  }, "Failed to change user role");
};
