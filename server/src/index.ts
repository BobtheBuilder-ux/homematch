import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authMiddleware } from "./middleware/authMiddleware";
import { databaseService } from "./utils/database";
import { socketService } from "./services/socketService";
/* ROUTE IMPORT */
import tenantRoutes from "./routes/tenantRoutes";
import landlordRoutes from "./routes/landlordRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import leaseRoutes from "./routes/leaseRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import adminRoutes from "./routes/adminRoutes";
import publicAdminRoutes from "./routes/publicAdminRoutes";
import publicAgentRoutes from "./routes/publicAgentRoutes";
import agentRoutes from "./routes/agentRoutes";
import surveyRoutes from "./routes/surveyRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import inspectionRoutes from "./routes/inspectionRoutes";
import emailRoutes from "./routes/emailRoutes";
import earningsRoutes from "./routes/earningsRoutes";
import jobRoutes from "./routes/jobRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import cloudinaryUploadRoutes from "./routes/cloudinaryUploadRoutes";
import agentPropertyRoutes from "./routes/agentPropertyRoutes";
import notificationRoutes from "./routes/notifications";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
const server = createServer(app);

// Initialize database connection
databaseService.connect().catch(console.error);

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Update CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL || "https://homematch.ng",
            "https://www.homematch.ng",
            "https://homematch.ng",
            /https:\/\/.*\.vercel\.app$/,
            /https:\/\/.*\.netlify\.app$/
          ]
        : true,
    credentials: true,
  })
);

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/applications", applicationRoutes);
app.use("/properties", propertyRoutes);
app.use("/leases", leaseRoutes);
app.use("/payments", paymentRoutes);
app.use(
  "/inspections",
  authMiddleware(["tenant", "landlord", "agent", "admin"]),
  inspectionRoutes
);
app.use(
  "/tenants",
  authMiddleware(["tenant", "landlord", "agent", "admin"]),
  tenantRoutes
);
app.use("/landlords", authMiddleware(["landlord", "admin"]), landlordRoutes);
// Admin routes with exception for admin creation
// Public admin routes (no authentication required)
app.use("/admin", publicAdminRoutes);
app.use("/agent", publicAgentRoutes);
app.use("/surveys", surveyRoutes);
// Protected admin routes (authentication required)
app.use("/admin", authMiddleware(["admin"]), adminRoutes);
app.use("/agent", authMiddleware(["agent"]), agentRoutes);
app.use("/emails", emailRoutes);
app.use("/earnings", authMiddleware(["landlord", "admin"]), earningsRoutes);
app.use("/jobs", jobRoutes);
app.use("/uploads", uploadRoutes);
app.use("/cloudinary", cloudinaryUploadRoutes);
app.use("/agent-properties", authMiddleware(["admin", "agent"]), agentPropertyRoutes);
app.use("/notifications", notificationRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 3002;

// Initialize Socket.io
socketService.initialize(server);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.io server initialized`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions (temporarily disabled to prevent crashes)
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

// Log errors without crashing
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception (non-fatal):', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection (non-fatal) at:', promise, 'reason:', reason);
});
