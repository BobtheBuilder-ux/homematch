import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

async function insertLocationData(locations: any[]) {
  for (const location of locations) {
    const { id, country, city, state, address, postalCode, coordinates } = location;
    try {
      await prisma.$executeRaw`
        INSERT INTO "Location" ("id", "country", "city", "state", "address", "postalCode", "coordinates") 
        VALUES (${id}, ${country}, ${city}, ${state}, ${address}, ${postalCode}, ST_GeomFromText(${coordinates}, 4326));
      `;
      console.log(`Inserted location for ${city}`);
    } catch (error) {
      console.error(`Error inserting location for ${city}:`, error);
    }
  }
}

async function resetSequence(modelName: string) {
  const quotedModelName = `"${toPascalCase(modelName)}"`;

  const maxIdResult = await (prisma[modelName as keyof PrismaClient] as any).findMany({
    select: { id: true },
    orderBy: { id: "desc" },
    take: 1,
  });

  if (maxIdResult.length === 0) return;

  const nextId = maxIdResult[0].id + 1;
  await prisma.$executeRaw(
    Prisma.raw(`
    SELECT setval(pg_get_serial_sequence('${quotedModelName}', 'id'), coalesce(max(id)+1, ${nextId}), false) FROM ${quotedModelName};
  `)
  );
  console.log(`Reset sequence for ${modelName} to ${nextId}`);
}

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) =>
    toPascalCase(path.basename(fileName, path.extname(fileName)))
  );

  for (const modelName of modelNames.reverse()) {
    const modelNameCamel = toCamelCase(modelName);
    const model = (prisma as any)[modelNameCamel];
    if (!model) {
      console.error(`Model ${modelName} not found in Prisma client`);
      continue;
    }
    try {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelName}`);
    } catch (error) {
      console.error(`Error clearing data from ${modelName}:`, error);
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  // Delete all existing data in reverse dependency order
  const orderedFileNames = [
    "payment.json",
    "lease.json",
    "application.json",
    "property.json",
    "tenant.json",
    "landlord.json",
    "location.json",
  ];

  await deleteAllData(orderedFileNames);

  // Now seed in correct order
  const seedOrder: (string | [string, boolean])[] = [
    "location.json",
    "landlord.json",
    ["tenant.json", true], // [filename, skipConnections]
    "property.json",
    ["tenant.json", false], // Update tenants with connections
    "lease.json",
    "application.json",
    "payment.json",
  ];

  for (const item of seedOrder) {
    const [fileName, skipConnections] = Array.isArray(item) ? item : [item, false];
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = toPascalCase(path.basename(fileName, path.extname(fileName)));
    const modelNameCamel = toCamelCase(modelName);

    if (modelName === "Location") {
      await insertLocationData(jsonData);
    } else {
      const model = (prisma as any)[modelNameCamel];
      try {
        for (const item of jsonData) {
          const { id, ...dataWithoutId } = item;
          let data = { ...dataWithoutId };
          
          // Skip property connections for initial tenant creation
          if (modelName === "Tenant" && skipConnections) {
            delete data.properties;
            delete data.favorites;
          } 
          // Update existing tenants with property connections
          else if (modelName === "Tenant" && !skipConnections) {
            for (const tenant of jsonData) {
              const updateData: any = {};
              
              // Only include properties if they exist
              if (tenant.properties?.connect?.length > 0) {
                updateData.properties = {
                  connect: tenant.properties.connect
                };
              }
              
              // Only include favorites if they exist
              if (tenant.favorites?.connect?.length > 0) {
                updateData.favorites = {
                  connect: tenant.favorites.connect
                };
              }

              // Only update if we have properties or favorites to connect
              if (Object.keys(updateData).length > 0) {
                try {
                  console.log(`Updating tenant ${tenant.cognitoId} with:`, JSON.stringify(updateData, null, 2));
                  await prisma.tenant.update({
                    where: { cognitoId: tenant.cognitoId },
                    data: updateData
                  });
                } catch (error) {
                  console.error(`Error updating tenant ${tenant.cognitoId}:`, error);
                }
              }
            }
            continue; // Skip normal creation since we're just updating
          }
          // Handle other model relationships
          else if (modelName === "Property") {
            data = {
              ...data,
              location: { connect: { id: item.locationId } },
              landlord: { connect: { cognitoId: item.managerCognitoId } }
            };
            delete data.locationId;
            delete data.managerCognitoId;
          } else if (modelName === "Lease") {
            data = {
              ...data,
              property: { connect: { id: item.propertyId } },
              tenant: { connect: { cognitoId: item.tenantCognitoId } }
            };
            delete data.propertyId;
            delete data.tenantCognitoId;
          } else if (modelName === "Application") {
            data = {
              ...data,
              applicationDate: new Date(item.applicationDate),
              preferredMoveInDate: item.preferredMoveInDate ? new Date(item.preferredMoveInDate) : undefined,
              dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : undefined,
              property: { connect: { id: item.propertyId } },
              tenant: { connect: { cognitoId: item.tenantCognitoId } }
            };
            delete data.propertyId;
            delete data.tenantCognitoId;
            if (item.leaseId) {
              data.lease = { connect: { id: item.leaseId } };
              delete data.leaseId;
            }
          } else if (modelName === "Payment") {
            if (item.leaseId) {
              data.lease = { connect: { id: item.leaseId } };
              delete data.leaseId;
            }
          }

          if (!skipConnections) {
            console.log(`Creating ${modelName}:`, JSON.stringify(data, null, 2));
            await model.create({ data });
          } else {
            // For initial tenant creation without connections
            const createData = {
              cognitoId: data.cognitoId,
              name: data.name,
              email: data.email,
              phoneNumber: data.phoneNumber
            };
            console.log(`Creating ${modelName} (without connections):`, JSON.stringify(createData, null, 2));
            await model.create({ data: createData });
          }
        }
        console.log(`Seeded ${modelName} with data from ${fileName}`);
      } catch (error) {
        console.error(`Error seeding data for ${modelName}:`, error);
      }
    }

    if (!Array.isArray(item) || !skipConnections) {
      // Only reset sequence when we're not in the middle of a two-phase operation
      await resetSequence(modelNameCamel);
      await sleep(1000);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
