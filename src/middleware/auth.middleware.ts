import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";
import { User } from "../models/User.model";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";
import { UserRole } from "../types";

/**
 * JWT Authentication Middleware
 * Extracts and verifies JWT tokens from Authorization header
 * Sets user information in request object for downstream use
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Access denied. No token provided."
      );
    }

    // Check for Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Access denied. Invalid token format. Use 'Bearer <token>'"
      );
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Access denied. No token provided."
      );
    }

    // Verify token
    const decoded: JwtPayload = verifyAccessToken(token);

    if (!decoded.sub) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Access denied. Invalid token payload."
      );
    }

    // Fetch user from database to ensure user still exists and get latest info
    const user = await User.findById(decoded.sub).select("-passwordHash");

    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Access denied. User not found."
      );
    }

    // Check if email is verified for certain operations
    if (
      !user.emailVerified &&
      !req.path.includes("/verify-otp") &&
      !req.path.includes("/resend-otp")
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Email verification required. Please verify your email before accessing this resource."
      );
    }

    // Set user information in request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role as UserRole,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error: any) {
    // Handle JWT specific errors
    if (error.name === "JsonWebTokenError") {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Access denied. Invalid token.")
      );
    }

    if (error.name === "TokenExpiredError") {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Access denied. Token expired.")
      );
    }

    // Pass through existing ApiError or create new one
    if (error instanceof ApiError) {
      return next(error);
    }

    next(
      new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Authentication failed. Please try again."
      )
    );
  }
};

/**
 * Verify Email Required Middleware
 * Ensures that the authenticated user has verified their email
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, "Authentication required.")
    );
  }

  if (!req.user.emailVerified) {
    return next(
      new ApiError(
        httpStatus.FORBIDDEN,
        "Email verification required. Please verify your email before accessing this resource."
      )
    );
  }

  next();
};
