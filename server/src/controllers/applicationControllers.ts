import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { sendEmail } from "../utils/emailService";
import { 
  applicationSubmittedTemplate, 
  applicationApprovedTemplate 
} from "../utils/emailTemplates";
import { uploadFileToS3 } from "../utils/s3Service";

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

export const createApplicationWithFiles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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
      durationAtCurrentAddress,
      employmentStatus,
      occupation,
      employerName,
      workAddress,
      monthlyIncome,
      durationAtCurrentJob,
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

    // Get property details first
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
      include: {
        landlord: true,
        location: true
      }
    });

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    // Upload documents to S3 (outside transaction)
    let idDocumentUrl = '';
    let incomeProofUrl = '';

    if (files.idDocument && files.idDocument[0]) {
      const idFile = files.idDocument[0];
      const idResult = await uploadFileToS3(
        idFile.buffer,
        idFile.originalname,
        idFile.mimetype,
        'documents/id'
      );
      idDocumentUrl = idResult.url;
    }

    if (files.incomeProof && files.incomeProof[0]) {
      const incomeFile = files.incomeProof[0];
      const incomeResult = await uploadFileToS3(
        incomeFile.buffer,
        incomeFile.originalname,
        incomeFile.mimetype,
        'documents/income'
      );
      incomeProofUrl = incomeResult.url;
    }

    // Create application and lease in transaction (with increased timeout)
    const newApplication = await prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
      // Create lease first
      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          rent: property.pricePerYear,
          deposit: property.securityDeposit || 0,
          property: {
            connect: { id: parseInt(propertyId) },
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
          monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
          durationAtCurrentJob,
          incomeProofUrl,
          previousEmployerName,
          previousJobTitle,
          previousEmploymentDuration,
          reasonForLeavingPrevJob,
          numberOfOccupants: numberOfOccupants ? parseInt(numberOfOccupants) : null,
          relationshipToOccupants,
          hasPets: hasPets === 'true',
          isSmoker: isSmoker === 'true',
          accessibilityNeeds,
          reasonForLeaving,
          consentToInformation: consentToInformation === 'true',
          consentToVerification: consentToVerification === 'true',
          consentToTenancyTerms: consentToTenancyTerms === 'true',
          consentToPrivacyPolicy: consentToPrivacyPolicy === 'true',
          property: {
            connect: { id: parseInt(propertyId) },
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

      return application;
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    // Send emails after transaction completes
    try {
      // Send email to tenant using template
      await sendEmail({
        to: email,
        subject: applicationSubmittedTemplate.subject,
        body: applicationSubmittedTemplate.body(
          name,
          property.location.address,
          new Date(applicationDate).toLocaleDateString(),
          property.pricePerYear,
          property.pricePerYear * 0.15,
          property.pricePerYear * 0.1
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
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the entire request if email fails
    }

    res.status(201).json(newApplication);
  } catch (error: any) {
    console.error('Error creating application with files:', error);
    res.status(500).json({ message: `Error creating application: ${error.message}` });
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
          deposit: property.securityDeposit || 0,
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
          property.pricePerYear * 0.15,
          property.pricePerYear * 0.1
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
      // Update application status to approved (lease will be created after payment)
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status },
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
          application.property.pricePerYear * 0.15,
          application.property.pricePerYear * 0.1
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
