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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadPropertyVideo = exports.uploadPropertyPhotos = exports.uploadApplicationDocuments = exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const s3Service_1 = require("../utils/s3Service");
/**
 * Upload a single file to S3
 */
const uploadSingleFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { folder = 'uploads' } = req.body;
        if (!file) {
            res.status(400).json({ message: 'No file provided' });
            return;
        }
        const result = yield (0, s3Service_1.uploadFileToS3)(file.buffer, file.originalname, file.mimetype, folder);
        res.status(200).json({
            message: 'File uploaded successfully',
            url: result.url,
            key: result.key,
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            message: 'Failed to upload file',
            error: error.message
        });
    }
});
exports.uploadSingleFile = uploadSingleFile;
/**
 * Upload multiple files to S3
 */
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        const { folder = 'uploads' } = req.body;
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files provided' });
            return;
        }
        const fileData = files.map(file => ({
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
        }));
        const results = yield (0, s3Service_1.uploadMultipleFilesToS3)(fileData, folder);
        res.status(200).json({
            message: 'Files uploaded successfully',
            files: results,
        });
    }
    catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({
            message: 'Failed to upload files',
            error: error.message
        });
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
/**
 * Upload application documents (ID and income proof)
 */
const uploadApplicationDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        const uploadResults = {};
        // Handle ID document
        if (files.idDocument && files.idDocument[0]) {
            const idFile = files.idDocument[0];
            const idResult = yield (0, s3Service_1.uploadFileToS3)(idFile.buffer, idFile.originalname, idFile.mimetype, 'documents/id');
            uploadResults.idDocumentUrl = idResult.url;
        }
        // Handle income proof document
        if (files.incomeProof && files.incomeProof[0]) {
            const incomeFile = files.incomeProof[0];
            const incomeResult = yield (0, s3Service_1.uploadFileToS3)(incomeFile.buffer, incomeFile.originalname, incomeFile.mimetype, 'documents/income');
            uploadResults.incomeProofUrl = incomeResult.url;
        }
        if (Object.keys(uploadResults).length === 0) {
            res.status(400).json({ message: 'No valid documents provided' });
            return;
        }
        res.status(200).json({
            message: 'Documents uploaded successfully',
            documents: uploadResults,
        });
    }
    catch (error) {
        console.error('Error uploading application documents:', error);
        res.status(500).json({
            message: 'Failed to upload documents',
            error: error.message
        });
    }
});
exports.uploadApplicationDocuments = uploadApplicationDocuments;
/**
 * Upload property photos
 */
const uploadPropertyPhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No photos provided' });
            return;
        }
        // Validate file types (only images)
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidFiles = files.filter(file => !validImageTypes.includes(file.mimetype));
        if (invalidFiles.length > 0) {
            res.status(400).json({
                message: 'Invalid file types. Only JPEG, PNG, and WebP images are allowed.',
                invalidFiles: invalidFiles.map(f => f.originalname)
            });
            return;
        }
        const fileData = files.map(file => ({
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
        }));
        const results = yield (0, s3Service_1.uploadMultipleFilesToS3)(fileData, 'properties/photos');
        res.status(200).json({
            message: 'Property photos uploaded successfully',
            photos: results.map(result => result.url),
        });
    }
    catch (error) {
        console.error('Error uploading property photos:', error);
        res.status(500).json({
            message: 'Failed to upload property photos',
            error: error.message
        });
    }
});
exports.uploadPropertyPhotos = uploadPropertyPhotos;
/**
 * Upload property video (optional)
 */
const uploadPropertyVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No video file provided' });
            return;
        }
        // Validate file type (only videos)
        const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (!validVideoTypes.includes(file.mimetype)) {
            res.status(400).json({
                message: 'Invalid file type. Only MP4, MPEG, QuickTime, AVI, and WebM videos are allowed.',
                receivedType: file.mimetype
            });
            return;
        }
        // Check file size (limit to 100MB for videos)
        const maxVideoSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxVideoSize) {
            res.status(400).json({
                message: 'Video file too large. Maximum size is 100MB.',
                fileSize: file.size,
                maxSize: maxVideoSize
            });
            return;
        }
        const result = yield (0, s3Service_1.uploadFileToS3)(file.buffer, file.originalname, file.mimetype, 'properties/videos');
        res.status(200).json({
            message: 'Property video uploaded successfully',
            videoUrl: result.url,
            key: result.key,
        });
    }
    catch (error) {
        console.error('Error uploading property video:', error);
        res.status(500).json({
            message: 'Failed to upload property video',
            error: error.message
        });
    }
});
exports.uploadPropertyVideo = uploadPropertyVideo;
/**
 * Delete a file from S3
 */
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ message: 'File URL is required' });
            return;
        }
        const key = (0, s3Service_1.extractS3Key)(url);
        if (!key) {
            res.status(400).json({ message: 'Invalid S3 URL' });
            return;
        }
        yield (0, s3Service_1.deleteFileFromS3)(key);
        res.status(200).json({
            message: 'File deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            message: 'Failed to delete file',
            error: error.message
        });
    }
});
exports.deleteFile = deleteFile;
