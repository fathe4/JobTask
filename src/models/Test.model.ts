import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    step: { type: Number, enum: [1, 2, 3], required: true },
    levelsTested: [
      { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    ],
    score: { type: Number, min: 0, max: 100 },
    totalQuestions: { type: Number, default: 44 },
    correctAnswers: { type: Number, min: 0 },
    status: {
      type: String,
      enum: [
        "in_progress",
        "completed",
        "failed",
        "failed_no_retake",
        "abandoned",
      ],
      required: true,
      default: "in_progress",
    },
    // ONE QUESTION AT A TIME - Sequential Question Management
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ], // Pre-shuffled question sequence for the test
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    }, // Index of current question in questionOrder array
    currentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    }, // Current active question for easy lookup
    questionsAnswered: {
      type: Number,
      default: 0,
      min: 0,
    }, // Count of answered questions

    // Assessment session tracking
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    timeLimit: { type: Number, default: 44 * 60 }, // 44 minutes (1 min per question)
    timeSpent: Number, // total seconds spent on test
    lastQuestionStartTime: Date, // when current question was presented

    // Results and progression
    levelAchieved: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    canProceedToNextStep: { type: Boolean, default: false },
    blocksRetake: { type: Boolean, default: false }, // true for Step 1 failures <25%
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },

    // Question responses reference (maintained for compatibility)
    responses: [{ type: mongoose.Schema.Types.ObjectId, ref: "TestResponse" }],
  },
  { timestamps: true }
);

// Index for efficient querying
testSchema.index({ userId: 1, step: 1 });
testSchema.index({ status: 1 });
testSchema.index({ currentQuestionId: 1 }); // For quick current question lookup

// Virtual for test progress percentage
testSchema.virtual("progressPercentage").get(function () {
  return Math.round((this.questionsAnswered / this.totalQuestions) * 100);
});

// Virtual to check if test is at the last question
testSchema.virtual("isLastQuestion").get(function () {
  return this.currentQuestionIndex >= this.totalQuestions - 1;
});

// Virtual to check if there are more questions
testSchema.virtual("hasNextQuestion").get(function () {
  return this.currentQuestionIndex < this.questionOrder.length - 1;
});

export const Test = mongoose.model("Test", testSchema);
