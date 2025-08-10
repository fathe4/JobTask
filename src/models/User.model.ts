import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");

interface IUser extends mongoose.Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  emailVerified: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  // Assessment tracking
  assessmentStatus: "eligible" | "blocked_step1_failure";
  highestLevelAchieved?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  currentStep?: 1 | 2 | 3;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(password: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

interface IUserModel extends mongoose.Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student", "supervisor"],
      default: "student",
    },
    emailVerified: { type: Boolean, default: false },
    otpCode: String,
    otpExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    // Assessment tracking fields
    assessmentStatus: {
      type: String,
      enum: ["eligible", "blocked_step1_failure"],
      default: "eligible",
    },
    highestLevelAchieved: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
    },
    currentStep: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },
  },
  { timestamps: true }
);

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// Instance method to hash password
userSchema.methods.hashPassword = async function (
  password: string
): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Static method to hash password (for registration)
userSchema.statics.hashPassword = async function (
  password: string
): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
