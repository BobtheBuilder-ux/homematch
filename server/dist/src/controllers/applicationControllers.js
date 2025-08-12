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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplication = exports.updateApplicationStatus = exports.createApplication = exports.listApplications = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("../utils/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const prisma = new client_1.PrismaClient();
const listApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, userType } = req.query;
        let whereClause = {};
        if (userId && userType) {
            if (userType === "tenant") {
                whereClause = { tenantCognitoId: String(userId) };
            }
            else if (userType === "landlord") {
                // Landlords can only view applications, not approve/deny them
                whereClause = {
                    property: {
                        landlordCognitoId: String(userId),
                    },
                };
            }
            // Only admins can approve/deny applications
        }
        const applications = yield prisma.application.findMany({
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
        function calculateNextPaymentDate(startDate) {
            const today = new Date();
            const nextPaymentDate = new Date(startDate);
            while (nextPaymentDate <= today) {
                nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            }
            return nextPaymentDate;
        }
        const formattedApplications = applications.map((app) => (Object.assign(Object.assign({}, app), { property: Object.assign(Object.assign({}, app.property), { address: app.property.location.address }), landlord: app.property.landlord, lease: app.lease
                ? Object.assign(Object.assign({}, app.lease), { nextPaymentDate: calculateNextPaymentDate(app.lease.startDate) }) : null })));
        res.json(formattedApplications);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving applications: ${error.message}` });
    }
});
exports.listApplications = listApplications;
const createApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { applicationDate, status, propertyId, tenantCognitoId, name, email, phoneNumber, preferredMoveInDate, desiredLeaseDuration, gender, dateOfBirth, nationality, maritalStatus, idType, idDocumentUrl, durationAtCurrentAddress, employmentStatus, occupation, employerName, workAddress, monthlyIncome, durationAtCurrentJob, incomeProofUrl, previousEmployerName, previousJobTitle, previousEmploymentDuration, reasonForLeavingPrevJob, numberOfOccupants, relationshipToOccupants, hasPets, isSmoker, accessibilityNeeds, reasonForLeaving, consentToInformation, consentToVerification, consentToTenancyTerms, consentToPrivacyPolicy, } = req.body;
        const property = yield prisma.property.findUnique({
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
        const newApplication = yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Create lease first
            const lease = yield prisma.lease.create({
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
            const application = yield prisma.application.create({
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
            yield (0, emailService_1.sendEmail)({
                to: email,
                subject: emailTemplates_1.applicationSubmittedTemplate.subject,
                body: emailTemplates_1.applicationSubmittedTemplate.body(name, property.location.address, new Date(applicationDate).toLocaleDateString(), property.pricePerYear, property.securityDeposit || 0)
            });
            // Send email to landlord
            if ((_a = property.landlord) === null || _a === void 0 ? void 0 : _a.email) {
                yield (0, emailService_1.sendEmail)({
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
        }));
        res.status(201).json(newApplication);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating application: ${error.message}` });
    }
});
exports.createApplication = createApplication;
const updateApplicationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, userType } = req.body;
        // Only admins can update application status
        if (userType !== 'admin') {
            res.status(403).json({ message: "Only administrators can approve or deny applications." });
            return;
        }
        const application = yield prisma.application.findUnique({
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
            const newLease = yield prisma.lease.create({
                data: {
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    rent: application.property.pricePerYear,
                    deposit: application.property.securityDeposit,
                    propertyId: application.propertyId,
                    tenantCognitoId: application.tenantCognitoId,
                },
            });
            yield prisma.property.update({
                where: { id: application.propertyId },
                data: {
                    tenants: {
                        connect: { cognitoId: application.tenantCognitoId },
                    },
                },
            });
            yield prisma.application.update({
                where: { id: Number(id) },
                data: { status, leaseId: newLease.id },
            });
            // Send approval email to tenant using template
            yield (0, emailService_1.sendEmail)({
                to: application.tenant.email,
                subject: emailTemplates_1.applicationApprovedTemplate.subject,
                body: emailTemplates_1.applicationApprovedTemplate.body(application.tenant.name, application.property.location.address, application.propertyId, application.property.pricePerYear, application.property.securityDeposit)
            });
        }
        else if (status === "Denied") {
            yield prisma.application.update({
                where: { id: Number(id) },
                data: { status },
            });
            // Send denial email to tenant
            yield (0, emailService_1.sendEmail)({
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
        const updatedApplication = yield prisma.application.findUnique({
            where: { id: Number(id) },
            include: {
                property: true,
                tenant: true,
                lease: true,
            },
        });
        res.json(updatedApplication);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating application status: ${error.message}` });
    }
});
exports.updateApplicationStatus = updateApplicationStatus;
const getApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const application = yield prisma.application.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving application: ${error.message}` });
    }
});
exports.getApplication = getApplication;
