"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinaryUploadControllers_1 = require("../controllers/cloudinaryUploadControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit per file (Cloudinary handles large files better)
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types including videos
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
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
            cb(new Error('Invalid file type. Only images, PDFs, documents, and videos are allowed.'));
        }
    }
});
// Single file upload to Cloudinary
router.post('/single', (0, authMiddleware_1.authMiddleware)(['landlord', 'tenant', 'admin']), upload.single('file'), cloudinaryUploadControllers_1.uploadSingleFile);
// Multiple files upload to Cloudinary
router.post('/multiple', (0, authMiddleware_1.authMiddleware)(['landlord', 'tenant', 'admin']), upload.array('files', 20), cloudinaryUploadControllers_1.uploadMultipleFiles);
// Application documents upload to Cloudinary (ID and income proof)
router.post('/application-documents', (0, authMiddleware_1.authMiddleware)(['tenant']), upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
]), cloudinaryUploadControllers_1.uploadApplicationDocuments);
// Property photos upload to Cloudinary with watermark
router.post('/property-photos', (0, authMiddleware_1.authMiddleware)(['landlord']), upload.array('photos', 20), cloudinaryUploadControllers_1.uploadPropertyPhotos);
// Property video upload to Cloudinary with watermark
router.post('/property-video', (0, authMiddleware_1.authMiddleware)(['landlord']), upload.single('video'), cloudinaryUploadControllers_1.uploadPropertyVideo);
// Upload logo watermark to Cloudinary (admin only, one-time setup)
router.post('/logo-watermark', (0, authMiddleware_1.authMiddleware)(['admin']), upload.single('logo'), cloudinaryUploadControllers_1.uploadLogoWatermark);
// Delete file from Cloudinary
router.delete('/delete', (0, authMiddleware_1.authMiddleware)(['landlord', 'tenant', 'admin']), cloudinaryUploadControllers_1.deleteFile);
// Generate optimized URL for existing Cloudinary asset
router.get('/optimize-url', (0, authMiddleware_1.authMiddleware)(['landlord', 'tenant', 'admin']), cloudinaryUploadControllers_1.getOptimizedUrl);
exports.default = router;
