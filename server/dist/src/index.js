"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authMiddleware_1 = require("./middleware/authMiddleware");
/* ROUTE IMPORT */
const tenantRoutes_1 = __importDefault(require("./routes/tenantRoutes"));
const landlordRoutes_1 = __importDefault(require("./routes/landlordRoutes"));
const propertyRoutes_1 = __importDefault(require("./routes/propertyRoutes"));
const leaseRoutes_1 = __importDefault(require("./routes/leaseRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const publicAdminRoutes_1 = __importDefault(require("./routes/publicAdminRoutes"));
const publicAgentRoutes_1 = __importDefault(require("./routes/publicAgentRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const surveyRoutes_1 = __importDefault(require("./routes/surveyRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const inspectionRoutes_1 = __importDefault(require("./routes/inspectionRoutes"));
const emailRoutes_1 = __importDefault(require("./routes/emailRoutes"));
const earningsRoutes_1 = __importDefault(require("./routes/earningsRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
/* CONFIGURATIONS */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
// Update CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL || "https://homematch.ng",
            "https://www.homematch.ng",
            "https://homematch.ng",
            /https:\/\/.*\.vercel\.app$/,
            /https:\/\/.*\.netlify\.app$/
        ]
        : true,
    credentials: true,
}));
/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is home route");
});
app.use("/applications", applicationRoutes_1.default);
app.use("/properties", propertyRoutes_1.default);
app.use("/leases", leaseRoutes_1.default);
app.use("/payments", paymentRoutes_1.default);
app.use("/inspections", (0, authMiddleware_1.authMiddleware)(["tenant", "landlord", "agent", "admin"]), inspectionRoutes_1.default);
app.use("/tenants", (0, authMiddleware_1.authMiddleware)(["tenant", "landlord", "agent", "admin"]), tenantRoutes_1.default);
app.use("/landlords", (0, authMiddleware_1.authMiddleware)(["landlord", "admin"]), landlordRoutes_1.default);
// Admin routes with exception for admin creation
// Public admin routes (no authentication required)
app.use("/admin", publicAdminRoutes_1.default);
app.use("/agent", publicAgentRoutes_1.default);
app.use("/surveys", surveyRoutes_1.default);
// Protected admin routes (authentication required)
app.use("/admin", (0, authMiddleware_1.authMiddleware)(["admin"]), adminRoutes_1.default);
app.use("/agent", (0, authMiddleware_1.authMiddleware)(["agent"]), agentRoutes_1.default);
app.use("/emails", emailRoutes_1.default);
app.use("/earnings", (0, authMiddleware_1.authMiddleware)(["landlord", "admin"]), earningsRoutes_1.default);
app.use("/jobs", jobRoutes_1.default);
/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
