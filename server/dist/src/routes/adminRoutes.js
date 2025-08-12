"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminControllers_1 = require("../controllers/adminControllers");
const router = express_1.default.Router();
router.get("/analytics", adminControllers_1.getAnalytics);
router.get("/users", adminControllers_1.getAllUsers);
router.get("/properties", adminControllers_1.getAllProperties);
router.put("/users/:userId/status", adminControllers_1.updateUserStatus);
router.delete("/users/:userId", adminControllers_1.deleteUser);
router.put("/properties/:propertyId/status", adminControllers_1.updatePropertyStatus);
router.delete("/properties/:propertyId", adminControllers_1.deleteProperty);
router.get("/settings", adminControllers_1.getAdminSettings);
router.put("/settings", adminControllers_1.updateAdminSettings);
router.get("/agents/:cognitoId", adminControllers_1.getAgent);
router.get("/admins/:cognitoId", adminControllers_1.getAdmin);
router.get("/landlord-registrations", adminControllers_1.getLandlordRegistrations);
router.get("/landlord-registration-stats", adminControllers_1.getLandlordRegistrationStats);
// Agent Registration Code Management
router.get("/agent-registrations", adminControllers_1.getAgentRegistrations);
router.get("/agent-registration-stats", adminControllers_1.getAgentRegistrationStats);
router.post("/assign-code-to-agent", adminControllers_1.assignCodeToAgent);
// Task Management
router.post("/tasks", adminControllers_1.createTask);
router.get("/tasks", adminControllers_1.getTasks);
router.put("/tasks/:id", adminControllers_1.updateTask);
router.delete("/tasks/:id", adminControllers_1.deleteTask);
router.get("/task-stats", adminControllers_1.getTaskStats);
exports.default = router;
