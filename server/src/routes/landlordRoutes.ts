import express from "express";
import {
  getLandlord,
  createLandlord,
  updateLandlord,
  getLandlordProperties,
  registerLandlordWithCode,
} from "../controllers/landlordControllers";

const router = express.Router();

router.get("/:cognitoId", getLandlord);
router.put("/:cognitoId", updateLandlord);
router.get("/:cognitoId/properties", getLandlordProperties);
router.post("/", createLandlord);
router.post("/register-with-code", registerLandlordWithCode);

export default router;
