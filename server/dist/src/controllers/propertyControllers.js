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
const queryOptimizationService_1 = require("../services/queryOptimizationService");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// S3 client moved to s3Service utility
const getProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryOptimizer = new queryOptimizationService_1.QueryOptimizationService(prisma);
        const filters = {
            favoriteIds: req.query.favoriteIds,
            priceMin: req.query.priceMin,
            priceMax: req.query.priceMax,
            beds: req.query.beds,
            baths: req.query.baths,
            propertyType: req.query.propertyType,
            squareFeetMin: req.query.squareFeetMin,
            squareFeetMax: req.query.squareFeetMax,
            amenities: req.query.amenities,
            availableFrom: req.query.availableFrom,
            latitude: req.query.latitude,
            longitude: req.query.longitude,
            name: req.query.name,
            location: req.query.location,
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        // Use the optimized query service
        const result = yield queryOptimizer.getOptimizedProperties(filters);
        res.json(result);
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
        const queryOptimizer = new queryOptimizationService_1.QueryOptimizationService(prisma);
        const property = yield queryOptimizer.getOptimizedProperty(Number(id));
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
