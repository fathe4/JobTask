import { Response } from "express";
import { ApiResponse } from "../types";
import ApiError from "./ApiError";
import { httpStatus } from "./httpStatus";

/**
 * Wraps a service function with try/catch and consistent error handling
 * @param serviceFunction - The async function to wrap
 * @param errorMessage - Default error message if none provided
 */
export const serviceWrapper = async <T>(
  serviceFunction: () => Promise<ApiResponse<T>>,
  errorMessage: string = "Operation failed"
): Promise<ApiResponse<T>> => {
  try {
    return await serviceFunction();
  } catch (error: any) {
    // Handle ApiError instances
    if (error instanceof ApiError) {
      return {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errors: { general: error.message },
      };
    }

    // Handle generic errors
    return {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: errorMessage,
      errors: { general: error.message || "Unknown error occurred" },
    };
  }
};

/**
 * Creates success response
 */
export const createSuccessResponse = <T>(
  message: string,
  data?: T,
  statusCode: number = httpStatus.OK
): ApiResponse<T> => ({
  success: true,
  statusCode,
  message,
  ...(data && { data }),
});

/**
 * Creates error response
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = httpStatus.BAD_REQUEST,
  errors?: Record<string, string>
): ApiResponse => ({
  success: false,
  statusCode,
  message,
  ...(errors && { errors }),
});

/**
 * Async wrapper for cleaner service functions
 */
export const asyncServiceHandler = <T>(
  handler: () => Promise<ApiResponse<T>>,
  defaultErrorMessage?: string
) => {
  return serviceWrapper(handler, defaultErrorMessage);
};

/**
 * Controller wrapper to handle service responses consistently
 * @param res - Express Response object
 * @param serviceResult - Result from service function
 */
export const handleServiceResponse = (
  res: Response,
  serviceResult: ApiResponse
): void => {
  const statusCode = serviceResult.statusCode || httpStatus.OK;
  res.status(statusCode).json(serviceResult);
};
