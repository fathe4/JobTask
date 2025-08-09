import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  competencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Competency", required: true },
  level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema); 