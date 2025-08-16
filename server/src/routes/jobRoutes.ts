import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getActiveJobs,
  submitJobApplication,
  getJobApplications,
  getJobApplicationById,
  updateJobApplicationStatus,
  rateJobApplication,
  getJobApplicationRatings,
  getJobApplicationsByStatus,
  searchJobApplications,
  getJobStats,
  getApplicationStats,
  exportJobApplications,
} from "../controllers/jobControllers";

const router = express.Router();

// Job Management Routes (Admin)
router.post("/jobs", createJob);
router.get("/jobs", getAllJobs);
router.get("/jobs/active", getActiveJobs);
router.get("/jobs/:id", getJobById);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);
router.get("/jobs/:id/stats", getJobStats);

// Job Application Routes
router.post("/jobs/:id/apply", submitJobApplication);
router.get("/jobs/:id/applications", getJobApplications);
router.get("/applications", searchJobApplications);
router.get("/applications/stats", getApplicationStats);
router.get("/applications/status/:status", getJobApplicationsByStatus);
router.get("/applications/:id", getJobApplicationById);
router.put("/applications/:id/status", updateJobApplicationStatus);
router.get("/applications/export", exportJobApplications);

// Rating System Routes
router.post("/applications/:id/rate", rateJobApplication);
router.get("/applications/:id/ratings", getJobApplicationRatings);

export default router;