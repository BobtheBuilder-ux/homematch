import { Request, Response } from "express";
import { PrismaClient, Prisma } from "../../node_modules/.prisma/client";
import { sendEmail } from "../utils/emailService";
import { 
  applicationSubmittedTemplate, 
  applicationApprovedTemplate 
} from "../utils/emailTemplates";

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
        lease: {
          include: {
            payments: true,
          },
        },
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

      // Send email to tenant using template
      await sendEmail({
        to: email,
        subject: applicationSubmittedTemplate.subject,
        body: applicationSubmittedTemplate.body(
          name,
          property.location.address,
          new Date(applicationDate).toLocaleDateString(),
          property.pricePerYear,
          property.securityDeposit
        )
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

      // Send approval email to tenant using template
      await sendEmail({
        to: application.tenant.email,
        subject: applicationApprovedTemplate.subject,
        body: applicationApprovedTemplate.body(
          application.tenant.name,
          application.property.location.address,
          application.propertyId,
          application.property.pricePerYear,
          application.property.securityDeposit
        )
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
