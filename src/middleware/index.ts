/**
 * Middleware Index - Test_School Assessment Platform
 * Central export for all authentication and authorization middleware
 */

// Authentication middleware
export { authenticateToken, requireEmailVerification } from "./auth.middleware";

// Role-based access control middleware
export {
  requireRole,
  requireAdmin,
  requireStudent,
  requireSupervisor,
  requireManagement,
  requireOwnershipOrAdmin,
} from "./rbac.middleware";

// Common middleware combinations for easy use
import { authenticateToken } from "./auth.middleware";
import {
  requireAdmin,
  requireStudent,
  requireManagement,
} from "./rbac.middleware";

/**
 * Pre-configured middleware chains for common use cases
 */

// Authentication + Admin role
export const authAdmin = [authenticateToken, requireAdmin];

// Authentication + Student role
export const authStudent = [authenticateToken, requireStudent];

// Authentication + Management roles (Admin or Supervisor)
export const authManagement = [authenticateToken, requireManagement];
