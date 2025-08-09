import mongoose from "mongoose";

const competencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
}, { timestamps: true });

export const Competency = mongoose.model("Competency", competencySchema); 