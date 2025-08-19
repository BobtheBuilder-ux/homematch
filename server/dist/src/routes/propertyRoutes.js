"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const propertyControllers_1 = require("../controllers/propertyControllers");
const leaseControllers_1 = require("../controllers/leaseControllers");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const cacheMiddleware_1 = require("../middleware/cacheMiddleware");
const cdnMiddleware_1 = require("../middleware/cdnMiddleware");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
        // Allow images and videos for property uploads
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images and videos are allowed for properties.'));
        }
    }
});
const router = express_1.default.Router();
router.get("/", cacheMiddleware_1.propertyListingsCache, cdnMiddleware_1.propertyImageOptimizationMiddleware, propertyControllers_1.getProperties);
router.get("/:id", cacheMiddleware_1.singlePropertyCache, cdnMiddleware_1.responsiveImageMiddleware, propertyControllers_1.getProperty);
router.get("/:propertyId/leases", (0, authMiddleware_1.authMiddleware)(["landlord", "tenant", "admin"]), leaseControllers_1.getPropertyLeases);
router.post("/", (0, authMiddleware_1.authMiddleware)(["landlord"]), upload.fields([
    { name: 'photos', maxCount: 20 },
    { name: 'video', maxCount: 1 }
]), propertyControllers_1.createProperty);
exports.default = router;
