import { Request, Response } from "express";
import { PrismaClient, Prisma, Location } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { uploadMultipleFilesToS3, uploadFileToS3 } from "../utils/s3Service";
import { QueryOptimizationService, PropertyFilters } from '../services/queryOptimizationService';
import axios from "axios";

const prisma = new PrismaClient();

// S3 client moved to s3Service utility

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryOptimizer = new QueryOptimizationService(prisma);
    const filters: PropertyFilters = {
      favoriteIds: req.query.favoriteIds as string,
      priceMin: req.query.priceMin as string,
      priceMax: req.query.priceMax as string,
      beds: req.query.beds as string,
      baths: req.query.baths as string,
      propertyType: req.query.propertyType as string,
      squareFeetMin: req.query.squareFeetMin as string,
      squareFeetMax: req.query.squareFeetMax as string,
      amenities: req.query.amenities as string,
      availableFrom: req.query.availableFrom as string,
      latitude: req.query.latitude as string,
      longitude: req.query.longitude as string,
      name: req.query.name as string,
      location: req.query.location as string,
      page: req.query.page as string,
      limit: req.query.limit as string,
      sortBy: req.query.sortBy as 'price' | 'date' | 'beds' | 'baths' | 'squareFeet',
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    // Use the optimized query service
    const result = await queryOptimizer.getOptimizedProperties(filters);
     
    res.json(result);
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
    const queryOptimizer = new QueryOptimizationService(prisma);
    const property = await queryOptimizer.getOptimizedProperty(Number(id));

    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    res.json(property);
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
