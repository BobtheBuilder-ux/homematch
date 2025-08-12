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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function insertLocationData(locations) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const location of locations) {
            const { id, country, city, state, address, postalCode, coordinates } = location;
            try {
                yield prisma.$executeRaw `
        INSERT INTO "Location" ("id", "country", "city", "state", "address", "postalCode", "coordinates") 
        VALUES (${id}, ${country}, ${city}, ${state}, ${address}, ${postalCode}, ST_GeomFromText(${coordinates}, 4326));
      `;
                console.log(`Inserted location for ${city}`);
            }
            catch (error) {
                console.error(`Error inserting location for ${city}:`, error);
            }
        }
    });
}
function resetSequence(modelName) {
    return __awaiter(this, void 0, void 0, function* () {
        const quotedModelName = `"${toPascalCase(modelName)}"`;
        const maxIdResult = yield prisma[modelName].findMany({
            select: { id: true },
            orderBy: { id: "desc" },
            take: 1,
        });
        if (maxIdResult.length === 0)
            return;
        const nextId = maxIdResult[0].id + 1;
        yield prisma.$executeRaw(client_1.Prisma.raw(`
    SELECT setval(pg_get_serial_sequence('${quotedModelName}', 'id'), coalesce(max(id)+1, ${nextId}), false) FROM ${quotedModelName};
  `));
        console.log(`Reset sequence for ${modelName} to ${nextId}`);
    });
}
function generateLandlordRegistrationCodes() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Generating landlord registration codes...');
        // Delete existing codes
        yield prisma.landlordRegistrationCode.deleteMany({});
        // Generate 20 unique codes
        const codes = [];
        for (let i = 1; i <= 20; i++) {
            codes.push({
                code: `homematch-landlord/${i}`,
                isUsed: false
            });
        }
        // Insert codes into database
        for (const codeData of codes) {
            yield prisma.landlordRegistrationCode.create({
                data: codeData
            });
        }
        console.log('Generated 20 landlord registration codes');
    });
}
function deleteAllData(orderedFileNames) {
    return __awaiter(this, void 0, void 0, function* () {
        const modelNames = orderedFileNames.map((fileName) => toPascalCase(path_1.default.basename(fileName, path_1.default.extname(fileName))));
        for (const modelName of modelNames.reverse()) {
            const modelNameCamel = toCamelCase(modelName);
            const model = prisma[modelNameCamel];
            if (!model) {
                console.error(`Model ${modelName} not found in Prisma client`);
                continue;
            }
            try {
                yield model.deleteMany({});
                console.log(`Cleared data from ${modelName}`);
            }
            catch (error) {
                console.error(`Error clearing data from ${modelName}:`, error);
            }
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const dataDirectory = path_1.default.join(__dirname, "seedData");
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
        yield deleteAllData(orderedFileNames);
        // Generate landlord registration codes
        yield generateLandlordRegistrationCodes();
        // Now seed in correct order
        const seedOrder = [
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
            const filePath = path_1.default.join(dataDirectory, fileName);
            const jsonData = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
            const modelName = toPascalCase(path_1.default.basename(fileName, path_1.default.extname(fileName)));
            const modelNameCamel = toCamelCase(modelName);
            if (modelName === "Location") {
                yield insertLocationData(jsonData);
            }
            else {
                const model = prisma[modelNameCamel];
                try {
                    for (const item of jsonData) {
                        const { id } = item, dataWithoutId = __rest(item, ["id"]);
                        let data = Object.assign({}, dataWithoutId);
                        // Skip property connections for initial tenant creation
                        if (modelName === "Tenant" && skipConnections) {
                            delete data.properties;
                            delete data.favorites;
                        }
                        // Update existing tenants with property connections
                        else if (modelName === "Tenant" && !skipConnections) {
                            for (const tenant of jsonData) {
                                const updateData = {};
                                // Only include properties if they exist
                                if (((_b = (_a = tenant.properties) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                                    updateData.properties = {
                                        connect: tenant.properties.connect
                                    };
                                }
                                // Only include favorites if they exist
                                if (((_d = (_c = tenant.favorites) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                                    updateData.favorites = {
                                        connect: tenant.favorites.connect
                                    };
                                }
                                // Only update if we have properties or favorites to connect
                                if (Object.keys(updateData).length > 0) {
                                    try {
                                        console.log(`Updating tenant ${tenant.cognitoId} with:`, JSON.stringify(updateData, null, 2));
                                        yield prisma.tenant.update({
                                            where: { cognitoId: tenant.cognitoId },
                                            data: updateData
                                        });
                                    }
                                    catch (error) {
                                        console.error(`Error updating tenant ${tenant.cognitoId}:`, error);
                                    }
                                }
                            }
                            continue; // Skip normal creation since we're just updating
                        }
                        // Handle other model relationships
                        else if (modelName === "Property") {
                            data = Object.assign(Object.assign({}, data), { location: { connect: { id: item.locationId } }, landlord: { connect: { cognitoId: item.managerCognitoId } } });
                            delete data.locationId;
                            delete data.managerCognitoId;
                        }
                        else if (modelName === "Lease") {
                            data = Object.assign(Object.assign({}, data), { property: { connect: { id: item.propertyId } }, tenant: { connect: { cognitoId: item.tenantCognitoId } } });
                            delete data.propertyId;
                            delete data.tenantCognitoId;
                        }
                        else if (modelName === "Application") {
                            data = Object.assign(Object.assign({}, data), { applicationDate: new Date(item.applicationDate), preferredMoveInDate: item.preferredMoveInDate ? new Date(item.preferredMoveInDate) : undefined, dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : undefined, property: { connect: { id: item.propertyId } }, tenant: { connect: { cognitoId: item.tenantCognitoId } } });
                            delete data.propertyId;
                            delete data.tenantCognitoId;
                            if (item.leaseId) {
                                data.lease = { connect: { id: item.leaseId } };
                                delete data.leaseId;
                            }
                        }
                        else if (modelName === "Payment") {
                            if (item.leaseId) {
                                data.lease = { connect: { id: item.leaseId } };
                                delete data.leaseId;
                            }
                        }
                        if (!skipConnections) {
                            console.log(`Creating ${modelName}:`, JSON.stringify(data, null, 2));
                            yield model.create({ data });
                        }
                        else {
                            // For initial tenant creation without connections
                            const createData = {
                                cognitoId: data.cognitoId,
                                name: data.name,
                                email: data.email,
                                phoneNumber: data.phoneNumber
                            };
                            console.log(`Creating ${modelName} (without connections):`, JSON.stringify(createData, null, 2));
                            yield model.create({ data: createData });
                        }
                    }
                    console.log(`Seeded ${modelName} with data from ${fileName}`);
                }
                catch (error) {
                    console.error(`Error seeding data for ${modelName}:`, error);
                }
            }
            if (!Array.isArray(item) || !skipConnections) {
                // Only reset sequence when we're not in the middle of a two-phase operation
                yield resetSequence(modelNameCamel);
                yield sleep(1000);
            }
        }
    });
}
main()
    .catch((e) => console.error(e))
    .finally(() => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.$disconnect(); }));
