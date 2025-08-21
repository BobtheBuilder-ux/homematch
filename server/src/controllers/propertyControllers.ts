import { Request, Response } from "express";
import { PrismaClient, Prisma, Location } from "@prisma/client";
import { uploadMultipleFilesToS3, uploadFileToS3 } from "../utils/s3Service";

import axios from "axios";

const prisma = new PrismaClient();

// S3 client moved to s3Service utility

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};
    
    if (req.query.priceMin) {
      where.price = { ...where.price, gte: parseFloat(req.query.priceMin as string) };
    }
    if (req.query.priceMax) {
      where.price = { ...where.price, lte: parseFloat(req.query.priceMax as string) };
    }
    if (req.query.beds) {
      where.beds = parseInt(req.query.beds as string);
    }
    if (req.query.baths) {
      where.baths = parseInt(req.query.baths as string);
    }
    if (req.query.propertyType) {
      where.propertyType = req.query.propertyType as string;
    }
    if (req.query.name) {
      where.name = { contains: req.query.name as string, mode: 'insensitive' };
    }
    if (req.query.location) {
      where.location = { contains: req.query.location as string, mode: 'insensitive' };
    }

    // Build orderBy clause
    const orderBy: any = {};
    const sortBy = req.query.sortBy as string || 'postedDate';
    const sortOrder = req.query.sortOrder as string || 'desc';
    orderBy[sortBy] = sortOrder;

    const [properties, total] = await Promise.all([
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
