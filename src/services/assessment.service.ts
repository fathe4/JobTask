import { Test } from "../models/Test.model";
import { TestResponse } from "../models/TestResponse.model";
import { User } from "../models/User.model";
import { Question } from "../models/Question.model";
import { Certificate } from "../models/Certificate.model";
import {
  ApiResponse,
  TestStep,
  CompetencyLevel,
  StartAssessmentData,
  SubmitAnswerData,
  CompleteAssessmentData,
  CurrentQuestionResponse,
} from "../types";
import { serviceWrapper, createSuccessResponse } from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";
import { getStepLevels } from "../utils/questionHelpers";
import mongoose from "mongoose";
import { sendCertificateEmail } from "./email.service";

/**
 * Check if user is eligible to take a specific assessment step
 */
export const checkUserEligibility = async (
  userId: string,
  step: TestStep
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.assessmentStatus === "blocked_step1_failure") {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Assessment access blocked due to Step 1 failure (<25%)"
      );
    }

    if (step > 1) {
      const previousStep = (step - 1) as TestStep;
      const previousTest = await Test.findOne({
        userId,
        step: previousStep,
        status: "completed",
        canProceedToNextStep: true,
      });

      if (!previousTest) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Must complete Step ${previousStep} with ≥75% to access Step ${step}`
        );
      }
    }

    return createSuccessResponse(`User eligible for Step ${step}`, {
      eligible: true,
      step,
      currentLevel: user.highestLevelAchieved || null,
    });
  }, "Failed to check user eligibility");
};

/**
 * Start a new assessment - ONE QUESTION AT A TIME
 */
export const startAssessment = async (
  startData: StartAssessmentData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const { userId, step } = startData;

    // Check eligibility
    const eligibilityCheck = await checkUserEligibility(userId, step);
    if (!eligibilityCheck.success) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        eligibilityCheck.message || "Not eligible"
      );
    }

    // Check for active test - if exists, return it instead of creating new one
    const activeTest = await Test.findOne({
      userId,
      step,
      status: "in_progress",
    });

    if (activeTest) {
      // Return existing test instead of creating a new one
      return createSuccessResponse("Assessment already in progress", {
        testId: activeTest._id,
        currentQuestionIndex: activeTest.currentQuestionIndex,
        totalQuestions: activeTest.totalQuestions,
        timeElapsed: Math.floor(
          (Date.now() - activeTest.startedAt.getTime()) / 1000
        ),
        questionsAnswered: activeTest.questionsAnswered,
      });
    }

    const stepLevels = getStepLevels(step);
    const questions = await Question.find({
      level: { $in: stepLevels },
      isActive: true,
    }).sort({ competencyId: 1, level: 1 }); // Sort by competency and level for consistent order

    if (questions.length === 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `No questions available for Step ${step}`
      );
    }

    // Create question order without shuffling - use natural order
    const questionOrder = questions.map((q) => (q._id as any).toString());

    // Create test with first question as current
    const test = new Test({
      userId,
      step,
      levelsTested: stepLevels,
      totalQuestions: questions.length,
      status: "in_progress",
      questionOrder,
      currentQuestionIndex: 0,
      currentQuestionId: questionOrder[0],
      questionsAnswered: 0,
      startedAt: new Date(),
      timeLimit: questions.length * 60,
      lastQuestionStartTime: new Date(),
    });

    await test.save();

    // Create test responses in the same natural order
    const testResponses = questions.map((question, index) => ({
      testId: test._id,
      questionId: question._id,
      questionOrder: index,
      questionStartTime: index === 0 ? new Date() : undefined,
    }));

    await TestResponse.insertMany(testResponses);

    return createSuccessResponse("Assessment started successfully", {
      testId: test._id,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
    });
  }, "Failed to start assessment");
};

/**
 * Get current question for one-question-at-a-time display
 */
export const getCurrentQuestion = async (
  testId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const test = await Test.findById(testId);
    if (!test) {
      throw new ApiError(httpStatus.NOT_FOUND, "Test not found");
    }

    if (test.status !== "in_progress") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Test is not in progress");
    }

    console.log(test, "test");

    const question = await Question.findOne({
      _id: test.currentQuestionId,
    }).populate({
      path: "competencyId",
      select: "name",
      match: { name: { $exists: true } }, // only populate if competency has a name
    });
    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, "Current question not found");
    }

    console.log("question", question);
    console.log("(question.competencyId as any).name", question.competencyId);

    // Check if current question is answered or skipped
    const currentResponse = await TestResponse.findOne({
      testId,
      questionOrder: test.currentQuestionIndex,
    });

    const isCurrentQuestionAnswered =
      currentResponse &&
      (currentResponse.selectedOptionIndex !== undefined ||
        currentResponse.isSkipped);

    // Check time remaining
    const timeElapsed = Math.floor(
      (Date.now() - test.startedAt!.getTime()) / 1000
    );
    const timeRemaining = Math.max(0, test.timeLimit! - timeElapsed);

    const response: CurrentQuestionResponse = {
      question: {
        id: question._id as unknown as string,
        competency: (question.competencyId as any).name,
        level: question.level,
        questionText: question.questionText,
        options: question.options,
      },
      testProgress: {
        currentIndex: test.currentQuestionIndex!,
        totalQuestions: test.totalQuestions!,
        questionsAnswered: test.questionsAnswered!,
        progressPercentage: Math.round(
          (test.questionsAnswered! / test.totalQuestions!) * 100
        ),
        timeRemaining,
        isLastQuestion: test.currentQuestionIndex! >= test.totalQuestions! - 1,
        hasNextQuestion:
          test.currentQuestionIndex! < test.questionOrder!.length - 1,
      },
      navigation: {
        /*@ts-ignore*/
        canGoNext:
          isCurrentQuestionAnswered &&
          test.currentQuestionIndex! < test.totalQuestions! - 1,
        canGoPrevious: test.currentQuestionIndex! > 0,
        canSkip: !isCurrentQuestionAnswered,
        canSubmitTest: test.questionsAnswered! > 0,
      },
    };

    return createSuccessResponse("Current question retrieved", response);
  }, "Failed to get current question");
};

/**
 * Submit answer and move to next question
 */
export const submitAnswer = async (
  answerData: SubmitAnswerData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const { testId, questionId, selectedOptionIndex, timeSpent } = answerData;

    const test = await Test.findById(testId);
    if (!test || test.status !== "in_progress") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Test not found or not in progress"
      );
    }

    const question = await Question.findById(questionId);
    if (!question) {
      throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    }

    const testResponse = await TestResponse.findOne({ testId, questionId });
    if (!testResponse) {
      throw new ApiError(httpStatus.NOT_FOUND, "Test response not found");
    }

    // Check if already answered
    if (testResponse.selectedOptionIndex !== undefined) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Question already answered");
    }

    // Update response
    testResponse.selectedOptionIndex = selectedOptionIndex;
    testResponse.isCorrect =
      selectedOptionIndex === question.correctOptionIndex;
    testResponse.timeSpent = timeSpent;
    testResponse.answeredAt = new Date();
    testResponse.isSkipped = false; // Mark as not skipped since it's answered
    await testResponse.save();

    // Update test progress
    test.questionsAnswered = (test.questionsAnswered || 0) + 1;

    // Auto-move to next question if not at end
    if (test.currentQuestionIndex! < test.totalQuestions! - 1) {
      test.currentQuestionIndex = (test.currentQuestionIndex || 0) + 1;
      test.currentQuestionId = test.questionOrder![test.currentQuestionIndex];
      test.lastQuestionStartTime = new Date();

      // Update next question start time
      const nextResponse = await TestResponse.findOne({
        testId,
        questionOrder: test.currentQuestionIndex,
      });
      if (nextResponse && !nextResponse.questionStartTime) {
        nextResponse.questionStartTime = new Date();
        await nextResponse.save();
      }
    }

    await test.save();

    return createSuccessResponse("Answer submitted successfully", {
      isCorrect: testResponse.isCorrect,
      currentQuestionIndex: test.currentQuestionIndex,
      isLastQuestion: test.currentQuestionIndex! >= test.totalQuestions! - 1,
      autoAdvanced: test.currentQuestionIndex! < test.totalQuestions!,
    });
  }, "Failed to submit answer");
};

/**
 * Skip current question and move to next
 */
export const skipQuestion = async (testId: string): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const test = await Test.findById(testId);
    if (!test || test.status !== "in_progress") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Test not found or not in progress"
      );
    }

    // Find current question response
    const currentResponse = await TestResponse.findOne({
      testId,
      questionOrder: test.currentQuestionIndex,
    });

    if (!currentResponse) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Current question response not found"
      );
    }

    // Check if already answered or skipped
    if (
      currentResponse.selectedOptionIndex !== undefined ||
      currentResponse.isSkipped
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Question already answered or skipped"
      );
    }

    // Mark as skipped
    currentResponse.isSkipped = true;
    currentResponse.answeredAt = new Date();
    await currentResponse.save();

    // Move to next question if not at end
    if (test.currentQuestionIndex! < test.totalQuestions! - 1) {
      test.currentQuestionIndex = (test.currentQuestionIndex || 0) + 1;
      test.currentQuestionId = test.questionOrder![test.currentQuestionIndex];
      test.lastQuestionStartTime = new Date();

      // Update next question start time
      const nextResponse = await TestResponse.findOne({
        testId,
        questionOrder: test.currentQuestionIndex,
      });
      if (nextResponse && !nextResponse.questionStartTime) {
        nextResponse.questionStartTime = new Date();
        await nextResponse.save();
      }
    }

    await test.save();

    return createSuccessResponse("Question skipped successfully", {
      currentQuestionIndex: test.currentQuestionIndex,
      isLastQuestion: test.currentQuestionIndex! >= test.totalQuestions! - 1,
      autoAdvanced: test.currentQuestionIndex! < test.totalQuestions!,
    });
  }, "Failed to skip question");
};

/**
 * Navigate between questions (only if current question is answered/skipped)
 */
export const navigateQuestion = async (
  testId: string,
  direction: "next" | "previous"
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const test = await Test.findById(testId);
    if (!test || test.status !== "in_progress") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Test not found or not in progress"
      );
    }

    const currentIndex = test.currentQuestionIndex || 0;

    // Check if current question is answered or skipped (only for next navigation)
    if (direction === "next") {
      const currentResponse = await TestResponse.findOne({
        testId,
        questionOrder: currentIndex,
      });

      const isCurrentQuestionAnswered =
        currentResponse &&
        (currentResponse.selectedOptionIndex !== undefined ||
          currentResponse.isSkipped);

      if (!isCurrentQuestionAnswered) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Must submit answer or skip current question before proceeding to next"
        );
      }
    }

    let newIndex = currentIndex;

    if (direction === "next" && currentIndex < test.totalQuestions! - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === "previous" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot navigate ${direction}`
      );
    }

    test.currentQuestionIndex = newIndex;
    test.currentQuestionId = test.questionOrder![newIndex];
    test.lastQuestionStartTime = new Date();
    await test.save();

    return createSuccessResponse("Navigation successful", {
      currentQuestionIndex: newIndex,
      direction,
    });
  }, "Failed to navigate question");
};

