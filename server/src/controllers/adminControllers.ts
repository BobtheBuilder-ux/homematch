import { Request, Response } from "express";
import { PrismaClient } from "../../node_modules/.prisma/client";

const prisma = new PrismaClient();

export const getAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get total counts
    const totalProperties = await prisma.property.count();
    const totalUsers = await prisma.tenant.count() + await prisma.landlord.count();
    const totalApplications = await prisma.application.count();
    
    // Calculate revenue from payments
    const payments = await prisma.payment.findMany({
      where: { paymentStatus: "Paid" },
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

    // Get monthly revenue data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: sixMonthsAgo },
        paymentStatus: "Paid",
      },
      include: { lease: true },
    });

    const monthlyRevenue = monthlyPayments.reduce((acc: any[], payment) => {
      const month = payment.paymentDate.toISOString().slice(0, 7);
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.revenue += payment.amountPaid;
      } else {
        acc.push({ month, revenue: payment.amountPaid });
      }
      return acc;
    }, []);

    // Get property types distribution
    const propertyTypes = await prisma.property.groupBy({
      by: ['propertyType'],
      _count: { propertyType: true },
    });

    const propertyTypesData = propertyTypes.map(type => ({
      name: type.propertyType,
      count: type._count.propertyType,
    }));

    // Get applications by status
    const applicationsByStatus = await prisma.application.groupBy({
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
      propertiesGrowth: 12, // Mock data - you can calculate actual growth
      usersGrowth: 8,
      applicationsGrowth: 15,
      revenueGrowth: 22,
      monthlyRevenue,
      propertyTypes: propertyTypesData,
      applicationsByStatus: applicationsData,
    };

    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching analytics: ${error.message}` });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });

    const landlords = await prisma.landlord.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });

    const users = [
      ...tenants.map(tenant => ({ ...tenant, role: 'tenant', status: 'active', createdAt: new Date() })),
      ...landlords.map(landlord => ({ ...landlord, role: 'landlord', status: 'active', createdAt: new Date() })),
    ];

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching users: ${error.message}` });
  }
};

export const getAllProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        location: true,
        landlord: true,
      },
    });

    res.json(properties);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching properties: ${error.message}` });
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Note: In a real implementation, you'd update the user status in your database
    // For now, we'll just return success
    res.json({ message: "User status updated successfully", userId, status });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating user status: ${error.message}` });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if user is a tenant or landlord and delete accordingly
    const tenant = await prisma.tenant.findUnique({ where: { cognitoId: userId } });
    const landlord = await prisma.landlord.findUnique({ where: { cognitoId: userId } });

    if (tenant) {
      await prisma.tenant.delete({ where: { cognitoId: userId } });
    } else if (landlord) {
      await prisma.landlord.delete({ where: { cognitoId: userId } });
    } else {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting user: ${error.message}` });
  }
};

export const updatePropertyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { status } = req.body;

    // Note: You might need to add a status field to your Property model
    // For now, we'll just return success
    res.json({ message: "Property status updated successfully", propertyId, status });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating property status: ${error.message}` });
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;

    await prisma.property.delete({
      where: { id: Number(propertyId) },
    });

    res.json({ message: "Property deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting property: ${error.message}` });
  }
};

export const getAdminSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Mock settings data - in a real app, you'd store this in the database
    const settings = {
      siteName: "Rentiful",
      siteDescription: "Find your perfect rental property",
      maintenanceMode: false,
      allowRegistration: true,
      maxPropertiesPerLandlord: 50,
      commissionRate: 5,
      emailNotifications: true,
      smsNotifications: false,
    };

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching settings: ${error.message}` });
  }
};

export const updateAdminSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const settings = req.body;
    
    // In a real implementation, you'd save these settings to the database
    res.json({ message: "Settings updated successfully", settings });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating settings: ${error.message}` });
  }
};

import { createUserInCognito } from "../utils/cognitoService";

export const createAgent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, phoneNumber, password, invitationCode } = req.body;

    if (invitationCode !== process.env.AGENT_INVITATION_CODE) {
      res.status(403).json({ message: "Invalid invitation code" });
      return;
    }

    if (!email || !password || !name) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    // Create user in Cognito
    const cognitoUser = await createUserInCognito(email, password);

    if (!cognitoUser) {
      res.status(500).json({ message: "Failed to create user in Cognito" });
      return;
    }

    const agent = await prisma.agent.create({
      data: {
        cognitoId: cognitoUser.Username!,
        name,
        email,
        phoneNumber: phoneNumber || null, // Store as null if not provided
      },
    });

    res.status(201).json(agent);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating agent: ${error.message}` });
  }
};

export const getAllAgents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const agents = await prisma.agent.findMany();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching agents: ${error.message}` });
  }
};
