import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

/**
 * User Profile Routes
 * All routes require authentication
 */

// GET /api/v1/users/profile - Get current user's profile
router.get("/profile", authenticateToken, userController.getProfile);

// PUT /api/v1/users/profile - Update current user's profile
router.put("/profile", authenticateToken, userController.updateProfile);

// PUT /api/v1/users/change-password - Change current user's password
router.put(
  "/change-password",
  authenticateToken,
  userController.changePassword
);

/**
 * Admin Only Routes
 * Require authentication and admin role
 */

// PUT /api/v1/users/:userId/role - Change user role (Admin only)
router.put(
  "/:userId/role",
  authenticateToken,
  requireAdmin,
  userController.changeUserRole
);

export default router;
