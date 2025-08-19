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
exports.sendAdminWelcomeEmail = exports.sendLandlordWelcomeEmail = exports.sendTenantWelcomeEmail = exports.sendInspectionApprovedEmail = exports.sendInspectionRequestEmail = exports.getEmailSubscriptions = exports.unsubscribeFromEmailList = exports.sendWelcomeEmail = exports.sendSurveyConfirmationEmail = exports.addToEmailList = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("./emailService");
const emailTemplates_1 = require("./emailTemplates");
const prisma = new client_1.PrismaClient();
const addToEmailList = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if email already exists
        const existingSubscription = yield prisma.emailSubscription.findUnique({
            where: { email: data.email }
        });
        if (existingSubscription) {
            // Update existing subscription if it was previously unsubscribed
            if (!existingSubscription.isActive) {
                yield prisma.emailSubscription.update({
                    where: { email: data.email },
                    data: {
                        isActive: true,
                        subscriptionType: data.subscriptionType,
                        fullName: data.fullName,
                        subscribedAt: new Date(),
                        unsubscribedAt: null
                    }
                });
                console.log(`Reactivated email subscription for: ${data.email}`);
            }
            else {
                console.log(`Email already subscribed: ${data.email}`);
            }
        }
        else {
            // Create new subscription
            yield prisma.emailSubscription.create({
                data: {
                    email: data.email,
                    fullName: data.fullName,
                    subscriptionType: data.subscriptionType,
                    isActive: true
                }
            });
            console.log(`Added new email subscription: ${data.email}`);
        }
    }
    catch (error) {
        console.error('Error adding to email list:', error);
        throw error;
    }
});
exports.addToEmailList = addToEmailList;
const sendSurveyConfirmationEmail = (email, fullName, surveyType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const template = emailTemplates_1.surveyConfirmationTemplate[surveyType];
        yield (0, emailService_1.sendEmail)({
            to: email,
            subject: template.subject,
            body: template.body(fullName)
        });
        console.log(`Survey confirmation email sent to: ${email}`);
    }
    catch (error) {
        console.error('Error sending survey confirmation email:', error);
        throw error;
    }
});
exports.sendSurveyConfirmationEmail = sendSurveyConfirmationEmail;
const sendWelcomeEmail = (email, fullName, subscriptionType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: email,
            subject: emailTemplates_1.welcomeToEmailListTemplate.subject,
            body: emailTemplates_1.welcomeToEmailListTemplate.body(fullName, subscriptionType)
        });
        console.log(`Welcome email sent to: ${email}`);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const unsubscribeFromEmailList = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.emailSubscription.update({
            where: { email },
            data: {
                isActive: false,
                unsubscribedAt: new Date()
            }
        });
        console.log(`Unsubscribed email: ${email}`);
    }
    catch (error) {
        console.error('Error unsubscribing from email list:', error);
        throw error;
    }
});
exports.unsubscribeFromEmailList = unsubscribeFromEmailList;
const getEmailSubscriptions = (subscriptionType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const whereClause = subscriptionType
            ? { subscriptionType, isActive: true }
            : { isActive: true };
        return yield prisma.emailSubscription.findMany({
            where: whereClause,
            orderBy: { subscribedAt: 'desc' }
        });
    }
    catch (error) {
        console.error('Error fetching email subscriptions:', error);
        throw error;
    }
});
exports.getEmailSubscriptions = getEmailSubscriptions;
const sendInspectionRequestEmail = (tenantEmail, tenantName, propertyAddress, scheduledDate, preferredTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: tenantEmail,
            subject: emailTemplates_1.inspectionRequestTemplate.subject,
            body: emailTemplates_1.inspectionRequestTemplate.body(tenantName, propertyAddress, scheduledDate, preferredTime)
        });
        console.log(`Inspection request email sent to: ${tenantEmail}`);
    }
    catch (error) {
        console.error('Error sending inspection request email:', error);
        throw error;
    }
});
exports.sendInspectionRequestEmail = sendInspectionRequestEmail;
const sendInspectionApprovedEmail = (tenantEmail, tenantName, propertyAddress, scheduledDate, preferredTime, agentName, agentPhone) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: tenantEmail,
            subject: emailTemplates_1.inspectionApprovedTemplate.subject,
            body: emailTemplates_1.inspectionApprovedTemplate.body(tenantName, propertyAddress, scheduledDate, preferredTime, agentName, agentPhone)
        });
        console.log(`Inspection approved email sent to: ${tenantEmail}`);
    }
    catch (error) {
        console.error('Error sending inspection approved email:', error);
        throw error;
    }
});
exports.sendInspectionApprovedEmail = sendInspectionApprovedEmail;
const sendTenantWelcomeEmail = (tenantEmail, tenantName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: tenantEmail,
            subject: emailTemplates_1.tenantWelcomeTemplate.subject,
            body: emailTemplates_1.tenantWelcomeTemplate.body(tenantName)
        });
        console.log(`Tenant welcome email sent to: ${tenantEmail}`);
    }
    catch (error) {
        console.error('Error sending tenant welcome email:', error);
        throw error;
    }
});
exports.sendTenantWelcomeEmail = sendTenantWelcomeEmail;
const sendLandlordWelcomeEmail = (landlordEmail, landlordName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: landlordEmail,
            subject: emailTemplates_1.landlordWelcomeTemplate.subject,
            body: emailTemplates_1.landlordWelcomeTemplate.body(landlordName)
        });
        console.log(`Landlord welcome email sent to: ${landlordEmail}`);
    }
    catch (error) {
        console.error('Error sending landlord welcome email:', error);
        throw error;
    }
});
exports.sendLandlordWelcomeEmail = sendLandlordWelcomeEmail;
const sendAdminWelcomeEmail = (adminEmail, adminName, temporaryPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, emailService_1.sendEmail)({
            to: adminEmail,
            subject: emailTemplates_1.adminWelcomeTemplate.subject,
            body: emailTemplates_1.adminWelcomeTemplate.body(adminName, adminEmail, temporaryPassword)
        });
        console.log(`Admin welcome email sent to: ${adminEmail}`);
    }
    catch (error) {
        console.error('Error sending admin welcome email:', error);
        throw error;
    }
});
exports.sendAdminWelcomeEmail = sendAdminWelcomeEmail;
