import { Router } from 'express';
import multer from 'multer';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadApplicationDocuments,
  uploadPropertyPhotos,
  uploadPropertyVideo,
  uploadLogoWatermark,
  deleteFile,
  getOptimizedUrl,
} from '../controllers/cloudinaryUploadControllers';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
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
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, and videos are allowed.'));
    }
  }
});

// Single file upload to Cloudinary
router.post('/single', 
  authMiddleware(['landlord', 'tenant', 'admin']),
  upload.single('file'), 
  uploadSingleFile
);

// Multiple files upload to Cloudinary
router.post('/multiple', 
  authMiddleware(['landlord', 'tenant', 'admin']),
  upload.array('files', 20), 
  uploadMultipleFiles
);

// Application documents upload to Cloudinary (ID and income proof)
router.post('/application-documents', 
  authMiddleware(['tenant']),
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
  ]), 
  uploadApplicationDocuments
);

// Property photos upload to Cloudinary with watermark
router.post('/property-photos', 
  authMiddleware(['landlord']),
  upload.array('photos', 20), 
  uploadPropertyPhotos
);

// Property video upload to Cloudinary with watermark
router.post('/property-video', 
  authMiddleware(['landlord']),
  upload.single('video'), 
  uploadPropertyVideo
);

// Upload logo watermark to Cloudinary (admin only, one-time setup)
router.post('/logo-watermark', 
  authMiddleware(['admin']),
  upload.single('logo'),
  uploadLogoWatermark
);

// Delete file from Cloudinary
router.delete('/delete', 
  authMiddleware(['landlord', 'tenant', 'admin']),
  deleteFile
);

// Generate optimized URL for existing Cloudinary asset
router.get('/optimize-url', 
  authMiddleware(['landlord', 'tenant', 'admin']),
  getOptimizedUrl
);

export default router;