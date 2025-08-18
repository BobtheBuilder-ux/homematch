import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { format } from '@cloudinary/url-gen/actions/delivery';
import { source } from '@cloudinary/url-gen/actions/overlay';
import { image } from '@cloudinary/url-gen/qualifiers/source';
import { Position } from '@cloudinary/url-gen/qualifiers/position';
import { compass } from '@cloudinary/url-gen/qualifiers/gravity';
import { opacity } from '@cloudinary/url-gen/actions/adjust';

// Initialize Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'
  }
});

export interface CloudinaryUploadResponse {
  url: string;
  key: string;
  publicId?: string;
  format?: string;
  resourceType?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  watermark?: boolean;
  resourceType?: 'image' | 'video' | 'auto';
  transformation?: any[];
}

/**
 * Upload a single file via Cloudinary-S3 hybrid service
 */
export const uploadSingleFile = async (
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.watermark) formData.append('watermark', 'true');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload/single`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload file');
  }

  return response.json();
};

/**
 * Upload multiple files via Cloudinary-S3 hybrid service
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResponse[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  if (options.folder) formData.append('folder', options.folder);
  if (options.watermark) formData.append('watermark', 'true');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload/multiple`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload files');
  }

  return response.json();
};

/**
 * Upload property photos with watermark
 */
export const uploadPropertyPhotos = async (
  files: File[],
  propertyId: string
): Promise<CloudinaryUploadResponse[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('photos', file);
  });
  formData.append('propertyId', propertyId);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload/property-photos`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload property photos');
  }

  return response.json();
};

/**
 * Upload property video with watermark
 */
export const uploadPropertyVideo = async (
  file: File,
  propertyId: string
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('propertyId', propertyId);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload/property-video`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload property video');
  }

  return response.json();
};

/**
 * Upload application documents
 */
export const uploadApplicationDocuments = async (
  idDocument: File | null,
  incomeProof: File | null,
  applicationId: string
): Promise<{ idDocument?: CloudinaryUploadResponse; incomeProof?: CloudinaryUploadResponse }> => {
  const formData = new FormData();
  
  if (idDocument) {
    formData.append('idDocument', idDocument);
  }
  if (incomeProof) {
    formData.append('incomeProof', incomeProof);
  }
  formData.append('applicationId', applicationId);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload/application-documents`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload application documents');
  }

  return response.json();
};

/**
 * Delete a file from Cloudinary
 */
export const deleteFile = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl: publicId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete file');
  }
};

/**
 * Generate optimized image URL with transformations
 */
export const generateOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    watermark?: boolean;
  } = {}
): string => {
  const img = cld.image(publicId);

  // Apply transformations
  if (options.width || options.height) {
    const resizeTransform = auto();
    if (options.width) resizeTransform.width(options.width);
    if (options.height) resizeTransform.height(options.height);
    img.resize(resizeTransform);
  }

  if (options.quality) {
    img.delivery(quality(options.quality));
  }

  if (options.format) {
    img.delivery(format(options.format));
  }

  // Add watermark if requested
  if (options.watermark) {
    img.overlay(
      source(image('logo_watermark'))
        .position(
          new Position()
            .gravity(compass('south_east'))
            .offsetX(10)
            .offsetY(10)
        )
    );
  }

  return img.toURL();
};

/**
 * Generate optimized video URL with transformations
 */
export const generateOptimizedVideoUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'mp4' | 'webm';
    watermark?: boolean;
  } = {}
): string => {
  const video = cld.video(publicId);

  // Apply transformations
  if (options.width || options.height) {
    const resizeTransform = auto();
    if (options.width) resizeTransform.width(options.width);
    if (options.height) resizeTransform.height(options.height);
    video.resize(resizeTransform);
  }

  if (options.quality) {
    video.delivery(quality(options.quality));
  }

  if (options.format) {
    video.delivery(format(options.format));
  }

  // Add watermark if requested
  if (options.watermark) {
    video.overlay(
      source(image('logo_watermark'))
        .position(
          new Position()
            .gravity(compass('south_east'))
            .offsetX(10)
            .offsetY(10)
        )
    );
  }

  return video.toURL();
};

/**
 * Get responsive image URLs for different screen sizes
 */
export const getResponsiveImageUrls = (
  publicId: string,
  watermark: boolean = false
) => {
  return {
    mobile: generateOptimizedImageUrl(publicId, {
      width: 480,
      height: 320,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      watermark
    }),
    tablet: generateOptimizedImageUrl(publicId, {
      width: 768,
      height: 512,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      watermark
    }),
    desktop: generateOptimizedImageUrl(publicId, {
      width: 1200,
      height: 800,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      watermark
    }),
    thumbnail: generateOptimizedImageUrl(publicId, {
      width: 200,
      height: 150,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
      watermark
    })
  };
};

export { cld };
export default cld;