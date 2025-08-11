import { Request, Response } from "express";
import { PrismaClient } from "../../node_modules/.prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { addToEmailList, sendTenantWelcomeEmail } from "../utils/emailSubscriptionService";

const prisma = new PrismaClient();

export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: {
        favorites: true,
      },
    });

    if (tenant) {
      res.json(tenant);
    } else {
      res.status(404).json({ message: "Tenant not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving tenant: ${error.message}` });
  }
};

export const createTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Creating tenant with request body:", req.body);
    console.log("User object in createTenant:", req.user);

    const { cognitoId, name, email, phoneNumber } = req.body;

    // Skip tenant creation for admin and agent roles
    if (req.user?.skipTenantCreation) {
      console.log("Skipping tenant creation due to skipTenantCreation flag");
      res.status(200).json({ message: "Tenant creation skipped for admin/agent role" });
      return;
    }

    // Additional check: Skip tenant creation if the user's role is admin or agent
    // This is a fallback in case skipTenantCreation flag is not set
    if (req.user?.role && (req.user.role.toLowerCase() === 'admin' || req.user.role.toLowerCase() === 'agent')) {
      console.log("Skipping tenant creation due to user role:", req.user.role);
      res.status(200).json({ message: "Tenant creation skipped for admin/agent role" });
      return;
    }

    console.log("Creating tenant in database with cognitoId:", cognitoId);
    const tenant = await prisma.tenant.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
      },
    });
    console.log("Tenant created in database:", tenant);

    // Send welcome email and add tenant to email list
    try {
      await Promise.all([
        sendTenantWelcomeEmail(tenant.email, tenant.name),
        addToEmailList({
          email: tenant.email,
          fullName: tenant.name,
          subscriptionType: 'newsletter'
        })
      ]);
      console.log(`Welcome email sent and tenant ${tenant.email} added to email list`);
    } catch (emailError) {
      console.error('Error sending welcome email or adding tenant to email list:', emailError);
      // Don't fail the tenant creation if email operations fail
    }

    res.status(201).json(tenant);
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    res
      .status(500)
      .json({ message: `Error creating tenant: ${error.message}` });
  }
};

export const updateTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    const updateTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updateTenant);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating tenant: ${error.message}` });
  }
};

export const getCurrentResidences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const properties = await prisma.property.findMany({
      where: { tenants: { some: { cognitoId } } },
      include: {
        location: true,
      },
    });

    const residencesWithFormattedLocation = await Promise.all(
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

    res.json(residencesWithFormattedLocation);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving landlord properties: ${err.message}` });
  }
};

export const addFavoriteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, propertyId } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: { favorites: true },
    });

    if (!tenant) {
      res.status(404).json({ message: "Tenant not found" });
      return;
    }

    const propertyIdNumber = Number(propertyId);
    const existingFavorites = tenant.favorites || [];

    if (!existingFavorites.some((fav) => fav.id === propertyIdNumber)) {
      const updatedTenant = await prisma.tenant.update({
        where: { cognitoId },
        data: {
          favorites: {
            connect: { id: propertyIdNumber },
          },
        },
        include: { favorites: true },
      });
      res.json(updatedTenant);
    } else {
      res.status(409).json({ message: "Property already added as favorite" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error adding favorite property: ${error.message}` });
  }
};

export const removeFavoriteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, propertyId } = req.params;
    const propertyIdNumber = Number(propertyId);

    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        favorites: {
          disconnect: { id: propertyIdNumber },
        },
      },
      include: { favorites: true },
    });

    res.json(updatedTenant);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error removing favorite property: ${err.message}` });
  }
};
