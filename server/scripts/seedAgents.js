const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedAgents() {
  try {
    console.log('🌱 Starting to seed agents...');

    const agents = [
      {
        cognitoId: 'agent-001-cognito-id',
        name: 'John Smith',
        email: 'john.smith@homematch.com',
        phoneNumber: '+1-555-0101'
      },
      {
        cognitoId: 'agent-002-cognito-id',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@homematch.com',
        phoneNumber: '+1-555-0102'
      },
      {
        cognitoId: 'agent-003-cognito-id',
        name: 'Michael Brown',
        email: 'michael.brown@homematch.com',
        phoneNumber: '+1-555-0103'
      },
      {
        cognitoId: 'agent-004-cognito-id',
        name: 'Emily Davis',
        email: 'emily.davis@homematch.com',
        phoneNumber: '+1-555-0104'
      },
      {
        cognitoId: 'agent-005-cognito-id',
        name: 'David Wilson',
        email: 'david.wilson@homematch.com',
        phoneNumber: '+1-555-0105'
      }
    ];

    // Check if agents already exist
    const existingAgents = await prisma.agent.findMany({
      where: {
        email: {
          in: agents.map(agent => agent.email)
        }
      }
    });

    if (existingAgents.length > 0) {
      console.log(`⚠️  Found ${existingAgents.length} existing agents. Skipping those...`);
      
      // Filter out existing agents
      const existingEmails = existingAgents.map(agent => agent.email);
      const newAgents = agents.filter(agent => !existingEmails.includes(agent.email));
      
      if (newAgents.length === 0) {
        console.log('✅ All agents already exist. No new agents to create.');
        return;
      }
      
      // Create only new agents
      await prisma.agent.createMany({
        data: newAgents,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${newAgents.length} new agents!`);
    } else {
      // Create all agents
      await prisma.agent.createMany({
        data: agents,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${agents.length} agents!`);
    }

    // Display current agents
    const allAgents = await prisma.agent.findMany({
      orderBy: { id: 'desc' }
    });
    
    console.log('\n📋 Current agents:');
    allAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name} - ${agent.email} - ${agent.phoneNumber}`);
    });
    
    console.log('🎉 Agent seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding agents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Export the function for use in other scripts
module.exports = { seedAgents };

// Run the function if this script is executed directly
if (require.main === module) {
  seedAgents();
}