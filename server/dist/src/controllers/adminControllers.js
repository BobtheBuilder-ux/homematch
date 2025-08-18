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
exports.getTaskStats = exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = exports.assignCodeToAgent = exports.getAgentRegistrationStats = exports.getAgentRegistrations = exports.getLandlordRegistrationStats = exports.getLandlordRegistrations = exports.getAllAgents = exports.getAgent = exports.getAdmin = exports.createAdmin = exports.createAgent = exports.updateAdminSettings = exports.getAdminSettings = exports.deleteProperty = exports.updatePropertyStatus = exports.deleteUser = exports.updateUserStatus = exports.getAllProperties = exports.getAllUsers = exports.getAnalytics = void 0;
const client_1 = require("@prisma/client");
const emailSubscriptionService_1 = require("../utils/emailSubscriptionService");
const agentPropertyMatchingController_1 = require("./agentPropertyMatchingController");
const prisma = new client_1.PrismaClient();
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get total counts
        const totalProperties = yield prisma.property.count();
        const totalUsers = (yield prisma.tenant.count()) + (yield prisma.landlord.count());
        const totalApplications = yield prisma.application.count();
        // Calculate revenue from payments
        const payments = yield prisma.payment.findMany({
            where: { paymentStatus: "Paid" },
        });
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
        // Get monthly revenue data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyPayments = yield prisma.payment.findMany({
            where: {
                paymentDate: { gte: sixMonthsAgo },
                paymentStatus: "Paid",
            },
            include: { lease: true },
        });
        const monthlyRevenue = monthlyPayments.reduce((acc, payment) => {
            const month = payment.paymentDate.toISOString().slice(0, 7);
            const existing = acc.find(item => item.month === month);
            if (existing) {
                existing.revenue += payment.amountPaid;
            }
            else {
                acc.push({ month, revenue: payment.amountPaid });
            }
            return acc;
        }, []);
        // Get property types distribution
        const propertyTypes = yield prisma.property.groupBy({
            by: ['propertyType'],
            _count: { propertyType: true },
        });
        const propertyTypesData = propertyTypes.map(type => ({
            name: type.propertyType,
            count: type._count.propertyType,
        }));
        // Get applications by status
        const applicationsByStatus = yield prisma.application.groupBy({
            by: ['status'],
            _count: { status: true },
        });
        const applicationsData = applicationsByStatus.map(status => ({
            status: status.status,
            count: status._count.status,
        }));
        const analytics = {
            totalProperties,
            totalUsers,
            totalApplications,
            totalRevenue,
            propertiesGrowth: '', // Mock data - you can calculate actual growth
            usersGrowth: '',
            applicationsGrowth: '',
            revenueGrowth: '',
            monthlyRevenue,
            propertyTypes: propertyTypesData,
            applicationsByStatus: applicationsData,
        };
        res.json(analytics);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching analytics: ${error.message}` });
    }
});
exports.getAnalytics = getAnalytics;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenants = yield prisma.tenant.findMany({
            select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });
        const landlords = yield prisma.landlord.findMany({
            select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });
        const agents = yield prisma.agent.findMany({
            select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });
        const users = [
            ...tenants.map(tenant => (Object.assign(Object.assign({}, tenant), { role: 'tenant', status: 'active', createdAt: new Date() }))),
            ...landlords.map(landlord => (Object.assign(Object.assign({}, landlord), { role: 'landlord', status: 'active', createdAt: new Date() }))),
            ...agents.map(agent => (Object.assign(Object.assign({}, agent), { role: 'agent', status: 'active', createdAt: new Date() }))),
        ];
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching users: ${error.message}` });
    }
});
exports.getAllUsers = getAllUsers;
const getAllProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const properties = yield prisma.property.findMany({
            include: {
                location: true,
                landlord: true,
            },
        });
        res.json(properties);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching properties: ${error.message}` });
    }
});
exports.getAllProperties = getAllProperties;
const updateUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        // Note: In a real implementation, you'd update the user status in your database
        // For now, we'll just return success
        res.json({ message: "User status updated successfully", userId, status });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating user status: ${error.message}` });
    }
});
exports.updateUserStatus = updateUserStatus;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        // Check if user is a tenant or landlord and delete accordingly
        const tenant = yield prisma.tenant.findUnique({ where: { cognitoId: userId } });
        const landlord = yield prisma.landlord.findUnique({ where: { cognitoId: userId } });
        if (tenant) {
            yield prisma.tenant.delete({ where: { cognitoId: userId } });
        }
        else if (landlord) {
            yield prisma.landlord.delete({ where: { cognitoId: userId } });
        }
        else {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting user: ${error.message}` });
    }
});
exports.deleteUser = deleteUser;
const updatePropertyStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { propertyId } = req.params;
        const { status } = req.body;
        // Validate status values
        const validStatuses = ['PendingApproval', 'Available', 'Closed', 'Rejected'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: "Invalid status. Must be one of: PendingApproval, Available, Closed, Rejected" });
            return;
        }
        // Update property status in database
        const updatedProperty = yield prisma.property.update({
            where: { id: Number(propertyId) },
            data: { status },
            include: {
                location: true,
                landlord: true
            }
        });
        // If property is approved (Available), automatically assign to an agent
        if (status === 'Available') {
            try {
                yield (0, agentPropertyMatchingController_1.assignPropertyToAgent)(Number(propertyId));
                console.log(`Property ${propertyId} successfully assigned to an agent`);
            }
            catch (assignmentError) {
                console.error(`Failed to assign property ${propertyId} to agent:`, assignmentError.message);
                // Don't fail the status update if agent assignment fails
            }
        }
        res.json({
            message: "Property status updated successfully",
            property: updatedProperty
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: "Property not found" });
        }
        else {
            res.status(500).json({ message: `Error updating property status: ${error.message}` });
        }
    }
});
exports.updatePropertyStatus = updatePropertyStatus;
const deleteProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { propertyId } = req.params;
        yield prisma.property.delete({
            where: { id: Number(propertyId) },
        });
        res.json({ message: "Property deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting property: ${error.message}` });
    }
});
exports.deleteProperty = deleteProperty;
const getAdminSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get or create admin settings
        let settings = yield prisma.adminSettings.findFirst();
        if (!settings) {
            // Create default settings if none exist
            settings = yield prisma.adminSettings.create({
                data: {}
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching settings: ${error.message}` });
    }
});
exports.getAdminSettings = getAdminSettings;
const updateAdminSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settingsData = req.body;
        // Get or create admin settings
        let settings = yield prisma.adminSettings.findFirst();
        if (!settings) {
            // Create new settings if none exist
            settings = yield prisma.adminSettings.create({
                data: settingsData
            });
        }
        else {
            // Update existing settings
            settings = yield prisma.adminSettings.update({
                where: { id: settings.id },
                data: settingsData
            });
        }
        res.json({ message: "Settings updated successfully", settings });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating settings: ${error.message}` });
    }
});
exports.updateAdminSettings = updateAdminSettings;
const createAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Creating agent with request body:", req.body);
        const { cognitoId, name, email, phoneNumber, address } = req.body;
        // Validate required fields
        if (!name || !email) {
            console.log("Missing required fields - name:", name, "email:", email);
            res.status(400).json({ message: "Name and email are required" });
            return;
        }
        // Check if agent with this email already exists
        console.log("Checking for existing agent with email:", email);
        const existingAgent = yield prisma.agent.findFirst({
            where: { email },
        });
        let agent;
        if (existingAgent) {
            console.log("Agent already exists:", existingAgent);
            // Update existing agent with the real cognitoId from Cognito authentication
            if (cognitoId && existingAgent.cognitoId !== cognitoId) {
                console.log("Updating existing agent's cognitoId from", existingAgent.cognitoId, "to", cognitoId);
                agent = yield prisma.agent.update({
                    where: { id: existingAgent.id },
                    data: {
                        cognitoId: cognitoId,
                        name,
                        phoneNumber: phoneNumber || existingAgent.phoneNumber,
                        address: address || existingAgent.address,
                    },
                });
                console.log("Agent updated in database:", agent);
            }
            else {
                console.log("Agent already exists with same cognitoId, returning existing agent");
                agent = existingAgent;
            }
        }
        else {
            console.log("No existing agent found, proceeding with creation");
            // Use provided cognitoId or generate a temporary one
            const finalCognitoId = cognitoId || `temp-agent-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            console.log("Using cognitoId for agent:", finalCognitoId);
            // Set user context for agent creation
            if (!req.user) {
                req.user = {
                    id: finalCognitoId,
                    role: 'agent'
                };
            }
            console.log("User object for agent creation:", req.user);
            // Create agent in database
            console.log("Creating agent in database with cognitoId:", finalCognitoId);
            agent = yield prisma.agent.create({
                data: {
                    cognitoId: finalCognitoId,
                    name,
                    email,
                    phoneNumber: phoneNumber || '',
                    address: address || '',
                },
            });
            console.log("Agent created in database:", agent);
        }
        // Add agent to email list
        try {
            yield (0, emailSubscriptionService_1.addToEmailList)({
                email: agent.email,
                fullName: agent.name,
                subscriptionType: 'newsletter'
            });
            console.log(`Added agent ${agent.email} to email list`);
        }
        catch (emailError) {
            console.error('Error adding agent to email list:', emailError);
            // Don't fail the agent creation if email subscription fails
        }
        res.status(201).json({
            message: "Agent created successfully",
            agent: {
                id: agent.id,
                name: agent.name,
                email: agent.email,
                phoneNumber: agent.phoneNumber,
                address: agent.address,
            },
        });
    }
    catch (error) {
        console.error("Error creating agent:", error);
        res.status(500).json({ message: `Error creating agent: ${error.message}` });
    }
});
exports.createAgent = createAgent;
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Creating admin with request body:", req.body);
        const { cognitoId, name, email, phoneNumber } = req.body;
        // Validate required fields
        if (!name || !email) {
            console.log("Missing required fields - name:", name, "email:", email);
            res.status(400).json({ message: "Name and email are required" });
            return;
        }
        // Validate email domain
        if (!email.endsWith('@homematch.ng')) {
            console.log("Invalid email domain:", email);
            res.status(400).json({ message: "Admin registration is only allowed for emails ending with @homematch.ng" });
            return;
        }
        // Check if admin with this email already exists
        console.log("Checking for existing admin with email:", email);
        const existingAdmin = yield prisma.admin.findFirst({
            where: { email }
        });
        let admin;
        if (existingAdmin) {
            console.log("Admin already exists:", existingAdmin);
            // Update existing admin with the real cognitoId from Cognito authentication
            if (cognitoId && existingAdmin.cognitoId !== cognitoId) {
                console.log("Updating existing admin's cognitoId from", existingAdmin.cognitoId, "to", cognitoId);
                admin = yield prisma.admin.update({
                    where: { id: existingAdmin.id },
                    data: {
                        cognitoId: cognitoId,
                        name,
                        phoneNumber: phoneNumber || existingAdmin.phoneNumber,
                    },
                });
                console.log("Admin updated in database:", admin);
            }
            else {
                console.log("Admin already exists with same cognitoId, returning existing admin");
                admin = existingAdmin;
            }
        }
        else {
            console.log("No existing admin found, proceeding with creation");
            // Use provided cognitoId or generate a temporary one
            const finalCognitoId = cognitoId || `temp-admin-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            console.log("Using cognitoId for admin:", finalCognitoId);
            // Create admin in database
            console.log("Creating admin in database with cognitoId:", finalCognitoId);
            admin = yield prisma.admin.create({
                data: {
                    cognitoId: finalCognitoId,
                    name,
                    email,
                    phoneNumber: phoneNumber || '',
                },
            });
            console.log("Admin created in database:", admin);
        }
        // Add admin to email list (Cognito will handle the OTP email)
        try {
            yield (0, emailSubscriptionService_1.addToEmailList)({
                email: admin.email,
                fullName: admin.name,
                subscriptionType: 'newsletter'
            });
            console.log(`Admin ${admin.email} added to email list`);
        }
        catch (emailError) {
            console.error('Error adding admin to email list:', emailError);
            // Don't fail the admin creation if email subscription fails
        }
        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: admin.id,
                cognitoId: admin.cognitoId,
                name: admin.name,
                email: admin.email,
                phoneNumber: admin.phoneNumber,
            },
        });
    }
    catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({ message: `Error creating admin: ${error.message}` });
    }
});
exports.createAdmin = createAdmin;
const getAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        console.log("Getting admin with cognitoId:", cognitoId);
        const admin = yield prisma.admin.findUnique({
            where: { cognitoId },
            select: {
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });
        console.log("Admin found:", admin);
        if (!admin) {
            console.log("Admin not found for cognitoId:", cognitoId);
            res.status(404).json({ message: "Admin not found" });
            return;
        }
        res.json(admin);
    }
    catch (error) {
        console.error("Error retrieving admin:", error);
        res.status(500).json({ message: `Error retrieving admin: ${error.message}` });
    }
});
exports.getAdmin = getAdmin;
const getAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        console.log("Getting agent with cognitoId:", cognitoId);
        const agent = yield prisma.agent.findUnique({
            where: { cognitoId },
            select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
                address: true,
            },
        });
        console.log("Agent found:", agent);
        if (!agent) {
            console.log("Agent not found for cognitoId:", cognitoId);
            res.status(404).json({ message: "Agent not found" });
            return;
        }
        res.json(agent);
    }
    catch (error) {
        console.error("Error retrieving agent:", error);
        res.status(500).json({ message: `Error retrieving agent: ${error.message}` });
    }
});
exports.getAgent = getAgent;
const getAllAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agents = yield prisma.agent.findMany();
        res.json(agents);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving agents: ${error.message}` });
    }
});
exports.getAllAgents = getAllAgents;
const getLandlordRegistrations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { codeFilter, usedFilter } = req.query;
        let whereClause = {};
        // Filter by specific code if provided
        if (codeFilter && typeof codeFilter === 'string') {
            whereClause.code = {
                contains: codeFilter,
                mode: 'insensitive'
            };
        }
        // Filter by used status if provided
        if (usedFilter !== undefined) {
            whereClause.isUsed = usedFilter === 'true';
        }
        const registrationCodes = yield prisma.landlordRegistrationCode.findMany({
            where: whereClause,
            include: {
                landlords: {
                    select: {
                        cognitoId: true,
                        name: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(registrationCodes);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving landlord registrations: ${error.message}` });
    }
});
exports.getLandlordRegistrations = getLandlordRegistrations;
const getLandlordRegistrationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalCodes = yield prisma.landlordRegistrationCode.count();
        const usedCodes = yield prisma.landlordRegistrationCode.count({
            where: { isUsed: true }
        });
        const availableCodes = totalCodes - usedCodes;
        const recentRegistrations = yield prisma.landlordRegistrationCode.findMany({
            where: { isUsed: true },
            include: {
                landlords: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                usedAt: 'desc'
            },
            take: 5
        });
        res.json({
            totalCodes,
            usedCodes,
            availableCodes,
            recentRegistrations
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving landlord registration stats: ${error.message}` });
    }
});
exports.getLandlordRegistrationStats = getLandlordRegistrationStats;
// Agent Registration Code Management
const getAgentRegistrations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { codeFilter, usedFilter } = req.query;
        let whereClause = {};
        // Filter by specific code if provided
        if (codeFilter && typeof codeFilter === 'string') {
            whereClause.code = {
                contains: codeFilter,
                mode: 'insensitive'
            };
        }
        // Filter by used status if provided
        if (usedFilter !== undefined) {
            whereClause.isUsed = usedFilter === 'true';
        }
        const registrationCodes = yield prisma.agentRegistrationCode.findMany({
            where: whereClause,
            include: {
                agents: {
                    select: {
                        cognitoId: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        address: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(registrationCodes);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving agent registrations: ${error.message}` });
    }
});
exports.getAgentRegistrations = getAgentRegistrations;
const getAgentRegistrationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalCodes = yield prisma.agentRegistrationCode.count();
        const usedCodes = yield prisma.agentRegistrationCode.count({
            where: { isUsed: true }
        });
        const availableCodes = totalCodes - usedCodes;
        const recentRegistrations = yield prisma.agentRegistrationCode.findMany({
            where: { isUsed: true },
            include: {
                agents: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                usedAt: 'desc'
            },
            take: 5
        });
        res.json({
            totalCodes,
            usedCodes,
            availableCodes,
            recentRegistrations
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving agent registration stats: ${error.message}` });
    }
});
exports.getAgentRegistrationStats = getAgentRegistrationStats;
const assignCodeToAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { codeId, agentId } = req.body;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            res.status(401).json({ message: 'Admin authentication required' });
            return;
        }
        // Check if code exists and is available
        const code = yield prisma.agentRegistrationCode.findUnique({
            where: { id: codeId }
        });
        if (!code) {
            res.status(404).json({ message: 'Registration code not found' });
            return;
        }
        if (code.isUsed) {
            res.status(400).json({ message: 'Registration code is already used' });
            return;
        }
        // Check if agent exists
        const agent = yield prisma.agent.findUnique({
            where: { id: agentId }
        });
        if (!agent) {
            res.status(404).json({ message: 'Agent not found' });
            return;
        }
        // Update the code to mark it as assigned
        yield prisma.agentRegistrationCode.update({
            where: { id: codeId },
            data: {
                assignedBy: adminCognitoId,
                usedAt: new Date(),
                isUsed: true
            }
        });
        // Update the agent with the registration code
        yield prisma.agent.update({
            where: { id: agentId },
            data: {
                registrationCodeId: codeId
            }
        });
        res.json({ message: 'Code successfully assigned to agent' });
    }
    catch (error) {
        res.status(500).json({ message: `Error assigning code to agent: ${error.message}` });
    }
});
exports.assignCodeToAgent = assignCodeToAgent;
// Task Management
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, priority, dueDate, agentId } = req.body;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            res.status(401).json({ message: 'Admin authentication required' });
            return;
        }
        // Check if agent exists
        const agent = yield prisma.agent.findUnique({
            where: { id: agentId }
        });
        if (!agent) {
            res.status(404).json({ message: 'Agent not found' });
            return;
        }
        const task = yield prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'Medium',
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedBy: adminCognitoId,
                agentId
            },
            include: {
                agent: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating task: ${error.message}` });
    }
});
exports.createTask = createTask;
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, priority, agentId } = req.query;
        let whereClause = {};
        if (status && typeof status === 'string') {
            whereClause.status = status;
        }
        if (priority && typeof priority === 'string') {
            whereClause.priority = priority;
        }
        if (agentId && typeof agentId === 'string') {
            whereClause.agentId = parseInt(agentId);
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
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasks = getTasks;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, status, priority, dueDate } = req.body;
        const task = yield prisma.task.update({
            where: { id: parseInt(id) },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (title && { title })), (description && { description })), (status && { status })), (priority && { priority })), (dueDate && { dueDate: new Date(dueDate) })),
            include: {
                agent: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.task.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error.message}` });
    }
});
exports.deleteTask = deleteTask;
const getTaskStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalTasks = yield prisma.task.count();
        const pendingTasks = yield prisma.task.count({ where: { status: 'Pending' } });
        const inProgressTasks = yield prisma.task.count({ where: { status: 'InProgress' } });
        const completedTasks = yield prisma.task.count({ where: { status: 'Completed' } });
        const overdueTasks = yield prisma.task.count({
            where: {
                dueDate: {
                    lt: new Date()
                },
                status: {
                    not: 'Completed'
                }
            }
        });
        res.json({
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            overdueTasks
        });
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving task stats: ${error.message}` });
    }
});
exports.getTaskStats = getTaskStats;
