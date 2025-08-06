const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function generateAgentRegistrationCodes() {
  try {
    console.log('🌱 Starting to seed agent registration codes...');

    // Get codes from environment variables
    const agentCodesString = process.env.AGENT_REGISTRATION_CODES;
    if (!agentCodesString) {
      console.log('❌ No AGENT_REGISTRATION_CODES found in .env file');
      return;
    }

    const agentCodes = agentCodesString.split(',').map(code => code.trim());
    const codes = agentCodes.map(code => ({
      code,
      isUsed: false,
      createdAt: new Date(),
    }));

    // Check if codes already exist
    const existingCodes = await prisma.agentRegistrationCode.findMany({
      where: {
        code: {
          in: codes.map(c => c.code)
        }
      }
    });

    if (existingCodes.length > 0) {
      console.log(`⚠️  Found ${existingCodes.length} existing codes. Skipping those...`);
      
      // Filter out existing codes
      const existingCodeStrings = existingCodes.map(c => c.code);
      const newCodes = codes.filter(c => !existingCodeStrings.includes(c.code));
      
      if (newCodes.length === 0) {
        console.log('✅ All codes already exist. No new codes to create.');
        return;
      }
      
      // Create only new codes
      await prisma.agentRegistrationCode.createMany({
        data: newCodes,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${newCodes.length} new agent registration codes!`);
    } else {
      // Create all codes
      await prisma.agentRegistrationCode.createMany({
        data: codes,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${codes.length} agent registration codes!`);
    }

    // Display created codes
    const allCodes = await prisma.agentRegistrationCode.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📋 Current agent registration codes:');
    allCodes.forEach((codeObj, index) => {
      const status = codeObj.isUsed ? '🔴 USED' : '🟢 AVAILABLE';
      console.log(`${index + 1}. ${codeObj.code} - ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding agent registration codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateAgentRegistrationCodes()
    .then(() => {
      console.log('🎉 Agent registration codes seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to seed agent registration codes:', error);
      process.exit(1);
    });
}

module.exports = { generateAgentRegistrationCodes };