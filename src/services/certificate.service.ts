import puppeteer from "puppeteer";
import { Certificate } from "../models/Certificate.model";
import { User } from "../models/User.model";
import { Test } from "../models/Test.model";
import { ApiResponse } from "../types";
import { serviceWrapper, createSuccessResponse } from "../utils/serviceWrapper";
import ApiError from "../utils/ApiError";
import { httpStatus } from "../utils/httpStatus";

/**
 * Generate certificate HTML template
 */
const generateCertificateHTML = (certificateData: {
  userName: string;
  level: string;
  completionDate: string;
  certificateId: string;
  score: number;
  stepCompleted: number;
}): string => {
  const {
    userName,
    level,
    completionDate,
    certificateId,
    score,
    stepCompleted,
  } = certificateData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificate of Achievement</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        
        body {
          font-family: 'Georgia', serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          padding: 20px;
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate {
          background: white;
          border: 8px solid #2c5282;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 800px;
          position: relative;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 2px solid #4299e1;
          border-radius: 12px;
        }
        
        .title {
          font-size: 36px;
          font-weight: bold;
          color: #2c5282;
          margin-bottom: 20px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .subtitle {
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 30px;
        }
        
        .recipient {
          font-size: 16px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .name {
          font-size: 32px;
          font-weight: bold;
          color: #2c5282;
          margin: 15px 0;
          text-decoration: underline;
          text-decoration-color: #4299e1;
        }
        
        .achievement {
          font-size: 16px;
          color: #333;
          margin: 20px 0;
          line-height: 1.5;
        }
        
        .level-badge {
          display: inline-block;
          background: linear-gradient(135deg, #4299e1, #2c5282);
          color: white;
          padding: 10px 20px;
          border-radius: 15px;
          font-size: 24px;
          font-weight: bold;
          margin: 15px 0;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .score-info {
          font-size: 16px;
          color: #4a5568;
          margin: 15px 0;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          font-size: 14px;
        }
        
        .date {
          color: #666;
        }
        
        .certificate-id {
          color: #999;
          font-family: 'Courier New', monospace;
        }
        
        .seal {
          width: 60px;
          height: 60px;
          border: 3px solid #2c5282;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #4299e1;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="title">CERTIFICATE OF ACHIEVEMENT</div>
        <div class="subtitle">Digital Competency Assessment</div>
        
        <div class="recipient">This is to certify that</div>
        <div class="name">${userName}</div>
        
        <div class="achievement">
          has successfully completed <strong>Step ${stepCompleted}</strong> of the Digital Competency Assessment
          and has demonstrated proficiency at the
        </div>
        
        <div class="level-badge">${level} Level</div>
        
        <div class="score-info">
          Final Score: <strong>${score}%</strong>
        </div>
        
        <div class="footer">
          <div class="date">
            <strong>Date:</strong><br>
            ${completionDate}
          </div>
          
          <div class="seal">
            VERIFIED
          </div>
          
          <div class="certificate-id">
            ID: ${certificateId.substring(0, 8)}...
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate PDF certificate
 */
export const generateCertificatePDF = async (
  certificateId: string
): Promise<Buffer> => {
  console.log("🏆 Starting certificate PDF generation for ID:", certificateId);

  // Find certificate with related data
  const certificate = await Certificate.findById(certificateId)
    .populate("userId", "fullName email")
    .populate("testId");

  if (!certificate) {
    console.error("❌ Certificate not found for ID:", certificateId);
    throw new ApiError(httpStatus.NOT_FOUND, "Certificate not found");
  }

  console.log("✅ Certificate found:", {
    id: certificate._id,
    levelAchieved: certificate.levelAchieved,
    userId: certificate.userId,
    testId: certificate.testId,
  });

  const user = certificate.userId as any;
  const test = certificate.testId as any;

  if (!user || !test) {
    console.error("❌ Missing related data:", { user: !!user, test: !!test });
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid certificate data");
  }

  // Prepare certificate data
  const certificateData = {
    userName: user.fullName,
    level: certificate.levelAchieved,
    completionDate: certificate.issuedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    certificateId: certificate._id.toString(),
    score: test.score || 0,
    stepCompleted: test.step || 1,
  };

  console.log("📋 Certificate data prepared:", certificateData);

  // Generate HTML
  const html = generateCertificateHTML(certificateData);
  console.log("📄 HTML generated, length:", html.length);

  // Launch puppeteer with better configuration
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--no-first-run",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });

    console.log("🌐 Setting page content...");
    // Set content and wait for load
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    console.log("📸 Generating PDF...");
    // Generate PDF with explicit settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    console.log(
      "✅ PDF generated successfully, size:",
      pdfBuffer.length,
      "bytes"
    );
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ Error during PDF generation:", error);
    throw error;
  } finally {
    await browser.close();
    console.log("🔒 Browser closed");
  }
};

/**
 * Get certificate data for display
 */
export const getCertificate = async (
  certificateId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const certificate = await Certificate.findById(certificateId)
      .populate("userId", "fullName email")
      .populate("testId", "step score completedAt");

    if (!certificate) {
      throw new ApiError(httpStatus.NOT_FOUND, "Certificate not found");
    }

    return createSuccessResponse("Certificate retrieved successfully", {
      id: certificate._id,
      levelAchieved: certificate.levelAchieved,
      issuedDate: certificate.issuedDate,
      user: certificate.userId,
      test: certificate.testId,
    });
  }, "Failed to retrieve certificate");
};

/**
 * Get user's certificates
 */
export const getUserCertificates = async (
  userId: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const certificates = await Certificate.find({ userId })
      .populate("testId", "step score completedAt")
      .sort({ issuedDate: -1 });

    return createSuccessResponse("User certificates retrieved successfully", {
      certificates: certificates.map((cert) => ({
        id: cert._id,
        levelAchieved: cert.levelAchieved,
        issuedDate: cert.issuedDate,
        test: cert.testId,
      })),
    });
  }, "Failed to retrieve user certificates");
};
