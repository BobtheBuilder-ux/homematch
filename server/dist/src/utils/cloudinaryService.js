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
exports.cloudinary = exports.generateOptimizedUrl = exports.extractS3KeyFromUrl = exports.deleteFileFromS3 = exports.uploadDocumentToS3 = exports.processAndStoreMultipleImages = exports.processAndStoreVideo = exports.processAndStoreImage = exports.uploadLogoForWatermark = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configure S3
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
/**
 * Upload logo to Cloudinary for watermarking
 */
const uploadLogoForWatermark = (logoPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.v2.uploader.upload(logoPath, {
            public_id: 'watermark/logo',
            folder: 'watermarks',
            resource_type: 'image',
            overwrite: true,
        });
        return result.public_id;
    }
    catch (error) {
        console.error('Error uploading logo for watermark:', error);
        throw new Error('Failed to upload logo for watermarking');
    }
});
exports.uploadLogoForWatermark = uploadLogoForWatermark;
/**
 * Process image through Cloudinary with watermark and optimization, then store in S3
 */
const processAndStoreImage = (filePath_1, fileName_1, ...args_1) => __awaiter(void 0, [filePath_1, fileName_1, ...args_1], void 0, function* (filePath, fileName, folder = 'uploads', addWatermark = false) {
    try {
        // Step 1: Upload to Cloudinary for processing
        const uploadResult = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `temp/${folder}`,
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
        });
        // Step 2: Generate optimized URL with transformations
        let transformationUrl = cloudinary_1.v2.url(uploadResult.public_id, {
            quality: 'auto:good',
            fetch_format: 'auto',
            width: 1200,
            height: 800,
            crop: 'limit',
        });
        // Add watermark if requested
        if (addWatermark) {
            transformationUrl = cloudinary_1.v2.url(uploadResult.public_id, {
                quality: 'auto:good',
                fetch_format: 'auto',
                width: 1200,
                height: 800,
                crop: 'limit',
                overlay: 'watermarks:logo_watermark',
                gravity: 'south_east',
                x: 20,
                y: 20,
                opacity: 70,
            });
        }
        // Step 3: Download processed image from Cloudinary
        const response = yield (0, node_fetch_1.default)(transformationUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch processed image from Cloudinary');
        }
        const imageBuffer = yield response.buffer();
        // Step 4: Upload to S3
        const s3Key = `${folder}/${Date.now()}-${fileName}`;
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: imageBuffer,
            ContentType: response.headers.get('content-type') || 'image/jpeg',
        });
        yield s3Client.send(uploadCommand);
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        // Step 5: Clean up temporary Cloudinary file
        yield cloudinary_1.v2.uploader.destroy(uploadResult.public_id);
        return {
            s3Url,
            s3Key,
            originalUrl: transformationUrl,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            resourceType: 'image',
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: imageBuffer.length,
        };
    }
    catch (error) {
        console.error('Error processing and storing image:', error);
        throw new Error('Failed to process and store image');
    }
});
exports.processAndStoreImage = processAndStoreImage;
/**
 * Process video through Cloudinary with watermark and optimization, then store in S3
 */
const processAndStoreVideo = (filePath_1, fileName_1, ...args_1) => __awaiter(void 0, [filePath_1, fileName_1, ...args_1], void 0, function* (filePath, fileName, folder = 'uploads', addWatermark = false) {
    try {
        // Step 1: Upload to Cloudinary for processing
        const uploadResult = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `temp/${folder}`,
            resource_type: 'video',
            quality: 'auto:good',
        });
        // Step 2: Generate optimized URL with transformations
        let transformationUrl = cloudinary_1.v2.url(uploadResult.public_id, {
            resource_type: 'video',
            quality: 'auto:good',
            width: 1280,
            height: 720,
            crop: 'limit',
            format: 'mp4',
        });
        // Add watermark if requested
        if (addWatermark) {
            transformationUrl = cloudinary_1.v2.url(uploadResult.public_id, {
                resource_type: 'video',
                quality: 'auto:good',
                width: 1280,
                height: 720,
                crop: 'limit',
                format: 'mp4',
                overlay: 'watermarks:logo_watermark',
                gravity: 'south_east',
                x: 20,
                y: 20,
                opacity: 70,
            });
        }
        // Step 3: Download processed video from Cloudinary
        const response = yield (0, node_fetch_1.default)(transformationUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch processed video from Cloudinary');
        }
        const videoBuffer = yield response.buffer();
        // Step 4: Upload to S3
        const s3Key = `${folder}/${Date.now()}-${fileName}`;
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: videoBuffer,
            ContentType: 'video/mp4',
        });
        yield s3Client.send(uploadCommand);
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        // Step 5: Clean up temporary Cloudinary file
        yield cloudinary_1.v2.uploader.destroy(uploadResult.public_id, { resource_type: 'video' });
        return {
            s3Url,
            s3Key,
            originalUrl: transformationUrl,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            resourceType: 'video',
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: videoBuffer.length,
        };
    }
    catch (error) {
        console.error('Error processing and storing video:', error);
        throw new Error('Failed to process and store video');
    }
});
exports.processAndStoreVideo = processAndStoreVideo;
/**
 * Process multiple images and store in S3
 */
const processAndStoreMultipleImages = (files_1, ...args_1) => __awaiter(void 0, [files_1, ...args_1], void 0, function* (files, folder = 'uploads', addWatermark = false) {
    const results = [];
    for (const file of files) {
        try {
            const result = yield (0, exports.processAndStoreImage)(file.path, file.originalname, folder, addWatermark);
            results.push(result);
        }
        catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
            // Continue with other files even if one fails
        }
    }
    return results;
});
exports.processAndStoreMultipleImages = processAndStoreMultipleImages;
/**
 * Upload document directly to S3 without Cloudinary processing
 */
const uploadDocumentToS3 = (filePath_1, fileName_1, ...args_1) => __awaiter(void 0, [filePath_1, fileName_1, ...args_1], void 0, function* (filePath, fileName, folder = 'documents') {
    try {
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const s3Key = `${folder}/${Date.now()}-${fileName}`;
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: 'application/pdf',
        });
        yield s3Client.send(uploadCommand);
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        return { s3Url, s3Key };
    }
    catch (error) {
        console.error('Error uploading document to S3:', error);
        throw new Error('Failed to upload document to S3');
    }
});
exports.uploadDocumentToS3 = uploadDocumentToS3;
/**
 * Delete file from S3
 */
const deleteFileFromS3 = (s3Key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
        });
        yield s3Client.send(deleteCommand);
    }
    catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
});
exports.deleteFileFromS3 = deleteFileFromS3;
/**
 * Extract S3 key from S3 URL
 */
const extractS3KeyFromUrl = (s3Url) => {
    const url = new URL(s3Url);
    return url.pathname.substring(1); // Remove leading slash
};
exports.extractS3KeyFromUrl = extractS3KeyFromUrl;
/**
 * Generate optimized image URL using Cloudinary (for temporary processing)
 */
const generateOptimizedUrl = (publicId, options = {}) => {
    const transformations = {
        quality: options.quality || 'auto:good',
        fetch_format: options.format || 'auto',
    };
    if (options.width || options.height) {
        transformations.width = options.width;
        transformations.height = options.height;
        transformations.crop = options.crop || 'limit';
    }
    if (options.watermark) {
        transformations.overlay = 'watermarks:watermark:logo';
        transformations.gravity = 'south_east';
        transformations.x = 20;
        transformations.y = 20;
        transformations.opacity = 70;
    }
    return cloudinary_1.v2.url(publicId, transformations);
};
exports.generateOptimizedUrl = generateOptimizedUrl;
