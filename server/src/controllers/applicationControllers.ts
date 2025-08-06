import { Request, Response } from "express";
import { PrismaClient, Prisma } from "../../node_modules/.prisma/client";
import { sendEmail } from "../utils/emailService";

const prisma = new PrismaClient();

export const listApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, userType } = req.query;

    let whereClause = {};

    if (userId && userType) {
      if (userType === "tenant") {
        whereClause = { tenantCognitoId: String(userId) };
      } else if (userType === "landlord") {
        // Landlords can only view applications, not approve/deny them
        whereClause = {
          property: {
            landlordCognitoId: String(userId),
          },
        };
      }
      // Only admins can approve/deny applications
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            location: true,
            landlord: true,
          },
        },
        tenant: true,
        lease: true,
      },
      orderBy: {
        applicationDate: 'desc',
      },
    });

    function calculateNextPaymentDate(startDate: Date): Date {
      const today = new Date();
      const nextPaymentDate = new Date(startDate);
      while (nextPaymentDate <= today) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      return nextPaymentDate;
    }

    const formattedApplications = applications.map((app) => ({
      ...app,
      property: {
        ...app.property,
        address: app.property.location.address,
      },
      landlord: app.property.landlord,
      lease: app.lease
        ? {
            ...app.lease,
            nextPaymentDate: calculateNextPaymentDate(app.lease.startDate),
          }
        : null,
    }));

    res.json(formattedApplications);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving applications: ${error.message}` });
  }
};

export const createApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      applicationDate,
      status,
      propertyId,
      tenantCognitoId,
      name,
      email,
      phoneNumber,
      preferredMoveInDate,
      desiredLeaseDuration,
      gender,
      dateOfBirth,
      nationality,
      maritalStatus,
      idType,
      idDocumentUrl,
      durationAtCurrentAddress,
      employmentStatus,
      occupation,
      employerName,
      workAddress,
      monthlyIncome,
      durationAtCurrentJob,
      incomeProofUrl,
      previousEmployerName,
      previousJobTitle,
      previousEmploymentDuration,
      reasonForLeavingPrevJob,
      numberOfOccupants,
      relationshipToOccupants,
      hasPets,
      isSmoker,
      accessibilityNeeds,
      reasonForLeaving,
      consentToInformation,
      consentToVerification,
      consentToTenancyTerms,
      consentToPrivacyPolicy,
    } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        landlord: true,
        location: true
      }
    });

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    const newApplication = await prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // Create lease first
      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          rent: property.pricePerYear,
          deposit: property.securityDeposit,
          property: {
            connect: { id: propertyId },
          },
          tenant: {
            connect: { cognitoId: tenantCognitoId },
          },
        },
      });

      // Create application
      const application = await prisma.application.create({
        data: {
          applicationDate: new Date(applicationDate),
          status,
          name,
          email,
          phoneNumber,
          preferredMoveInDate: preferredMoveInDate ? new Date(preferredMoveInDate) : null,
          desiredLeaseDuration,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          nationality,
          maritalStatus,
          idType,
          idDocumentUrl,
          durationAtCurrentAddress,
          employmentStatus,
          occupation,
          employerName,
          workAddress,
          monthlyIncome,
          durationAtCurrentJob,
          incomeProofUrl,
          previousEmployerName,
          previousJobTitle,
          previousEmploymentDuration,
          reasonForLeavingPrevJob,
          numberOfOccupants,
          relationshipToOccupants,
          hasPets,
          isSmoker,
          accessibilityNeeds,
          reasonForLeaving,
          consentToInformation,
          consentToVerification,
          consentToTenancyTerms,
          consentToPrivacyPolicy,
          property: {
            connect: { id: propertyId },
          },
          tenant: {
            connect: { cognitoId: tenantCognitoId },
          },
          lease: {
            connect: { id: lease.id },
          },
        },
        include: {
          property: {
            include: {
              location: true,
              landlord: true,
            },
          },
          tenant: true,
          lease: true,
        },
      });

      // Send email to tenant
      await sendEmail({
        to: email,
        subject: "Application Received - Property Rental",
        body: `
          <h2>Your Application Has Been Received</h2>
          <p>Dear ${name},</p>
          <p>Your application for the property at ${property.location.address} has been received and is being processed.</p>
          <p>Application Details:</p>
          <ul>
            <li>Property: ${property.location.address}</li>
            <li>Annual Rent: $${property.pricePerYear}</li>
            <li>Security Deposit: $${property.securityDeposit}</li>
            <li>Application Date: ${new Date(applicationDate).toLocaleDateString()}</li>
          </ul>
          <p>We will notify you once the landlord has reviewed your application.</p>
          <p>Thank you for choosing our platform!</p>
        `
      });

      // Send email to landlord
      if (property.landlord?.email) {
        await sendEmail({
          to: property.landlord.email,
          subject: "New Rental Application Received",
          body: `
            <h2>New Application Received</h2>
            <p>A new application has been submitted for your property at ${property.location.address}.</p>
            <p>Applicant Details:</p>
            <ul>
              <li>Name: ${name}</li>
              <li>Email: ${email}</li>
              <li>Application Date: ${new Date(applicationDate).toLocaleDateString()}</li>
            </ul>
            <p>Please log in to your dashboard to review the application.</p>
          `
        });
      }

      return application;
    });

    res.status(201).json(newApplication);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating application: ${error.message}` });
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, userType } = req.body;
    
    // Only admins can update application status
    if (userType !== 'admin') {
      res.status(403).json({ message: "Only administrators can approve or deny applications." });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: {
          include: {
            location: true
          }
        },
        tenant: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found." });
      return;
    }

    if (status === "Approved") {
      const newLease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          rent: application.property.pricePerYear,
          deposit: application.property.securityDeposit,
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
        },
      });

      await prisma.property.update({
        where: { id: application.propertyId },
        data: {
          tenants: {
            connect: { cognitoId: application.tenantCognitoId },
          },
        },
      });

      await prisma.application.update({
        where: { id: Number(id) },
        data: { status, leaseId: newLease.id },
      });

      // Send approval email to tenant
      await sendEmail({
        to: application.tenant.email,
        subject: "Your Rental Application Has Been Approved!",
        body: `
          <h2>Congratulations! Your Application Has Been Approved</h2>
          <p>Dear ${application.tenant.name},</p>
          <p>We're pleased to inform you that your application for ${application.property.location.address} has been approved!</p>
          <p>Next Steps:</p>
          <ul>
            <li>Please log in to your dashboard to review and sign the lease agreement</li>
            <li>Complete the security deposit payment of $${application.property.securityDeposit}</li>
            <li>Set up your annual rent payments of $${application.property.pricePerYear}</li>
          </ul>
          <p>Your lease will begin on ${new Date().toLocaleDateString()}.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        `
      });
    } else if (status === "Denied") {
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status },
      });

      // Send denial email to tenant
      await sendEmail({
        to: application.tenant.email,
        subject: "Update on Your Rental Application",
        body: `
          <h2>Application Status Update</h2>
          <p>Dear ${application.tenant.name},</p>
          <p>We regret to inform you that your application for ${application.property.location.address} has not been approved at this time.</p>
          <p>You can continue browsing other available properties on our platform that might better suit your needs.</p>
          <p>Thank you for your interest in our properties.</p>
        `
      });
    }

    const updatedApplication = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: true,
        tenant: true,
        lease: true,
      },
    });

    res.json(updatedApplication);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating application status: ${error.message}` });
  }
};

export const getApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        property: {
          include: {
            location: true,
            landlord: true,
          },
        },
        tenant: true,
        lease: true,
      },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    res.json(application);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving application: ${error.message}` });
  }
};
