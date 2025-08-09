import mongoose from "mongoose";

const testResponseSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  selectedOptionIndex: Number,
  isCorrect: Boolean,
});

export const TestResponse = mongoose.model("TestResponse", testResponseSchema); 