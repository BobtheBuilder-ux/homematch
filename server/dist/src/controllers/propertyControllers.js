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
const wkt_1 = require("@terraformer/wkt");
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
});
const getProperties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { favoriteIds, priceMin, priceMax, beds, baths, propertyType, squareFeetMin, squareFeetMax, amenities, availableFrom, latitude, longitude, name, location, } = req.query;
        let whereConditions = [];
        if (favoriteIds) {
            const favoriteIdsArray = favoriteIds.split(",").map(Number);
            whereConditions.push(client_1.Prisma.sql `p.id IN (${client_1.Prisma.join(favoriteIdsArray)})`);
        }
        if (priceMin) {
            whereConditions.push(client_1.Prisma.sql `p."pricePerYear" >= ${Number(priceMin)}`);
        }
        if (priceMax) {
            whereConditions.push(client_1.Prisma.sql `p."pricePerYear" <= ${Number(priceMax)}`);
        }
        if (beds && beds !== "any") {
            whereConditions.push(client_1.Prisma.sql `p.beds >= ${Number(beds)}`);
        }
        if (baths && baths !== "any") {
            whereConditions.push(client_1.Prisma.sql `p.baths >= ${Number(baths)}`);
        }
        if (squareFeetMin) {
            whereConditions.push(client_1.Prisma.sql `p."squareFeet" >= ${Number(squareFeetMin)}`);
        }
        if (squareFeetMax) {
            whereConditions.push(client_1.Prisma.sql `p."squareFeet" <= ${Number(squareFeetMax)}`);
        }
        if (propertyType && propertyType !== "any") {
            whereConditions.push(client_1.Prisma.sql `p."propertyType" = ${propertyType}::"PropertyType"`);
        }
        // Search by property name (only if no location coordinates are provided)
        if (name && !latitude && !longitude) {
            whereConditions.push(client_1.Prisma.sql `p.name ILIKE ${`%${name}%`}`);
        }
        // Search by location text (only if no coordinates are provided)
        if (location && !latitude && !longitude) {
            whereConditions.push(client_1.Prisma.sql `(
          l.city ILIKE ${`%${location}%`} OR
          l.state ILIKE ${`%${location}%`} OR
          l.country ILIKE ${`%${location}%`} OR
          l.address ILIKE ${`%${location}%`}
        )`);
        }
        if (amenities && amenities !== "any") {
            const amenitiesArray = amenities.split(",");
            whereConditions.push(client_1.Prisma.sql `p.amenities @> ${amenitiesArray}`);
        }
        if (availableFrom && availableFrom !== "any") {
            const availableFromDate = typeof availableFrom === "string" ? availableFrom : null;
            if (availableFromDate) {
                const date = new Date(availableFromDate);
                if (!isNaN(date.getTime())) {
                    whereConditions.push(client_1.Prisma.sql `EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`);
                }
            }
        }
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radiusInKilometers = 1000;
            const degrees = radiusInKilometers / 111; // Converts kilometers to degrees
            whereConditions.push(client_1.Prisma.sql `ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`);
        }
        // Always exclude closed properties from search results
        whereConditions.push(client_1.Prisma.sql `p.status != 'Closed'`);
        const completeQuery = client_1.Prisma.sql `
      SELECT 
        p.*,
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      WHERE ${client_1.Prisma.join(whereConditions, " AND ")}
    `;
        const properties = yield prisma.$queryRaw(completeQuery);
        res.json(properties);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving properties: ${error.message}` });
    }
});
exports.getProperties = getProperties;
const getProperty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const property = yield prisma.property.findUnique({
            where: { id: Number(id) },
            include: {
                location: true,
            },
        });
        if (property) {
            const coordinates = yield prisma.$queryRaw `SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;
            const geoJSON = (0, wkt_1.wktToGeoJSON)(((_a = coordinates[0]) === null || _a === void 0 ? void 0 : _a.coordinates) || "");
            const longitude = geoJSON.coordinates[0];
            const latitude = geoJSON.coordinates[1];
            const propertyWithCoordinates = Object.assign(Object.assign({}, property), { location: Object.assign(Object.assign({}, property.location), { coordinates: {
                        longitude,
                        latitude,
                    } }) });
            res.json(propertyWithCoordinates);
        }
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
        // Temporarily disable S3 uploads due to configuration issues
        const photoUrls = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `properties/${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const uploadResult = yield new lib_storage_1.Upload({
                client: s3Client,
                params: uploadParams,
            }).done();
            return uploadResult.Location;
        })));
        // TODO: Fix S3 bucket permissions and configuration
        console.log('S3 uploads temporarily disabled - property will be created without photos');
        if (files && files.length > 0) {
            console.log(`Skipping upload of ${files.length} files due to S3 configuration issues`);
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
            data: Object.assign(Object.assign({}, propertyData), { photoUrls, locationId: location.id, landlordCognitoId, status: 'PendingApproval', amenities: typeof propertyData.amenities === "string"
                    ? propertyData.amenities.split(",")
                    : [], highlights: typeof propertyData.highlights === "string"
                    ? propertyData.highlights.split(",")
                    : [], isPetsAllowed: propertyData.isPetsAllowed === "true", isParkingIncluded: propertyData.isParkingIncluded === "true", pricePerYear: parseFloat(propertyData.pricePerYear), securityDeposit: parseFloat(propertyData.pricePerYear) * 0.15, applicationFee: parseFloat(propertyData.pricePerYear) * 0.10, beds: parseInt(propertyData.beds), baths: parseFloat(propertyData.baths), squareFeet: parseInt(propertyData.squareFeet) }),
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
