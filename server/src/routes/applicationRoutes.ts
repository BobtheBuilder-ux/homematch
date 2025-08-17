import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createApplication,
  createApplicationWithFiles,
  listApplications,
  updateApplicationStatus,
  getApplication,
} from "../controllers/applicationControllers";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow documents and images
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed.'));
    }
  }
});

// Route for application with file uploads
router.post("/with-files", 
  authMiddleware(["tenant"]), 
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'incomeProof', maxCount: 1 }
  ]), 
  createApplicationWithFiles
);

// Original route for applications without files
router.post("/", authMiddleware(["tenant"]), createApplication);
router.put("/:id/status", authMiddleware(["landlord", "admin"]), updateApplicationStatus);
router.get("/", authMiddleware(["landlord", "tenant", "admin"]), listApplications);
router.get("/:id", authMiddleware(["landlord", "tenant", "admin"]), getApplication);

export default router;
