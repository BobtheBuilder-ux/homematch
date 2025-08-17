"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const applicationControllers_1 = require("../controllers/applicationControllers");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter: (req, file, cb) => {
        // Allow documents and images
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only documents and images are allowed.'));
        }
    }
});
// Route for application with file uploads
router.post("/with-files", (0, authMiddleware_1.authMiddleware)(["tenant"]), upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
]), applicationControllers_1.createApplicationWithFiles);
// Original route for applications without files
router.post("/", (0, authMiddleware_1.authMiddleware)(["tenant"]), applicationControllers_1.createApplication);
router.put("/:id/status", (0, authMiddleware_1.authMiddleware)(["landlord", "admin"]), applicationControllers_1.updateApplicationStatus);
router.get("/", (0, authMiddleware_1.authMiddleware)(["landlord", "tenant", "admin"]), applicationControllers_1.listApplications);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["landlord", "tenant", "admin"]), applicationControllers_1.getApplication);
exports.default = router;