/**
 * Complete assessment and calculate final score
 */
export const completeAssessment = async (
  completeData: CompleteAssessmentData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const { testId, totalTimeSpent } = completeData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const test = await Test.findById(testId).session(session);
      if (!test) {
        throw new ApiError(httpStatus.NOT_FOUND, "Test not found");
      }

      if (test.status === "completed") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Test already completed");
      }

      // Calculate score
      const responses = await TestResponse.find({ testId }).session(session);
      const correctAnswers = responses.filter((r) => r.isCorrect).length;
      const score = Math.round((correctAnswers / responses.length) * 100);

      // Determine level and progression
      const { levelAchieved, canProceedToNextStep, blocksRetake } =
        calculateProgression(test.step as TestStep, score);

      // Update test
      test.status = "completed";
      test.completedAt = new Date();
      test.score = score;
      test.correctAnswers = correctAnswers;
      test.timeSpent = totalTimeSpent;
      if (levelAchieved) {
        test.levelAchieved = levelAchieved;
      }
      test.canProceedToNextStep = canProceedToNextStep;
      test.blocksRetake = blocksRetake;
      await test.save({ session });

      // Update user
      const user = await User.findById(test.userId).session(session);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
      }

      if (blocksRetake) {
        user.assessmentStatus = "blocked_step1_failure";
      }

      if (
        levelAchieved &&
        shouldUpdateUserLevel(user.highestLevelAchieved, levelAchieved)
      ) {
        user.highestLevelAchieved = levelAchieved;
      }

      await user.save({ session });

      // Generate certificate if level achieved
      let certificate = null;
      if (levelAchieved) {
        console.log(
          `🎓 Level achieved: ${levelAchieved}, creating certificate...`
        );
        certificate = new Certificate({
          userId: test.userId,
          levelAchieved,
          testId: test._id,
          competenciesAchieved: [],
          issuedDate: new Date(),
        });
        await certificate.save({ session });
        console.log(`✅ Certificate created with ID: ${certificate._id}`);
      } else {
        console.log(
          `❌ No level achieved. Score: ${score}, Step: ${test.step}`
        );
      }

      await session.commitTransaction();

      // Send certificate email in the background (non-blocking)
      if (certificate) {
        console.log(
          `📧 Scheduling certificate email to ${user.email} in background...`
        );

        // Fire and forget - don't await this
        setImmediate(async () => {
          try {
            await sendCertificateEmail(
              user.email,
              user.fullName,
              certificate._id.toString(),
              levelAchieved!
            );
            console.log(
              `✅ Certificate email sent to ${user.email} for level ${levelAchieved}`
            );
          } catch (emailError) {
            console.error("❌ Failed to send certificate email:", emailError);
            console.error("❌ Email error details:", {
              message:
                emailError instanceof Error
                  ? emailError.message
                  : String(emailError),
              stack: emailError instanceof Error ? emailError.stack : undefined,
            });
          }
        });
      } else {
        console.log(`📧 No certificate created, skipping email send`);
      }

      return createSuccessResponse("Assessment completed successfully", {
        test: {
          id: test._id,
          step: test.step,
          score: test.score,
          levelAchieved: test.levelAchieved,
          canProceedToNextStep: test.canProceedToNextStep,
          blocksRetake: test.blocksRetake,
        },
        certificate: certificate
          ? {
              id: certificate._id,
              levelAchieved: certificate.levelAchieved,
              emailSent: true, // We've scheduled it, so we return true
            }
          : null,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }, "Failed to complete assessment");
};

