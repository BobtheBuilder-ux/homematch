import { Request, Response } from "express";
import { PrismaClient } from "../../node_modules/.prisma/client";

const prisma = new PrismaClient();

export const getAgentLeads = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Mock leads data - in a real app, you'd have a leads table
    const leads = [
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        phoneNumber: "+1 (555) 123-4567",
        status: "new",
        source: "Website",
        createdAt: new Date(),
        property: {
          id: 1,
          name: "Downtown Apartment",
          pricePerMonth: 1500,
        },
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phoneNumber: "+1 (555) 987-6543",
        status: "contacted",
        source: "Referral",
        createdAt: new Date(),
        property: {
          id: 2,
          name: "Beach House",
          pricePerMonth: 2000,
        },
      },
      {
        id: 3,
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        phoneNumber: "+1 (555) 456-7890",
        status: "qualified",
        source: "Social Media",
        createdAt: new Date(),
        property: {
          id: 3,
          name: "City Loft",
          pricePerMonth: 2200,
        },
      },
    ];

    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching leads: ${error.message}` });
  }
};

export const getAgentClients = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get landlords and tenants as clients
    const landlords = await prisma.landlord.findMany({
      include: {
        managedProperties: true,
      },
    });

    const tenants = await prisma.tenant.findMany({
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
        totalValue: landlord.managedProperties.reduce((sum, prop) => sum + prop.pricePerMonth, 0),
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
        totalValue: tenant.properties.reduce((sum, prop) => sum + prop.pricePerMonth, 0),
        lastContact: new Date(),
      })),
    ];

    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching clients: ${error.message}` });
  }
};

export const getAgentTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Mock tasks data - in a real app, you'd have a tasks table
    const tasks = [
      {
        id: 1,
        title: "Follow up with John Doe",
        description: "Call John about the downtown apartment viewing",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        client: { name: "John Doe" },
        notes: "Interested in 2-bedroom apartments",
      },
      {
        id: 2,
        title: "Property inspection",
        description: "Inspect Beach House property for maintenance issues",
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        client: { name: "Jane Smith" },
        notes: "Check plumbing and electrical systems",
      },
      {
        id: 3,
        title: "Contract review",
        description: "Review lease agreement for City Loft",
        priority: "low",
        status: "completed",
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        client: { name: "Mike Johnson" },
        notes: "All terms agreed upon",
      },
    ];

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching tasks: ${error.message}` });
  }
};

export const updateLeadStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    // In a real implementation, you'd update the lead status in the database
    res.json({ message: "Lead status updated successfully", leadId, status });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating lead status: ${error.message}` });
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // In a real implementation, you'd update the task status in the database
    res.json({ message: "Task status updated successfully", taskId, status });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task status: ${error.message}` });
  }
};

export const updateAgentSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    // In a real implementation, you'd have an Agent model
    // For now, we'll just return success
    res.json({ 
      message: "Agent settings updated successfully",
      cognitoId,
      name,
      email,
      phoneNumber,
    });
  } catch (error: any) {
    res.status(500).json({ message: `Error updating agent settings: ${error.message}` });
  }
};