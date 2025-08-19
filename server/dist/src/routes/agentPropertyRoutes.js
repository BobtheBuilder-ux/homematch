"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const agentPropertyMatchingController_1 = require("../controllers/agentPropertyMatchingController");
const router = express_1.default.Router();
// POST /agent-properties/assign - Manually assign a property to an agent
router.post('/assign', agentPropertyMatchingController_1.assignPropertyToAgentEndpoint);
// GET /agent-properties/agent/:agentId - Get all properties assigned to a specific agent
router.get('/agent/:agentId', agentPropertyMatchingController_1.getAgentProperties);
// GET /agent-properties/property/:propertyId - Get the agent assigned to a specific property
router.get('/property/:propertyId', agentPropertyMatchingController_1.getPropertyAgent);
exports.default = router;
