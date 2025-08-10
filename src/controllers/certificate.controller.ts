import { Request, Response } from "express";
import * as certificateService from "../services/certificate.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import { httpStatus } from "../utils/httpStatus";

/**
 * Download certificate as PDF
 * GET /api/v1/certificates/:certificateId/download
 */
export const downloadCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Certificate ID is required",
      });
      return;
    }

    // Generate PDF
    const pdfBuffer =
      await certificateService.generateCertificatePDF(certificateId);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${certificateId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Certificate download error:", error);
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Failed to generate certificate",
    });
  }
};

/**
 * Get certificate details
 * GET /api/v1/certificates/:certificateId
 */
export const getCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { certificateId } = req.params;

  if (!certificateId) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "Certificate ID is required",
    });
    return;
  }

  const result = await certificateService.getCertificate(certificateId);
  handleServiceResponse(res, result);
};

/**
 * Get user's certificates
 * GET /api/v1/certificates/user/me
 */
export const getUserCertificates = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id; // Use .id like in assessment controller

  const result = await certificateService.getUserCertificates(userId);
  handleServiceResponse(res, result);
};
