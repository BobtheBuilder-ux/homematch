import express from "express";
import {
  getLandlord,
  createLandlord,
  updateLandlord,
  getLandlordProperties,
  registerLandlordWithCode,
  completeLandlordOnboarding,
} from "../controllers/landlordControllers";

const router = express.Router();

router.get("/:cognitoId", getLandlord);
router.put("/:cognitoId", updateLandlord);
router.put("/:cognitoId/onboarding", completeLandlordOnboarding);
router.get("/:cognitoId/properties", getLandlordProperties);
router.post("/", createLandlord);
router.post("/register-with-code", registerLandlordWithCode);

export default router;
