import { Request, Response } from "express";
import * as assessmentService from "../services/assessment.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import {
  StartAssessmentData,
  SubmitAnswerData,
  CompleteAssessmentData,
  TestStep,
} from "../types";

/**
 * Check user eligibility for assessment step
 * GET /api/v1/assessments/eligibility/:step
 */
export const checkEligibility = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;
  const step = parseInt(req.params.step) as TestStep;

  // Validate step parameter
  if (!step || ![1, 2, 3].includes(step)) {
    res.status(400).json({
      success: false,
      message: "Invalid step parameter. Must be 1, 2, or 3.",
    });
    return;
  }

  const result = await assessmentService.checkUserEligibility(userId, step);
  handleServiceResponse(res, result);
};

/**
 * Start a new assessment
 * POST /api/v1/assessments/start
 */
export const startAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;
  const step = parseInt(req.body.step) as TestStep;

  // Validate step parameter
  if (!step || ![1, 2, 3].includes(step)) {
    res.status(400).json({
      success: false,
      message: "Invalid step parameter. Must be 1, 2, or 3.",
    });
    return;
  }

  const startData: StartAssessmentData = {
    userId,
    step,
  };

  const result = await assessmentService.startAssessment(startData);
  handleServiceResponse(res, result);
};

/**
 * Get current question for active assessment
 * GET /api/v1/assessments/:testId/current-question
 */
export const getCurrentQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const testId = req.params.testId;

  const result = await assessmentService.getCurrentQuestion(testId);
  handleServiceResponse(res, result);
};

/**
 * Submit answer for current question
 * POST /api/v1/assessments/:testId/submit-answer
 */
export const submitAnswer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const testId = req.params.testId;
  const { questionId, selectedOptionIndex, timeSpent } = req.body;

  // Validate required fields
  if (
    !questionId ||
    selectedOptionIndex === undefined ||
    timeSpent === undefined
  ) {
    res.status(400).json({
      success: false,
      message:
        "Missing required fields: questionId, selectedOptionIndex, timeSpent",
    });
    return;
  }

  // Validate selectedOptionIndex
  if (selectedOptionIndex < 0 || selectedOptionIndex > 3) {
    res.status(400).json({
      success: false,
      message: "selectedOptionIndex must be between 0 and 3",
    });
    return;
  }

  const answerData: SubmitAnswerData = {
    testId,
    questionId,
    selectedOptionIndex: parseInt(selectedOptionIndex),
    timeSpent: parseInt(timeSpent),
  };

  const result = await assessmentService.submitAnswer(answerData);
  handleServiceResponse(res, result);
};

/**
 * Skip current question
 * POST /api/v1/assessments/:testId/skip-question
 */
export const skipQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const testId = req.params.testId;

  const result = await assessmentService.skipQuestion(testId);
  handleServiceResponse(res, result);
};

/**
 * Navigate between questions
 * POST /api/v1/assessments/:testId/navigate
 */
export const navigateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const testId = req.params.testId;
  const { direction } = req.body;

  // Validate direction
  if (!direction || !["next", "previous"].includes(direction)) {
    res.status(400).json({
      success: false,
      message: "Invalid direction. Must be 'next' or 'previous'.",
    });
    return;
  }

  const result = await assessmentService.navigateQuestion(testId, direction);
  handleServiceResponse(res, result);
};

/**
 * Complete assessment
 * POST /api/v1/assessments/:testId/complete
 */
export const completeAssessment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const testId = req.params.testId;
  const { totalTimeSpent } = req.body;

  // Validate totalTimeSpent
  if (totalTimeSpent === undefined || totalTimeSpent < 0) {
    res.status(400).json({
      success: false,
      message: "totalTimeSpent is required and must be >= 0",
    });
    return;
  }

  const completeData: CompleteAssessmentData = {
    testId,
    totalTimeSpent: parseInt(totalTimeSpent),
  };

  const result = await assessmentService.completeAssessment(completeData);
  handleServiceResponse(res, result);
};

/**
 * Get user's assessment history
 * GET /api/v1/assessments/history
 */
export const getUserAssessments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;

  const result = await assessmentService.getUserAssessments(userId);
  handleServiceResponse(res, result);
};
