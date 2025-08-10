import { Question } from "../models/Question.model";
import { Competency } from "../models/Competency.model";
import {
  ApiResponse,
  CreateQuestionData,
  UpdateQuestionData,
  QuestionFilters,
  TestStep,
  AssessmentCompletionStatus,
  StepStatus,
} from "../types";
import {
  serviceWrapper,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";
import {
  getStepLevels,
  shuffleArray,
  validateQuestionOptions,
  validateCorrectAnswerIndex,
  calculateStepReadiness,
} from "../utils/questionHelpers";
import mongoose from "mongoose";

/**
 * Create a new question (Admin only)
 */
export const createQuestion = async (
  questionData: CreateQuestionData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Validate competency exists
    const competency = await Competency.findById(questionData.competencyId);
    if (!competency) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid competency ID");
    }

    // Validate options array using helper function
    if (!validateQuestionOptions(questionData.options)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Question must have exactly 4 non-empty options"
      );
    }

    // Validate correct answer index using helper function
    if (
      !validateCorrectAnswerIndex(
        questionData.correctOptionIndex,
        questionData.options.length
      )
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Correct option index must be between 0 and 3"
      );
    }

    // Check if question already exists for this competency-level combination
    const existingQuestion = await Question.findOne({
      competencyId: questionData.competencyId,
      level: questionData.level,
    });

    if (existingQuestion) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Question already exists for ${competency.name} at level ${questionData.level}`
      );
    }

    // Create the question
    const question = new Question(questionData);
    await question.save();

    // Populate competency info for response
    await question.populate("competencyId", "name description");

    return createSuccessResponse("Question created successfully", {
      question: {
        id: question._id,
        competencyId: question.competencyId,
        level: question.level,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        difficulty: question.difficulty,
        isActive: question.isActive,
        createdAt: question.createdAt,
      },
    });
  }, "Failed to create question");
};

/**
 * Get questions with filtering and pagination
 */
export const getQuestions = async (
  filters: QuestionFilters = {}
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const {
      competencyId,
      level,
      step,
      isActive = true,
      page = 1,
      limit = 50,
    } = filters;

    // Build query
    const query: any = { isActive };

    if (competencyId) {
      query.competencyId = competencyId;
    }

    // Handle step-based level filtering
    if (step) {
      const stepLevels = getStepLevels(step);
      query.level = { $in: stepLevels };
    } else if (level) {
      if (Array.isArray(level)) {
        query.level = { $in: level };
      } else {
        query.level = level;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population and pagination
    const [questions, totalCount] = await Promise.all([
      Question.find(query)
        .populate("competencyId", "name description")
        .sort({ level: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return createSuccessResponse("Questions retrieved successfully", {
      questions: questions.map((q) => ({
        id: q._id,
        competencyId: q.competencyId,
        level: q.level,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        difficulty: q.difficulty,
        isActive: q.isActive,
        createdAt: q.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext,
        hasPrev,
      },
    });
  }, "Failed to retrieve questions");
};

/**
 * Get a single question by ID
 */
export const getQuestionById = async (
  questionId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid question ID");
    }

    const question = await Question.findById(questionId).populate(
      "competencyId",
      "name description"
    );

    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    }

    return createSuccessResponse("Question retrieved successfully", {
      question: {
        id: question._id,
        competencyId: question.competencyId,
        level: question.level,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        difficulty: question.difficulty,
        isActive: question.isActive,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    });
  }, "Failed to retrieve question");
};

/**
 * Update a question (Admin only)
 */
export const updateQuestion = async (
  questionId: string,
  updateData: UpdateQuestionData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid question ID");
    }

    const question = await Question.findById(questionId);
    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    }

    // Validate options if provided using helper function
    if (updateData.options && !validateQuestionOptions(updateData.options)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Question must have exactly 4 non-empty options"
      );
    }

    // Validate correct answer index if provided using helper function
    if (
      updateData.correctOptionIndex !== undefined &&
      !validateCorrectAnswerIndex(
        updateData.correctOptionIndex,
        updateData.options?.length || question.options.length
      )
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Correct option index must be between 0 and 3"
      );
    }

    // Update the question
    Object.assign(question, updateData);
    await question.save();

    // Populate competency info for response
    await question.populate("competencyId", "name description");

    return createSuccessResponse("Question updated successfully", {
      question: {
        id: question._id,
        competencyId: question.competencyId,
        level: question.level,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        difficulty: question.difficulty,
        isActive: question.isActive,
        updatedAt: question.updatedAt,
      },
    });
  }, "Failed to update question");
};

/**
 * Delete a question (Admin only)
 */
export const deleteQuestion = async (
  questionId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid question ID");
    }

    const question = await Question.findById(questionId);
    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    }

    // Soft delete by setting isActive to false
    question.isActive = false;
    await question.save();

    return createSuccessResponse("Question deleted successfully", {
      questionId: question._id,
    });
  }, "Failed to delete question");
};

/**
 * Get questions for a specific assessment step
 * This function selects 44 questions covering all competencies for the step
 */
export const getQuestionsForStep = async (
  step: TestStep,
  randomize: boolean = true
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const stepLevels = getStepLevels(step);

    // Get all active questions for this step
    const questions = await Question.find({
      level: { $in: stepLevels },
      isActive: true,
    }).populate("competencyId", "name description");

    // Validate we have questions for all competencies
    const competencyCount = await Competency.countDocuments();
    const questionsPerCompetency = questions.reduce(
      (acc, question) => {
        const compId = (question.competencyId as any)._id.toString();
        acc[compId] = (acc[compId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Check if we have the required distribution
    const requiredPerCompetency = 2; // 2 levels per step
    const totalRequired = competencyCount * requiredPerCompetency;

    if (questions.length < totalRequired) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Insufficient questions for step ${step}. Required: ${totalRequired}, Available: ${questions.length}`
      );
    }

    // Randomize if requested using helper function
    let selectedQuestions = questions;
    if (randomize) {
      selectedQuestions = shuffleArray([...questions]);
    }

    return createSuccessResponse(
      `Questions for step ${step} retrieved successfully`,
      {
        step,
        levels: stepLevels,
        totalQuestions: selectedQuestions.length,
        questions: selectedQuestions.map((q) => ({
          id: q._id,
          competencyId: q.competencyId,
          level: q.level,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          difficulty: q.difficulty,
        })),
      }
    );
  }, `Failed to retrieve questions for step ${step}`);
};

