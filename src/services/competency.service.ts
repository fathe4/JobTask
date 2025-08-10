/**
 * Competency Service - Simple CRUD operations for competency management
 * Following established project patterns for clean, maintainable code
 */

import { Competency } from "../models/Competency.model";
import { Question } from "../models/Question.model";
import { ApiResponse } from "../types/system.types";
import { serviceWrapper, createSuccessResponse } from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";

export interface CreateCompetencyData {
  name: string;
  description?: string;
}

export interface UpdateCompetencyData {
  name?: string;
  description?: string;
}

export interface CompetencyFilters {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Create a new competency
 */
export const createCompetency = async (
  data: CreateCompetencyData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if competency name already exists
    const existingCompetency = await Competency.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    });

    if (existingCompetency) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Competency with this name already exists"
      );
    }

    const competency = new Competency({
      name: data.name.trim(),
      description: data.description?.trim() || "",
    });

    const savedCompetency = await competency.save();

    return createSuccessResponse("Competency created successfully", {
      competency: {
        id: savedCompetency._id,
        name: savedCompetency.name,
        description: savedCompetency.description,
        createdAt: savedCompetency.createdAt,
        updatedAt: savedCompetency.updatedAt,
      },
    });
  }, "Failed to create competency");
};

/**
 * Get all competencies with optional filtering and pagination
 */
export const getCompetencies = async (
  filters: CompetencyFilters = {}
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const { page = 1, limit = 50, search } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get competencies with pagination
    const [competencies, total] = await Promise.all([
      Competency.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Competency.countDocuments(query),
    ]);

    // Format competencies
    const formattedCompetencies = competencies.map((comp) => ({
      id: comp._id,
      name: comp.name,
      description: comp.description,
      createdAt: comp.createdAt,
      updatedAt: comp.updatedAt,
    }));

    return createSuccessResponse("Competencies retrieved successfully", {
      competencies: formattedCompetencies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  }, "Failed to retrieve competencies");
};

/**
 * Get a single competency by ID
 */
export const getCompetencyById = async (
  competencyId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const competency = await Competency.findById(competencyId).lean();

    if (!competency) {
      throw new ApiError(httpStatus.NOT_FOUND, "Competency not found");
    }

    return createSuccessResponse("Competency retrieved successfully", {
      competency: {
        id: competency._id,
        name: competency.name,
        description: competency.description,
        createdAt: competency.createdAt,
        updatedAt: competency.updatedAt,
      },
    });
  }, "Failed to retrieve competency");
};

/**
 * Update an existing competency
 */
export const updateCompetency = async (
  competencyId: string,
  data: UpdateCompetencyData
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if competency exists
    const existingCompetency = await Competency.findById(competencyId);
    if (!existingCompetency) {
      throw new ApiError(httpStatus.NOT_FOUND, "Competency not found");
    }

    // Check for name conflicts if name is being updated
    if (data.name && data.name !== existingCompetency.name) {
      const nameConflict = await Competency.findOne({
        _id: { $ne: competencyId },
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
      });

      if (nameConflict) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Competency with this name already exists"
        );
      }
    }

    // Update competency
    const updatedCompetency = await Competency.findByIdAndUpdate(
      competencyId,
      {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && {
          description: data.description.trim(),
        }),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCompetency) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update competency"
      );
    }

    return createSuccessResponse("Competency updated successfully", {
      competency: {
        id: updatedCompetency._id,
        name: updatedCompetency.name,
        description: updatedCompetency.description,
        createdAt: updatedCompetency.createdAt,
        updatedAt: updatedCompetency.updatedAt,
      },
    });
  }, "Failed to update competency");
};

/**
 * Delete a competency (only if no questions are associated)
 */
export const deleteCompetency = async (
  competencyId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if competency exists
    const competency = await Competency.findById(competencyId);
    if (!competency) {
      throw new ApiError(httpStatus.NOT_FOUND, "Competency not found");
    }

    // Check if any questions are using this competency
    const questionCount = await Question.countDocuments({
      competencyId: competencyId,
      isActive: true,
    });

    if (questionCount > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot delete competency. ${questionCount} active questions are still using this competency.`
      );
    }

    // Delete the competency
    await Competency.findByIdAndDelete(competencyId);

    return createSuccessResponse("Competency deleted successfully", {
      deletedId: competencyId,
    });
  }, "Failed to delete competency");
};

/**
 * Get competency usage information (questions count by level)
 */
export const getCompetencyUsage = async (
  competencyId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Check if competency exists
    const competency = await Competency.findById(competencyId);
    if (!competency) {
      throw new ApiError(httpStatus.NOT_FOUND, "Competency not found");
    }

    // Get question distribution by level
    const questionStats = await Question.aggregate([
      {
        $match: {
          competencyId: competencyId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform to object format
    const questionsByLevel: Record<string, number> = {};
    let totalQuestions = 0;

    questionStats.forEach((stat) => {
      questionsByLevel[stat._id] = stat.count;
      totalQuestions += stat.count;
    });

    return createSuccessResponse("Competency usage retrieved successfully", {
      usage: {
        competencyId,
        competencyName: competency.name,
        totalQuestions,
        questionsByLevel,
        canDelete: totalQuestions === 0,
      },
    });
  }, "Failed to retrieve competency usage");
};

/**
 * Get all competencies with their usage statistics
 */
export const getCompetenciesWithUsage = async (): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    // Get all competencies
    const competencies = await Competency.find({}).sort({ name: 1 }).lean();

    // Get question counts for all competencies
    const usageStats = await Question.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$competencyId",
          totalQuestions: { $sum: 1 },
          levelDistribution: {
            $push: "$level",
          },
        },
      },
    ]);

    // Create usage map
    const usageMap = new Map();
    usageStats.forEach((stat) => {
      const levelCounts: Record<string, number> = {};
      stat.levelDistribution.forEach((level: string) => {
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      usageMap.set(stat._id, {
        totalQuestions: stat.totalQuestions,
        questionsByLevel: levelCounts,
      });
    });

    // Combine competencies with usage data
    const competenciesWithUsage = competencies.map((competency) => {
      const usage = usageMap.get(competency._id?.toString()) || {
        totalQuestions: 0,
        questionsByLevel: {},
      };

      return {
        id: competency._id,
        name: competency.name,
        description: competency.description,
        createdAt: competency.createdAt,
        updatedAt: competency.updatedAt,
        usage: {
          ...usage,
          canDelete: usage.totalQuestions === 0,
        },
      };
    });

    return createSuccessResponse(
      "Competencies with usage retrieved successfully",
      {
        competencies: competenciesWithUsage,
        summary: {
          totalCompetencies: competencies.length,
          totalQuestions: Array.from(usageMap.values()).reduce(
            (sum: number, usage: any) => sum + usage.totalQuestions,
            0
          ),
        },
      }
    );
  }, "Failed to retrieve competencies with usage");
};
