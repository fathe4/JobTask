import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    competencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competency",
      required: true,
    },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      required: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: [
      {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function (v: string): boolean {
            return v.length >= 1 && v.length <= 200;
          },
          message: "Option must be between 1 and 200 characters",
        },
      },
    ],
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: function (this: any, v: number): boolean {
          return this.options && v < this.options.length;
        },
        message: "Correct option index must be valid for the given options",
      },
    },
    isActive: { type: Boolean, default: true },
    difficulty: { type: Number, min: 1, max: 5, default: 3 }, // Optional difficulty rating
  },
  { timestamps: true }
);

// Compound index to ensure one question per competency-level combination
questionSchema.index({ competencyId: 1, level: 1 }, { unique: true });

// Indexes for efficient querying
questionSchema.index({ level: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ competencyId: 1 });

// Validation to ensure exactly 4 options
questionSchema.pre("save", function () {
  if (this.options.length !== 4) {
    throw new Error("Each question must have exactly 4 options");
  }
});

export const Question = mongoose.model("Question", questionSchema);
