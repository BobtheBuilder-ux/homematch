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
  createAgent,
  createAdmin,
  getAdmin,
  getAgent,
  getLandlordRegistrations,
  getLandlordRegistrationStats,
  getAgentRegistrations,
  getAgentRegistrationStats,
  assignCodeToAgent,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskStats,
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

router.get("/agents/:cognitoId", getAgent);
router.get("/admins/:cognitoId", getAdmin);
router.get("/landlord-registrations", getLandlordRegistrations);
router.get("/landlord-registration-stats", getLandlordRegistrationStats);

// Agent Registration Code Management
router.get("/agent-registrations", getAgentRegistrations);
router.get("/agent-registration-stats", getAgentRegistrationStats);
router.post("/assign-code-to-agent", assignCodeToAgent);

// Task Management
router.post("/tasks", createTask);
router.get("/tasks", getTasks);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.get("/task-stats", getTaskStats);

export default router;