/**
 * Get user's assessment history with step availability
 */
export const getUserAssessments = async (
  userId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const tests = await Test.find({ userId })
      .sort({ createdAt: -1 })
      .select(
        "step score levelAchieved status startedAt completedAt canProceedToNextStep blocksRetake"
      );

    // Calculate step availability
    const stepAvailability = calculateStepAvailability(user, tests);

    return createSuccessResponse("User assessments retrieved", {
      tests: tests.map((test) => ({
        id: test._id,
        step: test.step,
        score: test.score,
        levelAchieved: test.levelAchieved,
        status: test.status,
        startedAt: test.startedAt,
        completedAt: test.completedAt,
        canProceedToNextStep: test.canProceedToNextStep,
      })),
      stepAvailability,
      userStatus: {
        highestLevelAchieved: user.highestLevelAchieved,
        assessmentStatus: user.assessmentStatus,
      },
    });
  }, "Failed to retrieve user assessments");
};

/**
 * Get assessment results by testId (for results page)
 */
export const getAssessmentResults = async (
  testId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const test = await Test.findById(testId);
    if (!test) {
      throw new ApiError(httpStatus.NOT_FOUND, "Test not found");
    }

    if (test.status !== "completed") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Test is not completed yet");
    }

    // Find associated certificate if one exists
    const certificate = await Certificate.findOne({ testId: test._id });

    return createSuccessResponse("Assessment results retrieved successfully", {
      test: {
        id: test._id,
        step: test.step,
        score: test.score,
        levelAchieved: test.levelAchieved,
        canProceedToNextStep: test.canProceedToNextStep,
        blocksRetake: test.blocksRetake,
      },
      certificate: certificate
        ? {
            id: certificate._id,
            levelAchieved: certificate.levelAchieved,
            emailSent: true,
          }
        : null,
    });
  }, "Failed to retrieve assessment results");
};

