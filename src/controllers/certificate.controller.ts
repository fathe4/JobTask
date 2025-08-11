import { Request, Response } from "express";
import * as certificateService from "../services/certificate.service";
import * as emailService from "../services/email.service";
import { handleServiceResponse } from "../utils/serviceWrapper";
import { httpStatus } from "../utils/httpStatus";

/**
 * Test email configuration
 * GET /api/v1/certificates/test-email
 */
export const testEmailConfig = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("🧪 Testing email configuration...");
    console.log("📧 Email config:", {
      EMAIL_HOST: process.env.EMAIL_HOST || "not set",
      EMAIL_PORT: process.env.EMAIL_PORT || "not set",
      EMAIL_USER: process.env.EMAIL_USER || "not set",
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? "***SET***" : "not set",
      EMAIL_FROM: process.env.EMAIL_FROM || "not set",
      EMAIL_SECURE: process.env.EMAIL_SECURE || "not set",
    });

    // Test connection
    await emailService.testEmailConnection();

    res.status(httpStatus.OK).json({
      success: true,
      message: "Email configuration is working",
    });
  } catch (error: any) {
    console.error("❌ Email configuration test failed:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Email configuration test failed",
    });
  }
};

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
