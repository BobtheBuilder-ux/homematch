"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgentSettings = exports.updateTaskStatus = exports.updateLeadStatus = exports.getAgentTasks = exports.getAgentClients = exports.getAgentLeads = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAgentLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Return empty array - no demo content
        const leads = [];
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching leads: ${error.message}` });
    }
});
exports.getAgentLeads = getAgentLeads;
const getAgentClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get landlords and tenants as clients
        const landlords = yield prisma.landlord.findMany({
            include: {
                managedProperties: true,
            },
        });
        const tenants = yield prisma.tenant.findMany({
            include: {
                properties: true,
            },
        });
        const clients = [
            ...landlords.map(landlord => ({
                id: landlord.id,
                name: landlord.name,
                email: landlord.email,
                phoneNumber: landlord.phoneNumber,
                type: "landlord",
                status: "active",
                propertiesCount: landlord.managedProperties.length,
                totalValue: landlord.managedProperties.reduce((sum, prop) => sum + prop.pricePerYear, 0),
                lastContact: new Date(),
            })),
            ...tenants.map(tenant => ({
                id: tenant.id,
                name: tenant.name,
                email: tenant.email,
                phoneNumber: tenant.phoneNumber,
                type: "tenant",
                status: "active",
                propertiesCount: tenant.properties.length,
                totalValue: tenant.properties.reduce((sum, prop) => sum + prop.pricePerYear, 0),
                lastContact: new Date(),
            })),
        ];
        res.json(clients);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching clients: ${error.message}` });
    }
});
exports.getAgentClients = getAgentClients;
const getAgentTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const agentCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!agentCognitoId) {
            res.status(401).json({ message: 'Agent authentication required' });
            return;
        }
        // Find the agent by cognitoId
        const agent = yield prisma.agent.findUnique({
            where: { cognitoId: agentCognitoId }
        });
        if (!agent) {
            res.status(404).json({ message: 'Agent not found' });
            return;
        }
        const { status, priority } = req.query;
        let whereClause = {
            agentId: agent.id
        };
        if (status && typeof status === 'string') {
            whereClause.status = status;
        }
        if (priority && typeof priority === 'string') {
            whereClause.priority = priority;
        }
        const tasks = yield prisma.task.findMany({
            where: whereClause,
            include: {
                agent: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching tasks: ${error.message}` });
    }
});
exports.getAgentTasks = getAgentTasks;
const updateLeadStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leadId } = req.params;
        const { status } = req.body;
        // In a real implementation, you'd update the lead status in the database
        res.json({ message: "Lead status updated successfully", leadId, status });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating lead status: ${error.message}` });
    }
});
exports.updateLeadStatus = updateLeadStatus;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { taskId } = req.params;
        const { status, description } = req.body;
        const agentCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!agentCognitoId) {
            res.status(401).json({ message: 'Agent authentication required' });
            return;
        }
        // Find the agent by cognitoId
        const agent = yield prisma.agent.findUnique({
            where: { cognitoId: agentCognitoId }
        });
        if (!agent) {
            res.status(404).json({ message: 'Agent not found' });
            return;
        }
        // Check if the task exists and belongs to this agent
        const existingTask = yield prisma.task.findFirst({
            where: {
                id: parseInt(taskId),
                agentId: agent.id
            }
        });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found or not assigned to this agent' });
            return;
        }
        // Update the task
        const updatedTask = yield prisma.task.update({
            where: { id: parseInt(taskId) },
            data: Object.assign(Object.assign({}, (status && { status })), (description && { description })),
            include: {
                agent: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task status: ${error.message}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const updateAgentSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const { name, email, phoneNumber, address } = req.body;
        // Update agent in database
        const updatedAgent = yield prisma.agent.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
                address,
            },
        });
        res.json({
            message: "Agent settings updated successfully",
            agent: {
                cognitoId: updatedAgent.cognitoId,
                name: updatedAgent.name,
                email: updatedAgent.email,
                phoneNumber: updatedAgent.phoneNumber,
                address: updatedAgent.address,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating agent settings: ${error.message}` });
    }
});
exports.updateAgentSettings = updateAgentSettings;
