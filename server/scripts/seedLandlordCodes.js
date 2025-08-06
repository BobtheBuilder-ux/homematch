const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function generateLandlordRegistrationCodes() {
  try {
    console.log('🌱 Starting to seed landlord registration codes...');

    // Get codes from environment variables
    const landlordCodesString = process.env.LANDLORD_REGISTRATION_CODES;
    if (!landlordCodesString) {
      console.log('❌ No LANDLORD_REGISTRATION_CODES found in .env file');
      return;
    }

    const landlordCodes = landlordCodesString.split(',').map(code => code.trim());
    const codes = landlordCodes.map(code => ({
      code,
      isUsed: false,
      createdAt: new Date(),
    }));

    // Check if codes already exist
    const existingCodes = await prisma.landlordRegistrationCode.findMany({
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
      await prisma.landlordRegistrationCode.createMany({
        data: newCodes,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${newCodes.length} new landlord registration codes!`);
    } else {
      // Create all codes
      await prisma.landlordRegistrationCode.createMany({
        data: codes,
        skipDuplicates: true,
      });
      
      console.log(`✅ Successfully created ${codes.length} landlord registration codes!`);
    }

    // Display all codes
    const allCodes = await prisma.landlordRegistrationCode.findMany({
      orderBy: { code: 'asc' }
    });
    
    console.log('\n📋 All available landlord registration codes:');
    allCodes.forEach((code, index) => {
      const status = code.isUsed ? '🔴 USED' : '🟢 AVAILABLE';
      console.log(`${index + 1}. ${code.code} - ${status}`);
    });
    
    console.log(`\n📊 Total codes: ${allCodes.length}`);
    console.log(`📊 Available codes: ${allCodes.filter(c => !c.isUsed).length}`);
    console.log(`📊 Used codes: ${allCodes.filter(c => c.isUsed).length}`);
    
  } catch (error) {
    console.error('❌ Error seeding landlord registration codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  generateLandlordRegistrationCodes()
    .then(() => {
      console.log('\n🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { generateLandlordRegistrationCodes };