import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";

/**
 * Role-Based Access Control (RBAC) Middleware
 * Simplified version with only essential authorization checks
 */

/**
 * Check if user has required role
 * @param allowedRoles - Array of roles that can access the resource
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication required to access this resource."
        )
      );
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}.`
        )
      );
    }

    next();
  };
};

/**
 * Admin only access
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Student only access
 */
export const requireStudent = requireRole(["student"]);

/**
 * Supervisor only access
 */
export const requireSupervisor = requireRole(["supervisor"]);

/**
 * Admin or Supervisor access (management roles)
 */
export const requireManagement = requireRole(["admin", "supervisor"]);

/**
 * Resource ownership or admin access
 * Checks if user owns the resource (userId matches) or is an admin
 * @param userIdField - Field name in request params that contains the user ID
 */
export const requireOwnershipOrAdmin = (userIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication required to access this resource."
        )
      );
    }

    const resourceUserId = req.params[userIdField];

    // Admin can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // User can access their own resources
    if (req.user.id === resourceUserId) {
      return next();
    }

    return next(
      new ApiError(
        httpStatus.FORBIDDEN,
        "Access denied. You can only access your own resources."
      )
    );
  };
};
