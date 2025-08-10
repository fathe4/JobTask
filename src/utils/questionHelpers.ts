/**
 * Question Management Helper Functions
 * Utility functions for question processing and assessment logic
 */

import { TestStep, CompetencyLevel } from "../types/system.types";

/**
 * Get the competency levels for a specific assessment step
 */
export function getStepLevels(step: TestStep): CompetencyLevel[] {
  const stepLevelMap: Record<TestStep, CompetencyLevel[]> = {
    1: ["A1", "A2"],
    2: ["B1", "B2"],
    3: ["C1", "C2"],
  };
  return stepLevelMap[step];
}

/**
 * Shuffle an array using Fisher-Yates algorithm for question randomization
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate question options array
 */
export function validateQuestionOptions(options: string[]): boolean {
  return (
    Array.isArray(options) &&
    options.length === 4 &&
    options.every(
      (option) => typeof option === "string" && option.trim().length > 0
    )
  );
}

/**
 * Validate correct answer index
 */
export function validateCorrectAnswerIndex(
  index: number,
  optionsLength: number
): boolean {
  return Number.isInteger(index) && index >= 0 && index < optionsLength;
}

/**
 * Calculate assessment step readiness based on question availability
 */
export function calculateStepReadiness(
  availableQuestions: number,
  requiredQuestions: number
): {
  isReady: boolean;
  completion: number;
} {
  const completion = Math.round((availableQuestions / requiredQuestions) * 100);
  return {
    isReady: availableQuestions >= requiredQuestions,
    completion: Math.min(completion, 100), // Cap at 100%
  };
}
