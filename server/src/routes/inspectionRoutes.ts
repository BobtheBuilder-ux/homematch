import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { sendInspectionRequestEmail, sendInspectionApprovedEmail } from "../utils/emailSubscriptionService";

const router = express.Router();
const prisma = new PrismaClient();

// Get tenant's inspection limit
router.get("/limit/:tenantCognitoId", authMiddleware(["tenant"]), async (req, res) => {
  try {
    const { tenantCognitoId } = req.params;
    
    let inspectionLimit = await (prisma as any).inspectionLimit.findUnique({
      where: { tenantCognitoId }
    });
    
    if (!inspectionLimit) {
      inspectionLimit = await (prisma as any).inspectionLimit.create({
        data: {
          tenantCognitoId,
          freeInspections: 2,
          usedInspections: 0,
          hasUnlimited: false
        }
      });
    }
    
    res.json(inspectionLimit);
  } catch (error) {
    console.error("Error fetching inspection limit:", error);
    res.status(500).json({ error: "Failed to fetch inspection limit" });
  }
});

// Create inspection request
router.post("/request", authMiddleware(["tenant"]), async (req, res) => {
  try {
    const {
      propertyId,
      tenantCognitoId,
      tenantName,
      tenantEmail,
      tenantPhone,
      preferredTime,
      message,
      depositPaid = false,
      depositAmount,
      paymentReference
    } = req.body;

    // Calculate scheduled date (3 days ahead)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 3);

    // Check inspection limit
    let inspectionLimit = await (prisma as any).inspectionLimit.findUnique({
      where: { tenantCognitoId }
    });

    if (!inspectionLimit) {
      inspectionLimit = await (prisma as any).inspectionLimit.create({
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
    const property = await prisma.property.findUnique({
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
    const nearestAgent = await prisma.agent.findFirst({
      orderBy: { id: 'asc' } // Simplified selection
    });

    // Create inspection
    const inspection = await (prisma as any).inspection.create({
      data: {
        propertyId,
        tenantCognitoId,
        scheduledDate,
        tenantName,
        tenantEmail,
        tenantPhone,
        preferredTime,
        message,
        agentId: nearestAgent?.id,
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
      await (prisma as any).inspectionLimit.update({
        where: { tenantCognitoId },
        data: {
          usedInspections: inspectionLimit.usedInspections + 1
        }
      });
    }

    // Send email notification to tenant about pending request
    try {
      await sendInspectionRequestEmail(
        tenantEmail,
        tenantName,
        property.location.address,
        scheduledDate.toLocaleDateString(),
        preferredTime
      );
      console.log(`Inspection request email sent to tenant: ${tenantEmail}`);
    } catch (emailError) {
      console.error('Error sending inspection request email:', emailError);
      // Don't fail the inspection creation if email fails
    }
    
    res.status(201).json(inspection);
  } catch (error) {
    console.error("Error creating inspection:", error);
    res.status(500).json({ error: "Failed to create inspection request" });
  }
});

// Get tenant's inspections
router.get("/tenant/:tenantCognitoId", authMiddleware(["tenant"]), async (req, res) => {
  try {
    const { tenantCognitoId } = req.params;
    
    const inspections = await (prisma as any).inspection.findMany({
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
  } catch (error) {
    console.error("Error fetching tenant inspections:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// Get all inspections (admin)
router.get("/admin", authMiddleware(["admin"]), async (req, res) => {
  try {
    const inspections = await (prisma as any).inspection.findMany({
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
  } catch (error) {
    console.error("Error fetching admin inspections:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// Update inspection status (admin)
router.put("/:id/status", authMiddleware(["admin", "agent"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    const inspection = await (prisma as any).inspection.update({
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
        await sendInspectionApprovedEmail(
          inspection.tenantEmail,
          inspection.tenantName,
          inspection.property.location.address,
          inspection.scheduledDate.toLocaleDateString(),
          inspection.preferredTime,
          inspection.agent.name,
          inspection.agent.phoneNumber || 'N/A'
        );
        console.log(`Inspection approved email sent to tenant: ${inspection.tenantEmail}`);
      } catch (emailError) {
        console.error('Error sending inspection approved email:', emailError);
        // Don't fail the status update if email fails
      }
    }
    
    res.json(inspection);
  } catch (error) {
    console.error("Error updating inspection status:", error);
    res.status(500).json({ error: "Failed to update inspection status" });
  }
});

// Process deposit payment for unlimited inspections
router.post("/deposit/payment", authMiddleware(["tenant"]), async (req, res) => {
  try {
    const {
      tenantCognitoId,
      propertyId,
      paymentReference,
      amount
    } = req.body;

    // Get property price for deposit calculation
    const property = await prisma.property.findUnique({
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

    const inspectionLimit = await (prisma as any).inspectionLimit.upsert({
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
  } catch (error) {
    console.error("Error processing deposit payment:", error);
    res.status(500).json({ error: "Failed to process deposit payment" });
  }
});

export default router;