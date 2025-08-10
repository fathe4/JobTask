import { Router } from "express";
import * as assessmentController from "../controllers/assessment.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireStudent } from "../middleware/rbac.middleware";

const router = Router();

// All assessment routes require authentication
router.use(authenticateToken);

// Student-only assessment routes
router.use(requireStudent);

/**
 * Assessment Eligibility & Management Routes
 */

// Check eligibility for assessment step
router.get("/eligibility/:step", assessmentController.checkEligibility);

// Start new assessment
router.post("/start", assessmentController.startAssessment);

// Get user's assessment history
router.get("/history", assessmentController.getUserAssessments);

/**
 * Active Assessment Routes (require testId)
 */

// Get current question
router.get(
  "/:testId/current-question",
  assessmentController.getCurrentQuestion
);

// Submit answer to current question
router.post("/:testId/submit-answer", assessmentController.submitAnswer);

// Skip current question
router.post("/:testId/skip-question", assessmentController.skipQuestion);

// Navigate between questions
router.post("/:testId/navigate", assessmentController.navigateQuestion);

// Complete assessment
router.post("/:testId/complete", assessmentController.completeAssessment);

export default router;
