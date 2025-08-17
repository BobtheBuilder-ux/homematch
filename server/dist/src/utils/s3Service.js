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
exports.extractS3Key = exports.getS3Url = exports.deleteFileFromS3 = exports.uploadMultipleFilesToS3 = exports.uploadFileToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const uuid_1 = require("uuid");
// Initialize S3 client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
/**
 * Upload a file to S3
 * @param file - The file buffer or stream
 * @param fileName - Original filename
 * @param mimeType - File MIME type
 * @param folder - S3 folder path (e.g., 'documents', 'photos', 'properties')
 * @returns Promise with upload result containing URL and key
 */
const uploadFileToS3 = (file_1, fileName_1, mimeType_1, ...args_1) => __awaiter(void 0, [file_1, fileName_1, mimeType_1, ...args_1], void 0, function* (file, fileName, mimeType, folder = 'uploads') {
    try {
        // Generate unique filename to avoid conflicts
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const key = `${folder}/${uniqueFileName}`;
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: mimeType,
        };
        const upload = new lib_storage_1.Upload({
            client: s3Client,
            params: uploadParams,
        });
        const result = yield upload.done();
        return {
            url: result.Location || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            key: key,
        };
    }
    catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error(`Failed to upload file: ${error}`);
    }
});
exports.uploadFileToS3 = uploadFileToS3;
/**
 * Upload multiple files to S3
 * @param files - Array of file objects with buffer, filename, and mimetype
 * @param folder - S3 folder path
 * @returns Promise with array of upload results
 */
const uploadMultipleFilesToS3 = (files_1, ...args_1) => __awaiter(void 0, [files_1, ...args_1], void 0, function* (files, folder = 'uploads') {
    try {
        const uploadPromises = files.map(file => (0, exports.uploadFileToS3)(file.buffer, file.filename, file.mimetype, folder));
        return yield Promise.all(uploadPromises);
    }
    catch (error) {
        console.error('Error uploading multiple files to S3:', error);
        throw new Error(`Failed to upload files: ${error}`);
    }
});
exports.uploadMultipleFilesToS3 = uploadMultipleFilesToS3;
/**
 * Delete a file from S3
 * @param key - S3 object key
 * @returns Promise
 */
const deleteFileFromS3 = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: key,
        };
        const command = new client_s3_1.DeleteObjectCommand(deleteParams);
        yield s3Client.send(command);
    }
    catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error(`Failed to delete file: ${error}`);
    }
});
exports.deleteFileFromS3 = deleteFileFromS3;
/**
 * Get the S3 URL for a given key
 * @param key - S3 object key
 * @returns S3 URL
 */
const getS3Url = (key) => {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
exports.getS3Url = getS3Url;
/**
 * Extract S3 key from URL
 * @param url - S3 URL
 * @returns S3 key or null if invalid URL
 */
const extractS3Key = (url) => {
    try {
        const urlPattern = new RegExp(`https://${BUCKET_NAME}\.s3\..+\.amazonaws\.com/(.+)`);
        const match = url.match(urlPattern);
        return match ? match[1] : null;
    }
    catch (error) {
        return null;
    }
};
exports.extractS3Key = extractS3Key;
