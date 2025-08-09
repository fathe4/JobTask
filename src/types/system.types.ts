/**
 * Test_School Assessment Platform - System Types
 * Application-specific interfaces and type definitions
 */

export type UserRole = "admin" | "student" | "supervisor";
export type CompetencyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type TestStep = 1 | 2 | 3;
export type TestStatus =
  | "in_progress"
  | "passed"
  | "failed"
  | "failed_no_retake";

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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITest {
  _id?: string;
  userId: string;
  step: TestStep;
  levelsTested: CompetencyLevel[];
  score: number;
  status: TestStatus;
  certificateId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITestResponse {
  _id?: string;
  testId: string;
  questionId: string;
  selectedOptionIndex?: number;
  isCorrect?: boolean;
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

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
