import express from "express";
import * as certificateController from "../controllers/certificate.controller";
import { authenticateToken } from "../middleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/certificates/user/me
 * @desc    Get current user's certificates
 * @access  Private
 */
router.get("/user/me", certificateController.getUserCertificates);

/**
 * @route   GET /api/certificates/:certificateId/test
 * @desc    Test certificate PDF generation in browser (for debugging)
 * @access  Private
 */
router.get("/:certificateId/test", async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificateService = require("../services/certificate.service");

    const pdfBuffer =
      await certificateService.generateCertificatePDF(certificateId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="certificate-test.pdf"'
    ); // inline instead of attachment
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/certificates/:certificateId/download
 * @desc    Download certificate as PDF
 * @access  Private
 */
router.get(
  "/:certificateId/download",
  certificateController.downloadCertificate
);

/**
 * @route   GET /api/certificates/:certificateId
 * @desc    Get certificate details
 * @access  Private
 */
router.get("/:certificateId", certificateController.getCertificate);

export default router;
