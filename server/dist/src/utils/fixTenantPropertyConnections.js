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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixTenantPropertyConnections = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * This script fixes the issue where tenants who have paid for properties
 * are not connected to those properties in the database.
 * It finds all leases and ensures the tenant is connected to the property.
 */
const fixTenantPropertyConnections = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Starting to fix tenant-property connections...");
        // Find all leases where the tenant is not connected to the property
        const leases = yield prisma.lease.findMany({
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
            const isConnected = lease.tenant.properties.some((property) => property.id === lease.propertyId);
            if (!isConnected) {
                console.log(`Connecting tenant ${lease.tenant.name} to property ${lease.property.name}`);
                // Connect tenant to property
                yield prisma.property.update({
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
    }
    catch (error) {
        console.error("Error fixing tenant-property connections:", error);
        return { success: false, error: error.message };
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.fixTenantPropertyConnections = fixTenantPropertyConnections;
// Run the script if called directly
if (require.main === module) {
    (0, exports.fixTenantPropertyConnections)()
        .then((result) => {
        console.log("Script completed:", result);
        process.exit(0);
    })
        .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
}
