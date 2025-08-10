import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import questionRoutes from "./routes/question.routes";
import assessmentRoutes from "./routes/assessment.routes";
import competencyRoutes from "./routes/competency.routes";
import certificateRoutes from "./routes/certificate.routes";

// Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
console.log(process.env.CORS_ORIGINS);

// CORS configuration
app.use(
  cors({
    origin: "https://competency-assessment-client.vercel.app",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TestSchool Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/v1/competencies", competencyRoutes);
app.use("/api/v1/certificates", certificateRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// Bootstrap - Start server after successful DB connection
(async () => {
  try {
    await connectDatabase(); // Connect to MongoDB
    app.listen(PORT, () => {
      console.log(`🚀 TestSchool Backend running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth/*`);
      console.log(`👤 User endpoints: http://localhost:${PORT}/api/v1/users/*`);
      console.log(
        `❓ Question endpoints: http://localhost:${PORT}/api/v1/questions/*`
      );
      console.log(
        `📝 Assessment endpoints: http://localhost:${PORT}/api/v1/assessments/*`
      );
      console.log(
        `🎯 Competency endpoints: http://localhost:${PORT}/api/v1/competencies/*`
      );
      console.log(
        `📜 Certificate endpoints: http://localhost:${PORT}/api/v1/certificates/*`
      );
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error.");
    process.exit(1);
  }
})();

export default app;
