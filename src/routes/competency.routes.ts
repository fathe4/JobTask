import { Router } from "express";
import * as competencyController from "../controllers/competency.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

/**
 * Admin Only Routes - Specific paths first to avoid conflicts
 * Require authentication and admin role
 */

// GET /api/v1/competencies/with-usage - Get all competencies with usage statistics (Admin only)
router.get(
  "/with-usage",
  authenticateToken,
  requireAdmin,
  competencyController.getCompetenciesWithUsage
);

// POST /api/v1/competencies - Create a new competency (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  competencyController.createCompetency
);

/**
 * Public/Authenticated Routes
 * Available to all authenticated users
 */

// GET /api/v1/competencies - Get competencies with filtering and pagination
router.get("/", authenticateToken, competencyController.getCompetencies);

/**
 * Routes with ID parameters - Must be last to avoid conflicts
 */

// GET /api/v1/competencies/:id/usage - Get competency usage information
router.get(
  "/:id/usage",
  authenticateToken,
  competencyController.getCompetencyUsage
);

// GET /api/v1/competencies/:id - Get a single competency by ID
router.get("/:id", authenticateToken, competencyController.getCompetencyById);

// PUT /api/v1/competencies/:id - Update a competency (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  competencyController.updateCompetency
);

// DELETE /api/v1/competencies/:id - Delete a competency (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  competencyController.deleteCompetency
);

export default router;
