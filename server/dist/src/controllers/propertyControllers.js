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
exports.createProperty = exports.getProperty = exports.getProperties = void 0;
const client_1 = require("@prisma/client");
const s3Service_1 = require("../utils/s3Service");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// S3 client moved to s3Service utility
const getProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build where clause based on filters
        const where = {};
        if (req.query.priceMin) {
            where.price = Object.assign(Object.assign({}, where.price), { gte: parseFloat(req.query.priceMin) });
        }
        if (req.query.priceMax) {
            where.price = Object.assign(Object.assign({}, where.price), { lte: parseFloat(req.query.priceMax) });
        }
        if (req.query.beds) {
            where.beds = parseInt(req.query.beds);
        }
        if (req.query.baths) {
            where.baths = parseInt(req.query.baths);
        }
        if (req.query.propertyType) {
            where.propertyType = req.query.propertyType;
        }
        if (req.query.name) {
            where.name = { contains: req.query.name, mode: 'insensitive' };
        }
        if (req.query.location) {
            where.location = { contains: req.query.location, mode: 'insensitive' };
        }
        // Build orderBy clause
        const orderBy = {};
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        orderBy[sortBy] = sortOrder;
        const [properties, total] = yield Promise.all([
            prisma.property.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    landlord: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phoneNumber: true
                        }
                    }
                }
            }),
            prisma.property.count({ where })
        ]);
        res.json({
            properties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving properties: ${error.message}` });
    }
});
exports.getProperties = getProperties;
const getProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const property = yield prisma.property.findUnique({
            where: { id: Number(id) },
            include: {
                landlord: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true
                    }
                },
                location: true
            }
        });
        if (!property) {
            res.status(404).json({ error: 'Property not found' });
            return;
        }
        res.json(property);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: `Error retrieving property: ${err.message}` });
    }
});
exports.getProperty = getProperty;
const createProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        console.log('Creating property with data:', req.body);
        console.log('Files received:', req.files);
        const files = req.files;
        const _e = req.body, { address, city, state, country, postalCode, landlordCognitoId } = _e, propertyData = __rest(_e, ["address", "city", "state", "country", "postalCode", "landlordCognitoId"]);
        // Upload property photos to S3
        let photoUrls = [];
        if ((files === null || files === void 0 ? void 0 : files.photos) && files.photos.length > 0) {
            try {
                const fileData = files.photos.map(file => ({
                    buffer: file.buffer,
                    filename: file.originalname,
                    mimetype: file.mimetype,
                }));
                const uploadResults = yield (0, s3Service_1.uploadMultipleFilesToS3)(fileData, 'properties/photos');
                photoUrls = uploadResults.map(result => result.url);
                console.log(`Successfully uploaded ${photoUrls.length} property photos`);
            }
            catch (uploadError) {
                console.error('Error uploading property photos:', uploadError);
                // Continue with property creation even if photo upload fails
                photoUrls = [];
            }
        }
        // Upload property video to S3 (optional)
        let videoUrl = null;
        if ((files === null || files === void 0 ? void 0 : files.video) && files.video.length > 0) {
            try {
                const videoFile = files.video[0];
                const uploadResult = yield (0, s3Service_1.uploadFileToS3)(videoFile.buffer, videoFile.originalname, videoFile.mimetype, 'properties/videos');
                videoUrl = uploadResult.url;
                console.log('Successfully uploaded property video');
            }
            catch (uploadError) {
                console.error('Error uploading property video:', uploadError);
                // Continue with property creation even if video upload fails
                videoUrl = null;
            }
        }
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
            street: address,
            city,
            country,
            postalcode: postalCode,
            format: "json",
            limit: "1",
        }).toString()}`;
        const geocodingResponse = yield axios_1.default.get(geocodingUrl, {
            headers: {
                "User-Agent": "RealEstateApp (justsomedummyemail@gmail.com",
            },
        });
        const [longitude, latitude] = geocodingResponse.data && geocodingResponse.data.length > 0 && ((_a = geocodingResponse.data[0]) === null || _a === void 0 ? void 0 : _a.lon) && ((_b = geocodingResponse.data[0]) === null || _b === void 0 ? void 0 : _b.lat)
            ? [
                parseFloat((_c = geocodingResponse.data[0]) === null || _c === void 0 ? void 0 : _c.lon),
                parseFloat((_d = geocodingResponse.data[0]) === null || _d === void 0 ? void 0 : _d.lat),
            ]
            : [0, 0];
        // create location
        const [location] = yield prisma.$queryRaw `
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;
        // create property
        const newProperty = yield prisma.property.create({
            data: Object.assign(Object.assign({}, propertyData), { photoUrls,
                videoUrl, locationId: location.id, landlordCognitoId, status: 'PendingApproval', amenities: typeof propertyData.amenities === "string"
                    ? propertyData.amenities
                    : Array.isArray(propertyData.amenities)
                        ? propertyData.amenities.join(", ")
                        : null, isParkingIncluded: propertyData.isParkingIncluded === "true", pricePerYear: parseFloat(propertyData.pricePerYear), securityDeposit: parseFloat(propertyData.pricePerYear) * 0.15, applicationFee: parseFloat(propertyData.pricePerYear) * 0.10, beds: parseInt(propertyData.beds), baths: parseFloat(propertyData.baths), squareFeet: parseInt(propertyData.squareFeet) }),
            include: {
                location: true,
                landlord: true,
            },
        });
        res.status(201).json(newProperty);
    }
    catch (err) {
        console.error('Error creating property:', err);
        res
            .status(500)
            .json({ message: `Error creating property: ${err.message}` });
    }
});
exports.createProperty = createProperty;
