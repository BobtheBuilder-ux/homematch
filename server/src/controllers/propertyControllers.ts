import { Request, Response } from "express";
import { PrismaClient, Prisma, Location } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { uploadMultipleFilesToS3, uploadFileToS3 } from "../utils/s3Service";
import axios from "axios";

const prisma = new PrismaClient();

// S3 client moved to s3Service utility

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
      name,
      location,
    } = req.query;

    let whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerYear" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerYear" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyType && propertyType !== "any") {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }
    
    // Search by property name (only if no location coordinates are provided)
    if (name && !latitude && !longitude) {
      whereConditions.push(
        Prisma.sql`p.name ILIKE ${`%${name}%`}`
      );
    }
    
    // Search by location text (only if no coordinates are provided)
    if (location && !latitude && !longitude) {
      whereConditions.push(
        Prisma.sql`(
          l.city ILIKE ${`%${location}%`} OR
          l.state ILIKE ${`%${location}%`} OR
          l.country ILIKE ${`%${location}%`} OR
          l.address ILIKE ${`%${location}%`}
        )`
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = (amenities as string).split(",");
      const amenityConditions = amenitiesArray.map(amenity => 
        Prisma.sql`p.amenities ILIKE ${`%${amenity.trim()}%`}`
      );
      if (amenityConditions.length > 0) {
        whereConditions.push(Prisma.sql`(${Prisma.join(amenityConditions, ' OR ')})`);
      }
    }

    if (availableFrom && availableFrom !== "any") {
      const availableFromDate =
        typeof availableFrom === "string" ? availableFrom : null;
      if (availableFromDate) {
        const date = new Date(availableFromDate);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`
          );
        }
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusInKilometers = 1000;
      const degrees = radiusInKilometers / 111; // Converts kilometers to degrees

      whereConditions.push(
        Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`
      );
    }

    // Only show properties with 'Available' status (admin approved)
    whereConditions.push(
      Prisma.sql`p.status = 'Available'`
    );

    const completeQuery = Prisma.sql`
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
      WHERE ${Prisma.join(whereConditions, " AND ")}
    `;

    const properties = await prisma.$queryRaw(completeQuery);

    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        location: true,
      },
    });

    if (property) {
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };
      res.json(propertyWithCoordinates);
    }
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property: ${err.message}` });
  }
};

export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('Creating property with data:', req.body);
    console.log('Files received:', req.files);
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const {
      address,
      city,
      state,
      country,
      postalCode,
      landlordCognitoId,
      ...propertyData
    } = req.body;

    // Upload property photos to S3
    let photoUrls: string[] = [];
    if (files?.photos && files.photos.length > 0) {
      try {
        const fileData = files.photos.map(file => ({
          buffer: file.buffer,
          filename: file.originalname,
          mimetype: file.mimetype,
        }));
        
        const uploadResults = await uploadMultipleFilesToS3(fileData, 'properties/photos');
        photoUrls = uploadResults.map(result => result.url);
        console.log(`Successfully uploaded ${photoUrls.length} property photos`);
      } catch (uploadError) {
        console.error('Error uploading property photos:', uploadError);
        // Continue with property creation even if photo upload fails
        photoUrls = [];
      }
    }

    // Upload property video to S3 (optional)
    let videoUrl: string | null = null;
    if (files?.video && files.video.length > 0) {
      try {
        const videoFile = files.video[0];
        const uploadResult = await uploadFileToS3(
          videoFile.buffer,
          videoFile.originalname,
          videoFile.mimetype,
          'properties/videos'
        );
        videoUrl = uploadResult.url;
        console.log('Successfully uploaded property video');
      } catch (uploadError) {
        console.error('Error uploading property video:', uploadError);
        // Continue with property creation even if video upload fails
        videoUrl = null;
      }
    }

    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: address,
        city,
        country,
        postalcode: postalCode,
        format: "json",
        limit: "1",
      }
    ).toString()}`;
    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        "User-Agent": "RealEstateApp (justsomedummyemail@gmail.com",
      },
    });
    const [longitude, latitude] =
      geocodingResponse.data && geocodingResponse.data.length > 0 && geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0]?.lon),
            parseFloat(geocodingResponse.data[0]?.lat),
          ]
        : [0, 0];

    // create location
    const [location] = await prisma.$queryRaw<Location[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    // create property
    const newProperty = await prisma.property.create({
      data: {
        ...propertyData,
        photoUrls,
        videoUrl,
        locationId: location.id,
        landlordCognitoId,
        status: 'PendingApproval', // New properties require admin approval
        amenities:
          typeof propertyData.amenities === "string"
            ? propertyData.amenities
            : Array.isArray(propertyData.amenities)
            ? propertyData.amenities.join(", ")
            : null,

        isParkingIncluded: propertyData.isParkingIncluded === "true",
        pricePerYear: parseFloat(propertyData.pricePerYear),
        securityDeposit: parseFloat(propertyData.pricePerYear) * 0.15, // 15% caution fee
        applicationFee: parseFloat(propertyData.pricePerYear) * 0.10, // 10% application fee
        beds: parseInt(propertyData.beds),
        baths: parseFloat(propertyData.baths),
        squareFeet: parseInt(propertyData.squareFeet),
      },
      include: {
        location: true,
        landlord: true,
      },
    });

    res.status(201).json(newProperty);
  } catch (err: any) {
    console.error('Error creating property:', err);
    res
      .status(500)
      .json({ message: `Error creating property: ${err.message}` });
  }
};
