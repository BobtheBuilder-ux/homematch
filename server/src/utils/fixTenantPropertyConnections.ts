import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This script fixes the issue where tenants who have paid for properties
 * are not connected to those properties in the database.
 * It finds all leases and ensures the tenant is connected to the property.
 */
export const fixTenantPropertyConnections = async () => {
  try {
    console.log("Starting to fix tenant-property connections...");
    
    // Find all leases where the tenant is not connected to the property
    const leases = await prisma.lease.findMany({
      include: {
        tenant: {
          include: {
            properties: true
          }
        },
        property: true
      }
    });
    
    let fixedCount = 0;
    
    for (const lease of leases) {
      // Check if tenant is already connected to this property
      const isConnected = lease.tenant.properties.some(
        (property) => property.id === lease.propertyId
      );
      
      if (!isConnected) {
        console.log(`Connecting tenant ${lease.tenant.name} to property ${lease.property.name}`);
        
        // Connect tenant to property
        await prisma.property.update({
          where: { id: lease.propertyId },
          data: {
            tenants: {
              connect: { cognitoId: lease.tenantCognitoId }
            }
          }
        });
        
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} tenant-property connections.`);
    return { success: true, fixedCount };
    
  } catch (error: any) {
    console.error("Error fixing tenant-property connections:", error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script if called directly
if (require.main === module) {
  fixTenantPropertyConnections()
    .then((result) => {
      console.log("Script completed:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}