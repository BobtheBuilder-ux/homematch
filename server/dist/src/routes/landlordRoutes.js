"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const landlordControllers_1 = require("../controllers/landlordControllers");
const router = express_1.default.Router();
router.get("/:cognitoId", landlordControllers_1.getLandlord);
router.put("/:cognitoId", landlordControllers_1.updateLandlord);
router.put("/:cognitoId/onboarding", landlordControllers_1.completeLandlordOnboarding);
router.get("/:cognitoId/properties", landlordControllers_1.getLandlordProperties);
router.post("/", landlordControllers_1.createLandlord);
router.post("/register-with-code", landlordControllers_1.registerLandlordWithCode);
exports.default = router;
