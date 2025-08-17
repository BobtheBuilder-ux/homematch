// Utility functions for handling file uploads to S3

export interface FileUploadResponse {
  url: string;
  key: string;
}

/**
 * Upload a single file to S3
 */
export const uploadFileToS3 = async (file: File, endpoint: string = '/uploads/single'): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(errorData.message || 'Failed to upload file');
  }

  return response.json();
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFilesToS3 = async (files: File[], endpoint: string = '/uploads/multiple'): Promise<FileUploadResponse[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(errorData.message || 'Failed to upload files');
  }

  return response.json();
};

/**
 * Upload application documents (ID and income proof)
 */
export const uploadApplicationDocuments = async (idDocument?: File, incomeProof?: File): Promise<{ idDocumentUrl?: string; incomeProofUrl?: string }> => {
  const formData = new FormData();
  
  if (idDocument) {
    formData.append('idDocument', idDocument);
  }
  
  if (incomeProof) {
    formData.append('incomeProof', incomeProof);
  }

  if (!idDocument && !incomeProof) {
    return {};
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/application-documents`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(errorData.message || 'Failed to upload application documents');
  }

  return response.json();
};

/**
 * Upload property photos
 */
export const uploadPropertyPhotos = async (photos: File[]): Promise<FileUploadResponse[]> => {
  if (photos.length === 0) {
    return [];
  }

  const formData = new FormData();
  photos.forEach(photo => {
    formData.append('photos', photo);
  });

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/property-photos`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(errorData.message || 'Failed to upload property photos');
  }

  return response.json();
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(errorData.message || 'Failed to delete file');
  }
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileExtension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();
  
  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileExtension === type.substring(1);
    }
    return mimeType.startsWith(type);
  });
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};