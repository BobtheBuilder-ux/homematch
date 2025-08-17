import { Request, Response } from 'express';
import { uploadFileToS3, uploadMultipleFilesToS3, deleteFileFromS3, extractS3Key } from '../utils/s3Service';

/**
 * Upload a single file to S3
 */
export const uploadSingleFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { folder = 'uploads' } = req.body;

    if (!file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    const result = await uploadFileToS3(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder
    );

    res.status(200).json({
      message: 'File uploaded successfully',
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      message: 'Failed to upload file', 
      error: error.message 
    });
  }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
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

    const results = await uploadMultipleFilesToS3(fileData, folder);

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: results,
    });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      message: 'Failed to upload files', 
      error: error.message 
    });
  }
};

/**
 * Upload application documents (ID and income proof)
 */
export const uploadApplicationDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadResults: { [key: string]: string } = {};

    // Handle ID document
    if (files.idDocument && files.idDocument[0]) {
      const idFile = files.idDocument[0];
      const idResult = await uploadFileToS3(
        idFile.buffer,
        idFile.originalname,
        idFile.mimetype,
        'documents/id'
      );
      uploadResults.idDocumentUrl = idResult.url;
    }

    // Handle income proof document
    if (files.incomeProof && files.incomeProof[0]) {
      const incomeFile = files.incomeProof[0];
      const incomeResult = await uploadFileToS3(
        incomeFile.buffer,
        incomeFile.originalname,
        incomeFile.mimetype,
        'documents/income'
      );
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
  } catch (error: any) {
    console.error('Error uploading application documents:', error);
    res.status(500).json({ 
      message: 'Failed to upload documents', 
      error: error.message 
    });
  }
};

/**
 * Upload property photos
 */
export const uploadPropertyPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

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

    const results = await uploadMultipleFilesToS3(fileData, 'properties/photos');

    res.status(200).json({
      message: 'Property photos uploaded successfully',
      photos: results.map(result => result.url),
    });
  } catch (error: any) {
    console.error('Error uploading property photos:', error);
    res.status(500).json({ 
      message: 'Failed to upload property photos', 
      error: error.message 
    });
  }
};

/**
 * Delete a file from S3
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ message: 'File URL is required' });
      return;
    }

    const key = extractS3Key(url);
    if (!key) {
      res.status(400).json({ message: 'Invalid S3 URL' });
      return;
    }

    await deleteFileFromS3(key);

    res.status(200).json({
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      message: 'Failed to delete file', 
      error: error.message 
    });
  }
};