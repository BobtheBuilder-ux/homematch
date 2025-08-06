import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAgentLeads = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Return empty array - no demo content
    const leads: any[] = [];

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
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching clients: ${error.message}` });
  }
};

export const getAgentTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const agentCognitoId = req.user?.id;
    
    if (!agentCognitoId) {
      res.status(401).json({ message: 'Agent authentication required' });
      return;
    }
    
    // Find the agent by cognitoId
    const agent = await prisma.agent.findUnique({
      where: { cognitoId: agentCognitoId }
    });
    
    if (!agent) {
      res.status(404).json({ message: 'Agent not found' });
      return;
    }
    
    const { status, priority } = req.query;
    
    let whereClause: any = {
      agentId: agent.id
    };
    
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }
    
    if (priority && typeof priority === 'string') {
      whereClause.priority = priority;
    }
    
    const tasks = await prisma.task.findMany({
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
    const { status, description } = req.body;
    const agentCognitoId = req.user?.id;
    
    if (!agentCognitoId) {
      res.status(401).json({ message: 'Agent authentication required' });
      return;
    }
    
    // Find the agent by cognitoId
    const agent = await prisma.agent.findUnique({
      where: { cognitoId: agentCognitoId }
    });
    
    if (!agent) {
      res.status(404).json({ message: 'Agent not found' });
      return;
    }
    
    // Check if the task exists and belongs to this agent
    const existingTask = await prisma.task.findFirst({
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
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        ...(status && { status }),
        ...(description && { description })
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

    res.json(updatedTask);
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