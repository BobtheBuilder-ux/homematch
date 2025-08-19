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
exports.getLandlordProperties = exports.completeLandlordOnboarding = exports.updateLandlord = exports.registerLandlordWithCode = exports.createLandlord = exports.getLandlord = void 0;
const client_1 = require("@prisma/client"); // Added Prisma import
const wkt_1 = require("@terraformer/wkt");
const emailSubscriptionService_1 = require("../utils/emailSubscriptionService");
const prisma = new client_1.PrismaClient();
const getLandlord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const landlord = yield prisma.landlord.findUnique({
            where: { cognitoId },
        });
        if (landlord) {
            res.json(landlord);
        }
        else {
            res.status(404).json({ message: "Landlord not found" });
        }
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving landlord: ${error.message}` });
    }
});
exports.getLandlord = getLandlord;
const createLandlord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId, name, email, phoneNumber } = req.body;
        const landlord = yield prisma.landlord.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
            },
        });
        // Send welcome email and add landlord to email list
        try {
            yield (0, emailSubscriptionService_1.sendLandlordWelcomeEmail)(landlord.email, landlord.name);
            console.log(`Welcome email sent to landlord: ${landlord.email}`);
        }
        catch (emailError) {
            console.error('Error sending landlord welcome email:', emailError);
            // Don't fail the landlord creation if email fails
        }
        try {
            yield (0, emailSubscriptionService_1.addToEmailList)({
                email: landlord.email,
                fullName: landlord.name,
                subscriptionType: 'newsletter'
            });
            console.log(`Added landlord ${landlord.email} to email list`);
        }
        catch (emailError) {
            console.error('Error adding landlord to email list:', emailError);
            // Don't fail the landlord creation if email subscription fails
        }
        res.status(201).json(landlord);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating landlord: ${error.message}` });
    }
});
exports.createLandlord = createLandlord;
const registerLandlordWithCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId, name, email, phoneNumber, registrationCode } = req.body;
        // Find and validate the registration code
        const codeRecord = yield prisma.landlordRegistrationCode.findUnique({
            where: { code: registrationCode },
        });
        if (!codeRecord) {
            res.status(400).json({ message: "Invalid registration code" });
            return;
        }
        if (codeRecord.isUsed) {
            res.status(400).json({ message: "Registration code has already been used" });
            return;
        }
        // Create the landlord and mark the code as used
        const landlord = yield prisma.landlord.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                registrationCodeId: codeRecord.id,
            },
        });
        // Mark the code as used
        yield prisma.landlordRegistrationCode.update({
            where: { id: codeRecord.id },
            data: {
                isUsed: true,
                usedAt: new Date(),
            },
        });
        // Send welcome email and add landlord to email list
        try {
            yield (0, emailSubscriptionService_1.sendLandlordWelcomeEmail)(landlord.email, landlord.name);
            console.log(`Welcome email sent to landlord: ${landlord.email}`);
        }
        catch (emailError) {
            console.error('Error sending landlord welcome email:', emailError);
            // Don't fail the landlord creation if email fails
        }
        try {
            yield (0, emailSubscriptionService_1.addToEmailList)({
                email: landlord.email,
                fullName: landlord.name,
                subscriptionType: 'newsletter'
            });
            console.log(`Added landlord ${landlord.email} to email list`);
        }
        catch (emailError) {
            console.error('Error adding landlord to email list:', emailError);
            // Don't fail the landlord creation if email subscription fails
        }
        res.status(201).json(landlord);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating landlord: ${error.message}` });
    }
});
exports.registerLandlordWithCode = registerLandlordWithCode;
const updateLandlord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const { name, email, phoneNumber } = req.body;
        const updateLandlord = yield prisma.landlord.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });
        res.json(updateLandlord);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating landlord: ${error.message}` });
    }
});
exports.updateLandlord = updateLandlord;
const completeLandlordOnboarding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const { name, email, phoneNumber, dateOfBirth, nationality, occupation, currentAddress, city, state, country, postalCode, bankName, accountNumber, accountName, businessName, businessType, taxId, emergencyContactName, emergencyContactPhone, isOnboardingComplete, onboardedAt, } = req.body;
        const updatedLandlord = yield prisma.landlord.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                nationality,
                occupation,
                currentAddress,
                city,
                state,
                country,
                postalCode,
                bankName,
                accountNumber,
                accountName,
                businessName,
                businessType,
                taxId,
                emergencyContactName,
                emergencyContactPhone,
                isOnboardingComplete: isOnboardingComplete || true,
                onboardedAt: onboardedAt ? new Date(onboardedAt) : new Date(),
                updatedAt: new Date(),
            },
        });
        res.json(updatedLandlord);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error completing landlord onboarding: ${error.message}` });
    }
});
exports.completeLandlordOnboarding = completeLandlordOnboarding;
const getLandlordProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const properties = yield prisma.property.findMany({
            where: {
                landlord: {
                    cognitoId: cognitoId,
                },
            },
            include: {
                location: true,
            },
        });
        const propertiesWithFormattedLocation = yield Promise.all(properties.map((property) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const coordinates = yield prisma.$queryRaw `SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;
            const geoJSON = (0, wkt_1.wktToGeoJSON)(((_a = coordinates[0]) === null || _a === void 0 ? void 0 : _a.coordinates) || "");
            const longitude = geoJSON.coordinates[0];
            const latitude = geoJSON.coordinates[1];
            return Object.assign(Object.assign({}, property), { location: Object.assign(Object.assign({}, property.location), { coordinates: {
                        longitude,
                        latitude,
                    } }) });
        })));
        res.json(propertiesWithFormattedLocation);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: `Error retrieving landlord properties: ${err.message}` });
    }
});
exports.getLandlordProperties = getLandlordProperties;