/**
 * Get assessment completion status - how many questions exist vs required
 */
export const getAssessmentCompletionStatus = async (): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const competencies = await Competency.find({});
    const totalCompetencies = competencies.length;
    const requiredQuestionsTotal = totalCompetencies * 6; // 6 levels per competency

    // Count questions by level
    const questionCounts = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]);

    const countsByLevel = questionCounts.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate step readiness using helper function
    const steps = [
      { step: 1 as TestStep, levels: ["A1", "A2"] },
      { step: 2 as TestStep, levels: ["B1", "B2"] },
      { step: 3 as TestStep, levels: ["C1", "C2"] },
    ];

    const stepStatus: StepStatus[] = steps.map((stepInfo) => {
      const questionsAvailable = stepInfo.levels.reduce(
        (sum, level) => sum + (countsByLevel[level] || 0),
        0
      );
      const questionsRequired = totalCompetencies * 2; // 2 levels per step
      const readinessInfo = calculateStepReadiness(
        questionsAvailable,
        questionsRequired
      );

      return {
        step: stepInfo.step,
        levels: stepInfo.levels as any,
        questionsRequired,
        questionsAvailable,
        isReady: readinessInfo.isReady,
        completion: readinessInfo.completion,
      };
    });

    const totalQuestionsAvailable = Object.values(countsByLevel).reduce(
      (sum: number, count: number) => sum + count,
      0
    );

    const overallCompletion = Math.round(
      (totalQuestionsAvailable / requiredQuestionsTotal) * 100
    );

    const completionStatus: AssessmentCompletionStatus = {
      totalCompetencies,
      requiredQuestionsTotal,
      totalQuestionsAvailable,
      overallCompletion,
      stepStatus,
      questionsByLevel: countsByLevel,
    };

    return createSuccessResponse(
      "Assessment status retrieved successfully",
      completionStatus
    );
  }, "Failed to retrieve assessment completion status");
};
