import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  step: { type: Number, enum: [1, 2, 3], required: true },
  levelsTested: [{ type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }],
  score: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["in_progress", "passed", "failed", "failed_no_retake"], 
    required: true 
  },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
}, { timestamps: true });

export const Test = mongoose.model("Test", testSchema); 