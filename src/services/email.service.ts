import nodemailer from "nodemailer";
import {
  serviceWrapper,
  createSuccessResponse,
  createErrorResponse,
} from "../utils/serviceWrapper";
import { ApiResponse } from "../types";
import { generateCertificatePDF } from "./certificate.service";

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
  },
};

// Create transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransport(emailConfig);
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw error;
  }
};

/**
 * Send OTP verification email
 */
export const sendOTPEmail = async (
  email: string,
  otpCode: string,
  fullName: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"TestSchool Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - TestSchool",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">TestSchool Platform</h1>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #333;">Hello ${fullName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Welcome to TestSchool! Please verify your email address to complete your registration.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 4px; margin: 10px 0;">${otpCode}</h1>
              <p style="margin: 0; font-size: 12px; color: #999;">This code will expire in 5 minutes</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If you didn't create an account with TestSchool, please ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            <p>© 2024 TestSchool Platform. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Hello ${fullName}!
        
        Welcome to TestSchool! Your email verification code is: ${otpCode}
        
        This code will expire in 5 minutes.
        
        If you didn't create an account with TestSchool, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return createSuccessResponse("OTP email sent successfully", {
      messageId: info.messageId,
      accepted: info.accepted,
    });
  }, "Failed to send OTP email");
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  fullName: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"TestSchool Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - TestSchool",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">TestSchool Platform</h1>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #333;">Hello ${fullName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              We received a request to reset your password for your TestSchool account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            <p>© 2024 TestSchool Platform. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Hello ${fullName}!
        
        We received a request to reset your password for your TestSchool account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return createSuccessResponse("Password reset email sent successfully", {
      messageId: info.messageId,
      accepted: info.accepted,
    });
  }, "Failed to send password reset email");
};

/**
 * Test email configuration
 */
export const testEmailConnection = async (): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const transporter = createTransporter();

    // Verify connection
    await transporter.verify();

    return createSuccessResponse("Email service is configured correctly");
  }, "Email service configuration test failed");
};

/**
 * Send certificate via email with PDF attachment
 */
export const sendCertificateEmail = async (
  email: string,
  fullName: string,
  certificateId: string,
  levelAchieved: string
): Promise<ApiResponse> => {
  return serviceWrapper(async () => {
    const transporter = createTransporter();

    // Generate PDF in memory
    const pdfBuffer = await generateCertificatePDF(certificateId);

    const mailOptions = {
      from: `"TestSchool Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Your TestSchool Certificate - ${levelAchieved} Level Achieved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2c5282; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎓 TestSchool Platform</h1>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #2c5282;">Congratulations ${fullName}! 🎉</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              We're thrilled to inform you that you have successfully completed the 
              <strong>${levelAchieved}</strong> level assessment on TestSchool!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299e1;">
              <h3 style="color: #2c5282; margin-top: 0;">📜 Your Certificate is Ready</h3>
              <p style="margin: 0; color: #666;">
                Your official certificate of achievement is attached to this email as a PDF. 
                You can download, print, and share it to showcase your digital competency skills.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Thank you for choosing TestSchool to advance your digital skills. 
              We're proud to be part of your learning journey!
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            <p>© 2024 TestSchool Platform. All rights reserved.</p>
            <p>Certificate ID: ${certificateId}</p>
          </div>
        </div>
      `,
      text: `
        Congratulations ${fullName}!
        
        You have successfully completed the ${levelAchieved} level assessment on TestSchool.
        
        Your certificate is attached to this email as a PDF file.
        
        You can also download it anytime from: ${process.env.FRONTEND_URL || "http://localhost:4173"}/certificates
        
        Certificate ID: ${certificateId}
        
        Thank you for using TestSchool!
      `,
      attachments: [
        {
          filename: `TestSchool-Certificate-${levelAchieved}-${certificateId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return createSuccessResponse(
      `Certificate email sent successfully to ${email}`,
      {
        certificateId,
        emailSent: true,
      }
    );
  });
};
