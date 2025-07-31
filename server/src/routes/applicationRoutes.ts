import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
  getApplication,
} from "../controllers/applicationControllers";

const router = express.Router();

router.post("/", authMiddleware(["tenant"]), createApplication);
router.put("/:id/status", authMiddleware(["landlord", "admin"]), updateApplicationStatus);
router.get("/", authMiddleware(["landlord", "tenant", "admin"]), listApplications);
router.get("/:id", authMiddleware(["landlord", "tenant", "admin"]), getApplication);

export default router;
