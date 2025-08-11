import express from "express";
import {
  getProperties,
  getProperty,
  createProperty,
} from "../controllers/propertyControllers";
import { getPropertyLeases } from "../controllers/leaseControllers";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", getProperties);
router.get("/:id", getProperty);
router.get(
  "/:propertyId/leases",
  authMiddleware(["landlord", "tenant", "admin"]),
  getPropertyLeases
);
router.post(
  "/",
  authMiddleware(["landlord"]),
  upload.array("photos"),
  createProperty
);

export default router;
