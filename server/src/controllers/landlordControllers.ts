import { Request, Response } from "express";
import { PrismaClient, Prisma } from "../../node_modules/.prisma/client"; // Added Prisma import
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma = new PrismaClient();

// Define a type for Property with its included relations
type PropertyWithLocation = Prisma.PropertyGetPayload<{
  include: { location: true };
}>;

export const getLandlord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const landlord = await prisma.landlord.findUnique({
      where: { cognitoId },
    });

    if (landlord) {
      res.json(landlord);
    } else {
      res.status(404).json({ message: "Landlord not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving landlord: ${error.message}` });
  }
};

export const createLandlord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, name, email, phoneNumber } = req.body;

    const landlord = await prisma.landlord.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
      },
    });

    res.status(201).json(landlord);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating landlord: ${error.message}` });
  }
};

export const updateLandlord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    const updateLandlord = await prisma.landlord.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updateLandlord);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating landlord: ${error.message}` });
  }
};

export const getLandlordProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const properties: PropertyWithLocation[] = await prisma.property.findMany({
      where: {
        landlord: {
          cognitoId: cognitoId,
        },
      },
      include: {
        location: true,
      },
    });

    const propertiesWithFormattedLocation = await Promise.all(
      properties.map(async (property) => {
        const coordinates: { coordinates: string }[] =
          await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

        const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
        const longitude = geoJSON.coordinates[0];
        const latitude = geoJSON.coordinates[1];

        return {
          ...property,
          location: {
            ...property.location,
            coordinates: {
              longitude,
              latitude,
            },
          },
        };
      })
    );

    res.json(propertiesWithFormattedLocation);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving landlord properties: ${err.message}` });
  }
};
