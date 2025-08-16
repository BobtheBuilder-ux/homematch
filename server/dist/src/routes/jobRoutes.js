"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobControllers_1 = require("../controllers/jobControllers");
const router = express_1.default.Router();
// Job Management Routes (Admin)
router.post("/jobs", jobControllers_1.createJob);
router.get("/jobs", jobControllers_1.getAllJobs);
router.get("/jobs/active", jobControllers_1.getActiveJobs);
router.get("/jobs/:id", jobControllers_1.getJobById);
router.put("/jobs/:id", jobControllers_1.updateJob);
router.delete("/jobs/:id", jobControllers_1.deleteJob);
router.get("/jobs/:id/stats", jobControllers_1.getJobStats);
// Job Application Routes
router.post("/jobs/:id/apply", jobControllers_1.submitJobApplication);
router.get("/jobs/:id/applications", jobControllers_1.getJobApplications);
router.get("/applications", jobControllers_1.searchJobApplications);
router.get("/applications/stats", jobControllers_1.getApplicationStats);
router.get("/applications/status/:status", jobControllers_1.getJobApplicationsByStatus);
router.get("/applications/:id", jobControllers_1.getJobApplicationById);
router.put("/applications/:id/status", jobControllers_1.updateJobApplicationStatus);
router.get("/applications/export", jobControllers_1.exportJobApplications);
// Rating System Routes
router.post("/applications/:id/rate", jobControllers_1.rateJobApplication);
router.get("/applications/:id/ratings", jobControllers_1.getJobApplicationRatings);
exports.default = router;
