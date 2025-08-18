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
exports.getOptimizedUrl = exports.deleteFile = exports.uploadLogoWatermark = exports.uploadPropertyVideo = exports.uploadPropertyPhotos = exports.uploadApplicationDocuments = exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const cloudinaryService_1 = require("../utils/cloudinaryService");
/**
 * Upload a single file - process through Cloudinary and store in S3
 */
const uploadSingleFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        const { folder = 'uploads', watermark = 'false' } = req.body;
        const addWatermark = watermark === 'true';
        // Determine if it's an image or video
        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');
        let result;
        if (isImage) {
            result = yield (0, cloudinaryService_1.processAndStoreImage)(req.file.path, req.file.originalname, folder, addWatermark);
        }
        else if (isVideo) {
            result = yield (0, cloudinaryService_1.processAndStoreVideo)(req.file.path, req.file.originalname, folder, addWatermark);
        }
        else {
            // For documents, upload directly to S3
            const docResult = yield (0, cloudinaryService_1.uploadDocumentToS3)(req.file.path, req.file.originalname, folder);
            result = {
                s3Url: docResult.s3Url,
                s3Key: docResult.s3Key,
                originalUrl: docResult.s3Url,
                publicId: '',
                format: req.file.originalname.split('.').pop() || '',
                resourceType: 'raw',
                bytes: req.file.size
            };
        }
        res.status(200).json({
            message: 'File processed and stored successfully',
            file: result
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to process and store file' });
    }
});
exports.uploadSingleFile = uploadSingleFile;
/**
 * Upload multiple files - process through Cloudinary and store in S3
 */
const uploadMultipleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }
        const { folder = 'uploads', watermark = 'false' } = req.body;
        const addWatermark = watermark === 'true';
        const fileData = req.files.map(file => ({
            path: file.path,
            originalname: file.originalname
        }));
        const results = yield (0, cloudinaryService_1.processAndStoreMultipleImages)(fileData, folder, addWatermark);
        res.status(200).json({
            message: 'Files processed and stored successfully',
            files: results
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to process and store files' });
    }
});
exports.uploadMultipleFiles = uploadMultipleFiles;
/**
 * Upload application documents (ID and income proof)
 */
const uploadApplicationDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        const { applicationId } = req.body;
        if (!applicationId) {
            return res.status(400).json({ message: 'Application ID is required' });
        }
        const documents = {};
        // Handle ID document
        if (files.idDocument && files.idDocument[0]) {
            const idDoc = files.idDocument[0];
            const result = yield (0, cloudinaryService_1.uploadDocumentToS3)(idDoc.path, idDoc.originalname, `applications/${applicationId}/id`);
            documents.idDocument = {
                s3Url: result.s3Url,
                s3Key: result.s3Key,
                originalName: idDoc.originalname
            };
        }
        // Handle income proof
        if (files.incomeProof && files.incomeProof[0]) {
            const incomeDoc = files.incomeProof[0];
            const result = yield (0, cloudinaryService_1.uploadDocumentToS3)(incomeDoc.path, incomeDoc.originalname, `applications/${applicationId}/income`);
            documents.incomeProof = {
                s3Url: result.s3Url,
                s3Key: result.s3Key,
                originalName: incomeDoc.originalname
            };
        }
        if (Object.keys(documents).length === 0) {
            return res.status(400).json({ message: 'At least one document is required' });
        }
        res.status(200).json({
            message: 'Application documents uploaded successfully',
            documents
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload application documents' });
    }
});
exports.uploadApplicationDocuments = uploadApplicationDocuments;
/**
 * Upload property photos with watermark
 */
const uploadPropertyPhotos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No photos provided' });
        }
        const { propertyId } = req.body;
        if (!propertyId) {
            return res.status(400).json({ message: 'Property ID is required' });
        }
        const fileData = req.files.map(file => ({
            path: file.path,
            originalname: file.originalname
        }));
        const results = yield (0, cloudinaryService_1.processAndStoreMultipleImages)(fileData, `properties/${propertyId}/photos`, true // Always add watermark for property photos
        );
        res.status(200).json({
            message: 'Property photos processed and stored successfully',
            photos: results
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload property photos' });
    }
});
exports.uploadPropertyPhotos = uploadPropertyPhotos;
/**
 * Upload property video with watermark
 */
const uploadPropertyVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video provided' });
        }
        const { propertyId } = req.body;
        if (!propertyId) {
            return res.status(400).json({ message: 'Property ID is required' });
        }
        const result = yield (0, cloudinaryService_1.processAndStoreVideo)(req.file.path, req.file.originalname, `properties/${propertyId}/videos`, true // Always add watermark for property videos
        );
        res.status(200).json({
            message: 'Property video processed and stored successfully',
            video: result
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload property video' });
    }
});
exports.uploadPropertyVideo = uploadPropertyVideo;
/**
 * Upload logo for watermarking
 */
const uploadLogoWatermark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No logo file provided' });
        }
        const publicId = yield (0, cloudinaryService_1.uploadLogoForWatermark)(req.file.path);
        res.status(200).json({
            message: 'Logo uploaded successfully for watermarking',
            publicId
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload logo for watermarking' });
    }
});
exports.uploadLogoWatermark = uploadLogoWatermark;
/**
 * Delete a file from S3
 */
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { s3Url, s3Key } = req.body;
        if (!s3Url && !s3Key) {
            return res.status(400).json({ message: 'S3 URL or S3 key is required' });
        }
        const keyToDelete = s3Key || (0, cloudinaryService_1.extractS3KeyFromUrl)(s3Url);
        yield (0, cloudinaryService_1.deleteFileFromS3)(keyToDelete);
        res.status(200).json({
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: error.message || 'Failed to delete file' });
    }
});
exports.deleteFile = deleteFile;
/**
 * Generate optimized URL (for temporary Cloudinary processing)
 */
const getOptimizedUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { publicId, width, height, crop, quality, format, watermark } = req.query;
        if (!publicId) {
            return res.status(400).json({ message: 'Public ID is required' });
        }
        const optimizedUrl = (0, cloudinaryService_1.generateOptimizedUrl)(publicId, {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            crop: crop,
            quality: quality,
            format: format,
            watermark: watermark === 'true'
        });
        res.status(200).json({
            optimizedUrl
        });
    }
    catch (error) {
        console.error('URL generation error:', error);
        res.status(500).json({ message: error.message || 'Failed to generate optimized URL' });
    }
});
exports.getOptimizedUrl = getOptimizedUrl;
