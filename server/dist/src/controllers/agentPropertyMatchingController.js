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
exports.getPropertyAgent = exports.getAgentProperties = exports.assignPropertyToAgentEndpoint = exports.assignPropertyToAgent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Assigns a property to an agent based on location matching
 * If multiple agents match the location, distributes properties equally
 */
const assignPropertyToAgent = (propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the property with its location
        const property = yield prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                location: true
            }
        });
        if (!property) {
            return { success: false, message: "Property not found" };
        }
        // Extract location keywords from property address and city
        const propertyLocationKeywords = [
            ...property.location.address.toLowerCase().split(/\s+/),
            ...property.location.city.toLowerCase().split(/\s+/),
            property.location.state.toLowerCase()
        ].filter(keyword => keyword.length > 2); // Filter out short words
        // Find agents whose address contains any of the property location keywords
        const allAgents = yield prisma.agent.findMany({
            where: {
                address: {
                    not: null
                }
            }
        });
        const matchingAgents = allAgents.filter(agent => {
            if (!agent.address)
                return false;
            const agentAddressLower = agent.address.toLowerCase();
            return propertyLocationKeywords.some(keyword => agentAddressLower.includes(keyword));
        });
        if (matchingAgents.length === 0) {
            return {
                success: false,
                message: "No agents found matching the property location"
            };
        }
        // If multiple agents match, find the one with the least assigned properties
        // to ensure equal distribution
        let selectedAgent = matchingAgents[0];
        if (matchingAgents.length > 1) {
            // Count properties assigned to each matching agent
            const agentPropertyCounts = yield Promise.all(matchingAgents.map((agent) => __awaiter(void 0, void 0, void 0, function* () {
                const count = yield prisma.agentProperty.count({
                    where: { agentId: agent.id }
                });
                return { agent, count };
            })));
            // Sort by property count (ascending) to get agent with least properties
            agentPropertyCounts.sort((a, b) => a.count - b.count);
            selectedAgent = agentPropertyCounts[0].agent;
        }
        // Create the agent-property assignment
        yield prisma.agentProperty.create({
            data: {
                agentId: selectedAgent.id,
                propertyId: propertyId,
                assignedAt: new Date()
            }
        });
        return {
            success: true,
            agentId: selectedAgent.id,
            message: `Property assigned to agent ${selectedAgent.name}`
        };
    }
    catch (error) {
        console.error("Error assigning property to agent:", error);
        return {
            success: false,
            message: `Error assigning property: ${error.message}`
        };
    }
});
exports.assignPropertyToAgent = assignPropertyToAgent;
/**
 * API endpoint to manually assign a property to an agent
 */
const assignPropertyToAgentEndpoint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { propertyId } = req.params;
        const result = yield (0, exports.assignPropertyToAgent)(Number(propertyId));
        if (result.success) {
            res.json({
                message: result.message,
                agentId: result.agentId
            });
        }
        else {
            res.status(400).json({ message: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ message: `Error: ${error.message}` });
    }
});
exports.assignPropertyToAgentEndpoint = assignPropertyToAgentEndpoint;
/**
 * Get all properties assigned to a specific agent
 */
const getAgentProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agentId } = req.params;
        const agentProperties = yield prisma.agentProperty.findMany({
            where: { agentId: Number(agentId) },
            include: {
                property: {
                    include: {
                        location: true,
                        landlord: true
                    }
                },
                agent: true
            },
            orderBy: { assignedAt: 'desc' }
        });
        res.json(agentProperties);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching agent properties: ${error.message}` });
    }
});
exports.getAgentProperties = getAgentProperties;
/**
 * Get the agent assigned to a specific property
 */
const getPropertyAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { propertyId } = req.params;
        const agentProperty = yield prisma.agentProperty.findFirst({
            where: { propertyId: Number(propertyId) },
            include: {
                agent: true,
                property: {
                    include: {
                        location: true
                    }
                }
            }
        });
        if (!agentProperty) {
            res.status(404).json({ message: "No agent assigned to this property" });
            return;
        }
        res.json(agentProperty);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching property agent: ${error.message}` });
    }
});
exports.getPropertyAgent = getPropertyAgent;
