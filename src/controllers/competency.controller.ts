import { Request, Response } from "express";
import * as competencyService from "../services/competency.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import {
  CreateCompetencyData,
  UpdateCompetencyData,
} from "../services/competency.service";

/**
 * Create a new competency (Admin only)
 * POST /api/v1/competencies
 */
export const createCompetency = async (
  req: Request,
  res: Response
): Promise<void> => {
  const competencyData: CreateCompetencyData = {
    name: req.body.name,
    description: req.body.description,
  };

  const result = await competencyService.createCompetency(competencyData);
  handleServiceResponse(res, result);
};

/**
 * Get competencies with filtering and pagination
 * GET /api/v1/competencies
 */
export const getCompetencies = async (
  req: Request,
  res: Response
): Promise<void> => {
  const filters: any = {
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
  };

  const result = await competencyService.getCompetencies(filters);
  handleServiceResponse(res, result);
};

/**
 * Get a single competency by ID
 * GET /api/v1/competencies/:id
 */
export const getCompetencyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const competencyId = req.params.id;

  const result = await competencyService.getCompetencyById(competencyId);
  handleServiceResponse(res, result);
};

/**
 * Update a competency (Admin only)
 * PUT /api/v1/competencies/:id
 */
export const updateCompetency = async (
  req: Request,
  res: Response
): Promise<void> => {
  const competencyId = req.params.id;
  const updateData: UpdateCompetencyData = {
    name: req.body.name,
    description: req.body.description,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof UpdateCompetencyData] === undefined) {
      delete updateData[key as keyof UpdateCompetencyData];
    }
  });

  const result = await competencyService.updateCompetency(
    competencyId,
    updateData
  );
  handleServiceResponse(res, result);
};

/**
 * Delete a competency (Admin only)
 * DELETE /api/v1/competencies/:id
 */
export const deleteCompetency = async (
  req: Request,
  res: Response
): Promise<void> => {
  const competencyId = req.params.id;

  const result = await competencyService.deleteCompetency(competencyId);
  handleServiceResponse(res, result);
};

/**
 * Get competency usage information
 * GET /api/v1/competencies/:id/usage
 */
export const getCompetencyUsage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const competencyId = req.params.id;

  const result = await competencyService.getCompetencyUsage(competencyId);
  handleServiceResponse(res, result);
};

/**
 * Get all competencies with usage statistics
 * GET /api/v1/competencies/with-usage
 */
export const getCompetenciesWithUsage = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await competencyService.getCompetenciesWithUsage();
  handleServiceResponse(res, result);
};
