"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobControllers_1 = require("../controllers/jobControllers");
const router = express_1.default.Router();
// Job Management Routes (Admin)
router.post("/", jobControllers_1.createJob);
router.get("/", jobControllers_1.getAllJobs);
router.get("/active", jobControllers_1.getActiveJobs);
router.get("/general-stats", jobControllers_1.getGeneralJobStats);
// Job Application Routes (must come before parameterized job routes)
router.get("/applications", jobControllers_1.searchJobApplications);
router.get("/applications/stats", jobControllers_1.getApplicationStats);
router.get("/applications/status/:status", jobControllers_1.getJobApplicationsByStatus);
router.get("/applications/export", jobControllers_1.exportJobApplications);
router.get("/applications/:id", jobControllers_1.getJobApplicationById);
router.put("/applications/:id/status", jobControllers_1.updateJobApplicationStatus);
// Parameterized Job Routes (must come after specific routes)
router.get("/:id", jobControllers_1.getJobById);
router.put("/:id", jobControllers_1.updateJob);
router.delete("/:id", jobControllers_1.deleteJob);
router.get("/:id/stats", jobControllers_1.getJobStats);
router.post("/:id/apply", jobControllers_1.submitJobApplication);
router.get("/:id/applications", jobControllers_1.getJobApplications);
// Rating System Routes
router.post("/applications/:id/rate", jobControllers_1.rateJobApplication);
router.get("/applications/:id/ratings", jobControllers_1.getJobApplicationRatings);
exports.default = router;
