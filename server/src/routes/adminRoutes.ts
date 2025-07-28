import express from "express";
import {
  getAnalytics,
  getAllUsers,
  getAllProperties,
  updateUserStatus,
  deleteUser,
  updatePropertyStatus,
  deleteProperty,
  getAdminSettings,
  updateAdminSettings,
} from "../controllers/adminControllers";

const router = express.Router();

router.get("/analytics", getAnalytics);
router.get("/users", getAllUsers);
router.get("/properties", getAllProperties);
router.put("/users/:userId/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);
router.put("/properties/:propertyId/status", updatePropertyStatus);
router.delete("/properties/:propertyId", deleteProperty);
router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

export default router;