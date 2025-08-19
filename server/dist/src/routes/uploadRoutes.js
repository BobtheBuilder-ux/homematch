"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uploadControllers_1 = require("../controllers/uploadControllers");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types including videos
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
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
// Single file upload
router.post('/single', upload.single('file'), uploadControllers_1.uploadSingleFile);
// Multiple files upload
router.post('/multiple', upload.array('files', 10), uploadControllers_1.uploadMultipleFiles);
// Application documents upload (ID and income proof)
router.post('/application-documents', upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
]), uploadControllers_1.uploadApplicationDocuments);
// Property photos upload
router.post('/property-photos', upload.array('photos', 20), uploadControllers_1.uploadPropertyPhotos);
// Property video upload (optional)
router.post('/property-video', upload.single('video'), uploadControllers_1.uploadPropertyVideo);
// Delete file
router.delete('/delete', uploadControllers_1.deleteFile);
exports.default = router;
