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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const emailSubscriptionService_1 = require("../utils/emailSubscriptionService");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get tenant's inspection limit
router.get("/limit/:tenantCognitoId", (0, authMiddleware_1.authMiddleware)(["tenant"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantCognitoId } = req.params;
        let inspectionLimit = yield prisma.inspectionLimit.findUnique({
            where: { tenantCognitoId }
        });
        if (!inspectionLimit) {
            inspectionLimit = yield prisma.inspectionLimit.create({
                data: {
                    tenantCognitoId,
                    freeInspections: 2,
                    usedInspections: 0,
                    hasUnlimited: false
                }
            });
        }
        res.json(inspectionLimit);
    }
    catch (error) {
        console.error("Error fetching inspection limit:", error);
        res.status(500).json({ error: "Failed to fetch inspection limit" });
    }
}));
// Create inspection request
router.post("/request", (0, authMiddleware_1.authMiddleware)(["tenant"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { propertyId, tenantCognitoId, tenantName, tenantEmail, tenantPhone, preferredTime, message, depositPaid = false, depositAmount, paymentReference } = req.body;
        // Calculate scheduled date (3 days ahead)
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 3);
        // Check inspection limit
        let inspectionLimit = yield prisma.inspectionLimit.findUnique({
            where: { tenantCognitoId }
        });
        if (!inspectionLimit) {
            inspectionLimit = yield prisma.inspectionLimit.create({
                data: {
                    tenantCognitoId,
                    freeInspections: 2,
                    usedInspections: 0,
                    hasUnlimited: false
                }
            });
        }
        // Check if tenant can request inspection
        const canRequestFree = inspectionLimit.usedInspections < inspectionLimit.freeInspections;
        const hasUnlimited = inspectionLimit.hasUnlimited &&
            (inspectionLimit.unlimitedUntil ? new Date() < inspectionLimit.unlimitedUntil : true);
        if (!canRequestFree && !hasUnlimited && !depositPaid) {
            res.status(400).json({
                error: "Free inspection limit exceeded. Deposit payment required.",
                requiresDeposit: true,
                depositAmount: 0.4 // 40% of property price
            });
            return;
        }
        // Get property details to find nearest agent
        const property = yield prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                location: true
            }
        });
        if (!property) {
            res.status(404).json({ error: "Property not found" });
            return;
        }
        // Find nearest agent (simplified - in real implementation, use geolocation)
        const nearestAgent = yield prisma.agent.findFirst({
            orderBy: { id: 'asc' } // Simplified selection
        });
        // Create inspection
        const inspection = yield prisma.inspection.create({
            data: {
                propertyId,
                tenantCognitoId,
                scheduledDate,
                tenantName,
                tenantEmail,
                tenantPhone,
                preferredTime,
                message,
                agentId: nearestAgent === null || nearestAgent === void 0 ? void 0 : nearestAgent.id,
                depositPaid,
                depositAmount,
                paymentReference
            },
            include: {
                property: {
                    include: {
                        location: true
                    }
                },
                agent: true
            }
        });
        // Update inspection limit if using free inspection
        if (!depositPaid && canRequestFree) {
            yield prisma.inspectionLimit.update({
                where: { tenantCognitoId },
                data: {
                    usedInspections: inspectionLimit.usedInspections + 1
                }
            });
        }
        // Send email notification to tenant about pending request
        try {
            yield (0, emailSubscriptionService_1.sendInspectionRequestEmail)(tenantEmail, tenantName, property.location.address, scheduledDate.toLocaleDateString(), preferredTime);
            console.log(`Inspection request email sent to tenant: ${tenantEmail}`);
        }
        catch (emailError) {
            console.error('Error sending inspection request email:', emailError);
            // Don't fail the inspection creation if email fails
        }
        res.status(201).json(inspection);
    }
    catch (error) {
        console.error("Error creating inspection:", error);
        res.status(500).json({ error: "Failed to create inspection request" });
    }
}));
// Get tenant's inspections
router.get("/tenant/:tenantCognitoId", (0, authMiddleware_1.authMiddleware)(["tenant"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantCognitoId } = req.params;
        const inspections = yield prisma.inspection.findMany({
            where: { tenantCognitoId },
            include: {
                property: {
                    include: {
                        location: true
                    }
                },
                agent: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(inspections);
    }
    catch (error) {
        console.error("Error fetching tenant inspections:", error);
        res.status(500).json({ error: "Failed to fetch inspections" });
    }
}));
// Get all inspections (admin)
router.get("/admin", (0, authMiddleware_1.authMiddleware)(["admin"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inspections = yield prisma.inspection.findMany({
            include: {
                property: {
                    include: {
                        location: true,
                        landlord: true
                    }
                },
                tenant: true,
                agent: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(inspections);
    }
    catch (error) {
        console.error("Error fetching admin inspections:", error);
        res.status(500).json({ error: "Failed to fetch inspections" });
    }
}));
// Update inspection status (admin)
router.put("/:id/status", (0, authMiddleware_1.authMiddleware)(["admin", "agent"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const inspection = yield prisma.inspection.update({
            where: { id: parseInt(id) },
            data: {
                status,
                adminNotes,
                updatedAt: new Date()
            },
            include: {
                property: {
                    include: {
                        location: true
                    }
                },
                tenant: true,
                agent: true
            }
        });
        // Send notification emails based on status change
        if (status === 'Approved' && inspection.agent) {
            try {
                yield (0, emailSubscriptionService_1.sendInspectionApprovedEmail)(inspection.tenantEmail, inspection.tenantName, inspection.property.location.address, inspection.scheduledDate.toLocaleDateString(), inspection.preferredTime, inspection.agent.name, inspection.agent.phoneNumber || 'N/A');
                console.log(`Inspection approved email sent to tenant: ${inspection.tenantEmail}`);
            }
            catch (emailError) {
                console.error('Error sending inspection approved email:', emailError);
                // Don't fail the status update if email fails
            }
        }
        res.json(inspection);
    }
    catch (error) {
        console.error("Error updating inspection status:", error);
        res.status(500).json({ error: "Failed to update inspection status" });
    }
}));
// Process deposit payment for unlimited inspections
router.post("/deposit/payment", (0, authMiddleware_1.authMiddleware)(["tenant"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantCognitoId, propertyId, paymentReference, amount } = req.body;
        // Get property price for deposit calculation
        const property = yield prisma.property.findUnique({
            where: { id: propertyId }
        });
        if (!property) {
            res.status(404).json({ error: "Property not found" });
            return;
        }
        const requiredDeposit = property.pricePerYear * 0.4; // 40% deposit
        if (amount < requiredDeposit) {
            res.status(400).json({
                error: "Insufficient deposit amount",
                required: requiredDeposit,
                provided: amount
            });
            return;
        }
        // Update inspection limit to unlimited
        const unlimitedUntil = new Date();
        unlimitedUntil.setFullYear(unlimitedUntil.getFullYear() + 1); // 1 year unlimited
        const inspectionLimit = yield prisma.inspectionLimit.upsert({
            where: { tenantCognitoId },
            update: {
                hasUnlimited: true,
                unlimitedUntil
            },
            create: {
                tenantCognitoId,
                freeInspections: 2,
                usedInspections: 0,
                hasUnlimited: true,
                unlimitedUntil
            }
        });
        res.json({
            success: true,
            inspectionLimit,
            message: "Deposit processed successfully. You now have unlimited inspections for 1 year."
        });
    }
    catch (error) {
        console.error("Error processing deposit payment:", error);
        res.status(500).json({ error: "Failed to process deposit payment" });
    }
}));
exports.default = router;
