"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agentControllers_1 = require("../controllers/agentControllers");
const router = express_1.default.Router();
router.get("/leads", agentControllers_1.getAgentLeads);
router.get("/clients", agentControllers_1.getAgentClients);
router.get("/tasks", agentControllers_1.getAgentTasks);
router.put("/leads/:leadId/status", agentControllers_1.updateLeadStatus);
router.put("/tasks/:taskId/status", agentControllers_1.updateTaskStatus);
router.put("/:cognitoId", agentControllers_1.updateAgentSettings);
exports.default = router;
