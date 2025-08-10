import { Request, Response } from "express";
import * as questionService from "../services/question.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import { CreateQuestionData, UpdateQuestionData, TestStep } from "../types";

/**
 * Create a new question (Admin only)
 * POST /api/v1/questions
 */
export const createQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const questionData: CreateQuestionData = {
    competencyId: req.body.competencyId,
    level: req.body.level,
    questionText: req.body.questionText,
    options: req.body.options,
    correctOptionIndex: req.body.correctOptionIndex,
    difficulty: req.body.difficulty,
  };

  const result = await questionService.createQuestion(questionData);
  handleServiceResponse(res, result);
};

/**
 * Get questions with filtering and pagination
 * GET /api/v1/questions
 */
export const getQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const filters: any = {
    competencyId: req.query.competencyId as string,
    level: req.query.level as string | string[],
    isActive:
      req.query.isActive !== undefined ? req.query.isActive === "true" : true,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
  };

  // Add step only if provided
  if (req.query.step) {
    filters.step = parseInt(req.query.step as string) as TestStep;
  }

  // Handle array levels from query params
  if (req.query.levels && Array.isArray(req.query.levels)) {
    filters.level = req.query.levels as string[];
  }

  const result = await questionService.getQuestions(filters);
  handleServiceResponse(res, result);
};

/**
 * Get a single question by ID
 * GET /api/v1/questions/:id
 */
export const getQuestionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const questionId = req.params.id;

  const result = await questionService.getQuestionById(questionId);
  handleServiceResponse(res, result);
};

/**
 * Update a question (Admin only)
 * PUT /api/v1/questions/:id
 */
export const updateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const questionId = req.params.id;
  const updateData: UpdateQuestionData = {
    questionText: req.body.questionText,
    options: req.body.options,
    correctOptionIndex: req.body.correctOptionIndex,
    difficulty: req.body.difficulty,
    isActive: req.body.isActive,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof UpdateQuestionData] === undefined) {
      delete updateData[key as keyof UpdateQuestionData];
    }
  });

  const result = await questionService.updateQuestion(questionId, updateData);
  handleServiceResponse(res, result);
};

/**
 * Delete a question (Admin only) - Soft delete
 * DELETE /api/v1/questions/:id
 */
export const deleteQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const questionId = req.params.id;

  const result = await questionService.deleteQuestion(questionId);
  handleServiceResponse(res, result);
};

/**
 * Get questions for a specific assessment step
 * GET /api/v1/questions/step/:step
 */
export const getQuestionsForStep = async (
  req: Request,
  res: Response
): Promise<void> => {
  const step = parseInt(req.params.step) as TestStep;
  const randomize = req.query.randomize !== "false"; // Default to true

  // Validate step parameter
  if (!step || ![1, 2, 3].includes(step)) {
    res.status(400).json({
      success: false,
      message: "Invalid step parameter. Must be 1, 2, or 3.",
    });
    return;
  }

  const result = await questionService.getQuestionsForStep(step, randomize);
  handleServiceResponse(res, result);
};

/**
 * Get assessment completion status
 * GET /api/v1/questions/assessment/status
 */
export const getAssessmentCompletionStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await questionService.getAssessmentCompletionStatus();
  handleServiceResponse(res, result);
};
