"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const redisService_1 = __importDefault(require("./utils/redisService"));
const rateLimitMiddleware_1 = require("./middleware/rateLimitMiddleware");
const performanceMiddleware_1 = require("./middleware/performanceMiddleware");
const database_1 = require("./utils/database");
const cdnMiddleware_1 = require("./middleware/cdnMiddleware");
const socketService_1 = require("./services/socketService");
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
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const cloudinaryUploadRoutes_1 = __importDefault(require("./routes/cloudinaryUploadRoutes"));
const agentPropertyRoutes_1 = __importDefault(require("./routes/agentPropertyRoutes"));
const notifications_1 = __importDefault(require("./routes/notifications"));
/* CONFIGURATIONS */
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialize Redis connection
redisService_1.default.connect().catch(console.error);
// Initialize database connection
database_1.databaseService.connect().catch(console.error);
// Health check and metrics endpoints (before rate limiting)
app.use(performanceMiddleware_1.healthCheckMiddleware);
app.use(performanceMiddleware_1.metricsEndpoint);
// CDN headers and image optimization
app.use(cdnMiddleware_1.cdnHeadersMiddleware);
app.use(cdnMiddleware_1.imageOptimizationMiddleware);
// Performance monitoring
app.use(performanceMiddleware_1.performanceMiddleware);
// Apply general rate limiting to all requests
app.use(rateLimitMiddleware_1.generalRateLimit);
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
app.use("/properties", rateLimitMiddleware_1.searchRateLimit, propertyRoutes_1.default);
app.use("/leases", leaseRoutes_1.default);
app.use("/payments", rateLimitMiddleware_1.paymentRateLimit, paymentRoutes_1.default);
app.use("/inspections", (0, authMiddleware_1.authMiddleware)(["tenant", "landlord", "agent", "admin"]), inspectionRoutes_1.default);
app.use("/tenants", (0, authMiddleware_1.authMiddleware)(["tenant", "landlord", "agent", "admin"]), tenantRoutes_1.default);
app.use("/landlords", (0, authMiddleware_1.authMiddleware)(["landlord", "admin"]), landlordRoutes_1.default);
// Admin routes with exception for admin creation
// Public admin routes (no authentication required)
app.use("/admin", rateLimitMiddleware_1.authRateLimit, publicAdminRoutes_1.default);
app.use("/agent", rateLimitMiddleware_1.authRateLimit, publicAgentRoutes_1.default);
app.use("/surveys", surveyRoutes_1.default);
// Protected admin routes (authentication required)
app.use("/admin", (0, authMiddleware_1.authMiddleware)(["admin"]), rateLimitMiddleware_1.adminRateLimit, adminRoutes_1.default);
app.use("/agent", (0, authMiddleware_1.authMiddleware)(["agent"]), agentRoutes_1.default);
app.use("/emails", emailRoutes_1.default);
app.use("/earnings", (0, authMiddleware_1.authMiddleware)(["landlord", "admin"]), earningsRoutes_1.default);
app.use("/jobs", jobRoutes_1.default);
app.use("/uploads", rateLimitMiddleware_1.uploadRateLimit, uploadRoutes_1.default);
app.use("/cloudinary", rateLimitMiddleware_1.uploadRateLimit, cloudinaryUploadRoutes_1.default);
app.use("/agent-properties", (0, authMiddleware_1.authMiddleware)(["admin", "agent"]), agentPropertyRoutes_1.default);
app.use("/notifications", notifications_1.default);
/* SERVER */
const port = Number(process.env.PORT) || 3002;
// Initialize Socket.io
socketService_1.socketService.initialize(server);
server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.io server initialized`);
});
// Graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGTERM received, shutting down gracefully');
    yield Promise.all([
        redisService_1.default.disconnect(),
        database_1.databaseService.disconnect()
    ]);
    process.exit(0);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGINT received, shutting down gracefully');
    yield Promise.all([
        redisService_1.default.disconnect(),
        database_1.databaseService.disconnect()
    ]);
    process.exit(0);
}));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
