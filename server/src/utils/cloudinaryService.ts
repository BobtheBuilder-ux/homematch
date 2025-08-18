import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export interface ProcessedFileResult {
  s3Url: string;
  s3Key: string;
  originalUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload logo to Cloudinary for watermarking
 */
export const uploadLogoForWatermark = async (logoPath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(logoPath, {
      public_id: 'watermark/logo',
      folder: 'watermarks',
      resource_type: 'image',
      overwrite: true,
    });
    return result.public_id;
  } catch (error) {
    console.error('Error uploading logo for watermark:', error);
    throw new Error('Failed to upload logo for watermarking');
  }
};

/**
 * Process image through Cloudinary with watermark and optimization, then store in S3
 */
export const processAndStoreImage = async (
  filePath: string,
  fileName: string,
  folder: string = 'uploads',
  addWatermark: boolean = false
): Promise<ProcessedFileResult> => {
  try {
    // Step 1: Upload to Cloudinary for processing
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `temp/${folder}`,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    // Step 2: Generate optimized URL with transformations
    let transformationUrl = cloudinary.url(uploadResult.public_id, {
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 1200,
      height: 800,
      crop: 'limit',
    });

    // Add watermark if requested
    if (addWatermark) {
      transformationUrl = cloudinary.url(uploadResult.public_id, {
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
    const response = await fetch(transformationUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch processed image from Cloudinary');
    }
    const imageBuffer = await response.buffer();

    // Step 4: Upload to S3
    const s3Key = `${folder}/${Date.now()}-${fileName}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: response.headers.get('content-type') || 'image/jpeg',
    });

    await s3Client.send(uploadCommand);
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Step 5: Clean up temporary Cloudinary file
    await cloudinary.uploader.destroy(uploadResult.public_id);

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
  } catch (error) {
    console.error('Error processing and storing image:', error);
    throw new Error('Failed to process and store image');
  }
};

/**
 * Process video through Cloudinary with watermark and optimization, then store in S3
 */
export const processAndStoreVideo = async (
  filePath: string,
  fileName: string,
  folder: string = 'uploads',
  addWatermark: boolean = false
): Promise<ProcessedFileResult> => {
  try {
    // Step 1: Upload to Cloudinary for processing
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `temp/${folder}`,
      resource_type: 'video',
      quality: 'auto:good',
    });

    // Step 2: Generate optimized URL with transformations
    let transformationUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: 'video',
      quality: 'auto:good',
      width: 1280,
      height: 720,
      crop: 'limit',
      format: 'mp4',
    });

    // Add watermark if requested
    if (addWatermark) {
      transformationUrl = cloudinary.url(uploadResult.public_id, {
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
    const response = await fetch(transformationUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch processed video from Cloudinary');
    }
    const videoBuffer = await response.buffer();

    // Step 4: Upload to S3
    const s3Key = `${folder}/${Date.now()}-${fileName}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    });

    await s3Client.send(uploadCommand);
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Step 5: Clean up temporary Cloudinary file
    await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'video' });

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
  } catch (error) {
    console.error('Error processing and storing video:', error);
    throw new Error('Failed to process and store video');
  }
};

/**
 * Process multiple images and store in S3
 */
export const processAndStoreMultipleImages = async (
  files: { path: string; originalname: string }[],
  folder: string = 'uploads',
  addWatermark: boolean = false
): Promise<ProcessedFileResult[]> => {
  const results: ProcessedFileResult[] = [];
  
  for (const file of files) {
    try {
      const result = await processAndStoreImage(file.path, file.originalname, folder, addWatermark);
      results.push(result);
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return results;
};

/**
 * Upload document directly to S3 without Cloudinary processing
 */
export const uploadDocumentToS3 = async (
  filePath: string,
  fileName: string,
  folder: string = 'documents'
): Promise<{ s3Url: string; s3Key: string }> => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const s3Key = `${folder}/${Date.now()}-${fileName}`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(uploadCommand);
    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return { s3Url, s3Key };
  } catch (error) {
    console.error('Error uploading document to S3:', error);
    throw new Error('Failed to upload document to S3');
  }
};

/**
 * Delete file from S3
 */
export const deleteFileFromS3 = async (s3Key: string): Promise<void> => {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Extract S3 key from S3 URL
 */
export const extractS3KeyFromUrl = (s3Url: string): string => {
  const url = new URL(s3Url);
  return url.pathname.substring(1); // Remove leading slash
};

/**
 * Generate optimized image URL using Cloudinary (for temporary processing)
 */
export const generateOptimizedUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
    watermark?: boolean;
  } = {}
): string => {
  const transformations: any = {
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

  return cloudinary.url(publicId, transformations);
};

export { cloudinary };