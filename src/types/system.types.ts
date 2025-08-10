/**
 * Test_School Assessment Platform - System Types
 * Application-specific interfaces and type definitions
 */

export type UserRole = "admin" | "student" | "supervisor";
export type CompetencyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type TestStep = 1 | 2 | 3;
export type TestStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "failed_no_retake"
  | "abandoned";

export type AssessmentStatus = "eligible" | "blocked_step1_failure";

export interface IUser {
  _id?: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  // Assessment tracking
  assessmentStatus: AssessmentStatus;
  highestLevelAchieved?: CompetencyLevel;
  currentStep?: TestStep;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICompetency {
  _id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IQuestion {
  _id?: string;
  competencyId: string;
  level: CompetencyLevel;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  isActive?: boolean;
  difficulty?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITest {
  _id?: string;
  userId: string;
  step: TestStep;
  levelsTested: CompetencyLevel[];
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  status: TestStatus;

  // ONE QUESTION AT A TIME - Sequential Question Management
  questionOrder?: string[]; // Array of question IDs in test sequence
  currentQuestionIndex?: number; // Current position in questionOrder (0-based)
  currentQuestionId?: string; // Current active question ID
  questionsAnswered?: number; // Count of answered questions

  // Assessment session tracking
  startedAt?: Date;
  completedAt?: Date;
  timeLimit?: number;
  timeSpent?: number; // total seconds spent on test
  lastQuestionStartTime?: Date; // when current question was presented

  // Results and progression
  levelAchieved?: CompetencyLevel;
  canProceedToNextStep?: boolean;
  blocksRetake?: boolean;
  certificateId?: string;
  responses?: string[];
  createdAt?: Date;
  updatedAt?: Date;

  // Virtual properties (computed)
  progressPercentage?: number;
  isLastQuestion?: boolean;
  hasNextQuestion?: boolean;
}

export interface ITestResponse {
  _id?: string;
  testId: string;
  questionId: string;

  questionOrder: number; // Position of this question in test sequence (0-based)

  selectedOptionIndex?: number;
  isCorrect?: boolean;

  // Timing tracking for one-question-at-a-time
  timeSpent?: number; // seconds spent on this specific question
  questionStartTime?: Date; // when this question was first presented
  answeredAt?: Date; // when this question was answered

  // Navigation tracking
  isSkipped?: boolean; // if user skipped this question

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICompetencyAchieved {
  competencyId: string;
  level: CompetencyLevel;
  score?: number;
}

export interface ICertificate {
  _id?: string;
  userId: string;
  levelAchieved: CompetencyLevel;
  competenciesAchieved: ICompetencyAchieved[];
  testId: string;
  issuedDate: Date;
  certificateUrl?: string;
}

// Question Service Types
export interface CreateQuestionData {
  competencyId: string;
  level: CompetencyLevel;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  difficulty?: number;
}

export interface UpdateQuestionData {
  questionText?: string;
  options?: string[];
  correctOptionIndex?: number;
  difficulty?: number;
  isActive?: boolean;
}

export interface QuestionFilters {
  competencyId?: string;
  level?: string | string[];
  step?: TestStep;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface StepStatus {
  step: TestStep;
  levels: CompetencyLevel[];
  questionsRequired: number;
  questionsAvailable: number;
  isReady: boolean;
  completion: number;
}

export interface AssessmentCompletionStatus {
  totalCompetencies: number;
  requiredQuestionsTotal: number;
  totalQuestionsAvailable: number;
  overallCompletion: number;
  stepStatus: StepStatus[];
  questionsByLevel: Record<string, number>;
}

// Assessment Service Types - ONE QUESTION AT A TIME
export interface StartAssessmentData {
  userId: string;
  step: TestStep;
}

export interface SubmitAnswerData {
  testId: string;
  questionId: string;
  selectedOptionIndex: number;
  timeSpent: number;
}

export interface CompleteAssessmentData {
  testId: string;
  totalTimeSpent: number;
}

// One Question at a Time Navigation
export interface GetCurrentQuestionData {
  testId: string;
}

export interface NavigateQuestionData {
  testId: string;
  direction: "next" | "previous";
}

export interface SkipQuestionData {
  testId: string;
  questionId: string;
}

export interface CurrentQuestionResponse {
  question: {
    id: string;
    competency: string;
    level: CompetencyLevel;
    questionText: string;
    options: string[];
  };
  testProgress: {
    currentIndex: number;
    totalQuestions: number;
    questionsAnswered: number;
    progressPercentage: number;
    timeRemaining: number;
    isLastQuestion: boolean;
    hasNextQuestion: boolean;
  };
  navigation: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    canSkip: boolean;
    canSubmitTest: boolean;
  };
}

export interface ActiveAssessmentInfo {
  hasActiveTest: boolean;
  test: {
    id: string;
    step: TestStep;
    totalQuestions: number;
    questionsAnswered: number;
    currentQuestionIndex: number;
    timeLimit: number;
    timeElapsed: number;
    timeRemaining: number;
    progressPercentage: number;
    startedAt: Date;
  } | null;
  autoCompleted?: boolean;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