/**
 * Get assessment info by testId (for loading assessment state)
 */
export const getAssessmentInfo = async (
  testId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const test = await Test.findById(testId);
    if (!test) {
      throw new ApiError(httpStatus.NOT_FOUND, "Test not found");
    }

    return createSuccessResponse("Assessment info retrieved successfully", {
      id: test._id,
      step: test.step,
      status: test.status,
      currentQuestionIndex: test.currentQuestionIndex,
      totalQuestions: test.totalQuestions,
      questionsAnswered: test.questionsAnswered,
      score: test.score,
      levelAchieved: test.levelAchieved,
      canProceedToNextStep: test.canProceedToNextStep,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
    });
  }, "Failed to retrieve assessment info");
};

// Helper functions
function calculateStepAvailability(user: any, tests: any[]) {
  // Simple implementation - can be enhanced later
  return {
    step1Available: true,
    step2Available: tests.some((t) => t.step === 1 && t.canProceedToNextStep),
    step3Available: tests.some((t) => t.step === 2 && t.canProceedToNextStep),
  };
}

function calculateProgression(
  step: TestStep,
  score: number
): {
  levelAchieved: CompetencyLevel | null;
  canProceedToNextStep: boolean;
  blocksRetake: boolean;
} {
  let levelAchieved: CompetencyLevel | null = null;
  let canProceedToNextStep = false;
  let blocksRetake = false;

  switch (step) {
    case 1:
      if (score < 25) {
        blocksRetake = true;
        // No level achieved for Step 1 failure
      } else if (score < 50) {
        levelAchieved = "A1";
      } else if (score < 75) {
        levelAchieved = "A2";
      } else {
        levelAchieved = "A2";
        canProceedToNextStep = true;
      }
      break;

    case 2:
      if (score < 25) {
        // Remain at previous level (A2)
        levelAchieved = "A2";
      } else if (score < 50) {
        levelAchieved = "B1";
      } else if (score < 75) {
        levelAchieved = "B2";
      } else {
        levelAchieved = "B2";
        canProceedToNextStep = true;
      }
      break;

    case 3:
      if (score < 25) {
        // Remain at previous level (B2)
        levelAchieved = "B2";
      } else if (score < 50) {
        levelAchieved = "C1";
      } else {
        levelAchieved = "C2";
      }
      break;
  }

  return { levelAchieved, canProceedToNextStep, blocksRetake };
}

function shouldUpdateUserLevel(
  currentLevel: CompetencyLevel | undefined,
  newLevel: CompetencyLevel
): boolean {
  const levelOrder: CompetencyLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

  if (!currentLevel) return true;

  const currentIndex = levelOrder.indexOf(currentLevel);
  const newIndex = levelOrder.indexOf(newLevel);

  return newIndex > currentIndex;
}
