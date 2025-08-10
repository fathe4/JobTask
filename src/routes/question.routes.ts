import { Router } from "express";
import * as questionController from "../controllers/question.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/rbac.middleware";

const router = Router();

/**
 * Admin Only Routes - Specific paths first to avoid conflicts
 * Require authentication and admin role
 */

// GET /api/v1/questions/assessment/status - Get assessment completion status (Admin only)
router.get(
  "/assessment/status",
  authenticateToken,
  requireAdmin,
  questionController.getAssessmentCompletionStatus
);

// GET /api/v1/questions/step/:step - Get questions for assessment step
router.get(
  "/step/:step",
  authenticateToken,
  questionController.getQuestionsForStep
);

// POST /api/v1/questions - Create a new question (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  questionController.createQuestion
);

/**
 * Public/Authenticated Routes
 * Available to all authenticated users
 */

// GET /api/v1/questions - Get questions with filtering and pagination
router.get("/", authenticateToken, questionController.getQuestions);

/**
 * Routes with ID parameters - Must be last to avoid conflicts
 */

// GET /api/v1/questions/:id - Get a single question by ID
router.get("/:id", authenticateToken, questionController.getQuestionById);

// PUT /api/v1/questions/:id - Update a question (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  questionController.updateQuestion
);

// DELETE /api/v1/questions/:id - Delete a question (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  questionController.deleteQuestion
);

export default router;
