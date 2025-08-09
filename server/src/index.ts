import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authMiddleware } from "./middleware/authMiddleware";
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

/* CONFIGURATIONS */
dotenv.config();
const app = express();
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
        ? [process.env.FRONTEND_URL || "https://homematch.ng"]
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

/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
