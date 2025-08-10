import mongoose from "mongoose";

const testResponseSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    // ONE QUESTION AT A TIME - Enhanced Response Tracking
    questionOrder: {
      type: Number,
      required: true,
      min: 0,
    }, // Position of this question in the test sequence (0-based)

    selectedOptionIndex: { type: Number, min: 0, max: 3 }, // null if not answered yet
    isCorrect: Boolean,

    // Timing tracking for one-question-at-a-time
    timeSpent: Number, // seconds spent on this specific question
    questionStartTime: Date, // when this question was first presented
    answeredAt: Date, // when this question was answered

    // Navigation tracking
    isSkipped: { type: Boolean, default: false }, // if user skipped this question
  },
  { timestamps: true }
);

// Index for efficient querying
testResponseSchema.index({ testId: 1 });
testResponseSchema.index({ questionId: 1 });
testResponseSchema.index({ testId: 1, questionOrder: 1 }); // For sequential access
testResponseSchema.index({ testId: 1, isSkipped: 1 }); // For finding skipped questions

// Compound unique index to ensure one response per question per test
testResponseSchema.index({ testId: 1, questionId: 1 }, { unique: true });

export const TestResponse = mongoose.model("TestResponse", testResponseSchema);
