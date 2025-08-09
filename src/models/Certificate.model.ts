import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  levelAchieved: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
  competenciesAchieved: [{ 
    competencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Competency", required: true },
    level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
    score: Number
  }],
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  issuedDate: { type: Date, default: Date.now },
  certificateUrl: String,
});

export const Certificate = mongoose.model("Certificate", certificateSchema); 