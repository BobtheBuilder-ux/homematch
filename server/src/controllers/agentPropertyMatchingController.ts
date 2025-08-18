import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Assigns a property to an agent based on location matching
 * If multiple agents match the location, distributes properties equally
 */
export const assignPropertyToAgent = async (
  propertyId: number
): Promise<{ success: boolean; agentId?: number; message: string }> => {
  try {
    // Get the property with its location
    const property = await prisma.property.findUnique({
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
    const allAgents = await prisma.agent.findMany({
      where: {
        address: {
          not: null
        }
      }
    });

    const matchingAgents = allAgents.filter(agent => {
      if (!agent.address) return false;
      
      const agentAddressLower = agent.address.toLowerCase();
      return propertyLocationKeywords.some(keyword => 
        agentAddressLower.includes(keyword)
      );
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
      const agentPropertyCounts = await Promise.all(
        matchingAgents.map(async (agent) => {
          const count = await prisma.agentProperty.count({
            where: { agentId: agent.id }
          });
          return { agent, count };
        })
      );

      // Sort by property count (ascending) to get agent with least properties
      agentPropertyCounts.sort((a, b) => a.count - b.count);
      selectedAgent = agentPropertyCounts[0].agent;
    }

    // Create the agent-property assignment
    await prisma.agentProperty.create({
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

  } catch (error: any) {
    console.error("Error assigning property to agent:", error);
    return {
      success: false,
      message: `Error assigning property: ${error.message}`
    };
  }
};

/**
 * API endpoint to manually assign a property to an agent
 */
export const assignPropertyToAgentEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    const result = await assignPropertyToAgent(Number(propertyId));
    
    if (result.success) {
      res.json({
        message: result.message,
        agentId: result.agentId
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error: any) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

/**
 * Get all properties assigned to a specific agent
 */
export const getAgentProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { agentId } = req.params;
    
    const agentProperties = await prisma.agentProperty.findMany({
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
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching agent properties: ${error.message}` });
  }
};

/**
 * Get the agent assigned to a specific property
 */
export const getPropertyAgent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    const agentProperty = await prisma.agentProperty.findFirst({
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
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching property agent: ${error.message}` });
  }
};