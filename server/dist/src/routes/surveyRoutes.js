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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const json2csv_1 = require("json2csv");
const emailSubscriptionService_1 = require("../utils/emailSubscriptionService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Submit tenant survey
router.post('/tenant', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, currentLocation, rentingStatus, housingType, biggestFrustrations, scammedExperience, scamDetails, directLandlordPreference, virtualTourRating, streetViewRating, verifiedListingsRating, supportTeamRating, inAppChatRating, rentPaymentRating, wishExisted, launchNotification } = req.body;
        const survey = yield prisma.tenantSurvey.create({
            data: {
                fullName,
                email,
                currentLocation,
                rentingStatus,
                housingType: [housingType], // Convert to array
                frustrations: biggestFrustrations,
                scamExperience: scammedExperience,
                scamDetails,
                propertyListingRating: virtualTourRating,
                dashboardRating: streetViewRating,
                maintenanceRating: verifiedListingsRating,
                rentCollectionRating: supportTeamRating,
                customerSupportRating: inAppChatRating,
                monthlyReportRating: rentPaymentRating,
                wishEasier: wishExisted,
                launchNotification
            }
        });
        // Send confirmation email and add to email list
        try {
            yield Promise.all([
                (0, emailSubscriptionService_1.sendSurveyConfirmationEmail)(email, fullName, 'tenant'),
                (0, emailSubscriptionService_1.addToEmailList)({
                    email,
                    fullName,
                    subscriptionType: 'tenant_survey'
                })
            ]);
            console.log(`Email sent and user added to list: ${email}`);
        }
        catch (emailError) {
            console.error('Error with email operations:', emailError);
            // Don't fail the survey submission if email fails
        }
        res.status(201).json({ success: true, data: survey });
    }
    catch (error) {
        console.error('Error submitting tenant survey:', error);
        res.status(500).json({ success: false, error: 'Failed to submit survey' });
    }
}));
// Submit landlord survey
router.post('/landlord', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, propertyLocation, numberOfProperties, propertyTypes, tenantManagement, biggestChallenges, agentIssues, platformInterest, propertyListingRating, dashboardRating, maintenanceRating, rentCollectionRating, customerSupportRating, monthlyReportRating, wishEasier, launchNotification } = req.body;
        const survey = yield prisma.landlordSurvey.create({
            data: {
                fullName,
                email,
                propertyLocation,
                numberOfProperties,
                propertyTypes,
                tenantManagement,
                biggestChallenges,
                agentIssues,
                platformInterest,
                propertyListingRating,
                dashboardRating,
                maintenanceRating,
                rentCollectionRating,
                customerSupportRating,
                monthlyReportRating,
                wishEasier,
                launchNotification
            }
        });
        // Send confirmation email and add to email list
        try {
            yield Promise.all([
                (0, emailSubscriptionService_1.sendSurveyConfirmationEmail)(email, fullName, 'landlord'),
                (0, emailSubscriptionService_1.addToEmailList)({
                    email,
                    fullName,
                    subscriptionType: 'landlord_survey'
                })
            ]);
            console.log(`Email sent and user added to list: ${email}`);
        }
        catch (emailError) {
            console.error('Error with email operations:', emailError);
            // Don't fail the survey submission if email fails
        }
        res.status(201).json({ success: true, data: survey });
    }
    catch (error) {
        console.error('Error submitting landlord survey:', error);
        res.status(500).json({ success: false, error: 'Failed to submit survey' });
    }
}));
// Download tenant surveys (Admin only)
router.get('/tenant/download', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const surveys = yield prisma.tenantSurvey.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Convert array fields to comma-separated strings for CSV
        const csvData = surveys.map(survey => (Object.assign(Object.assign({}, survey), { housingType: survey.housingType.join(', '), frustrations: survey.frustrations.join(', '), createdAt: survey.createdAt.toISOString(), updatedAt: survey.updatedAt.toISOString() })));
        const fields = [
            'id',
            'fullName',
            'email',
            'currentLocation',
            'rentingStatus',
            'housingType',
            'frustrations',
            'scamExperience',
            'scamDetails',
            'propertyListingRating',
            'dashboardRating',
            'maintenanceRating',
            'rentCollectionRating',
            'customerSupportRating',
            'monthlyReportRating',
            'wishEasier',
            'launchNotification',
            'createdAt',
            'updatedAt'
        ];
        const parser = new json2csv_1.Parser({ fields });
        const csv = parser.parse(csvData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tenant-surveys.csv"');
        res.send(csv);
    }
    catch (error) {
        console.error('Error downloading tenant surveys:', error);
        res.status(500).json({ success: false, error: 'Failed to download surveys' });
    }
}));
// Download landlord surveys (Admin only)
router.get('/landlord/download', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const surveys = yield prisma.landlordSurvey.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Convert array fields to comma-separated strings for CSV
        const csvData = surveys.map(survey => (Object.assign(Object.assign({}, survey), { propertyTypes: survey.propertyTypes.join(', '), tenantManagement: survey.tenantManagement.join(', '), biggestChallenges: survey.biggestChallenges.join(', '), createdAt: survey.createdAt.toISOString(), updatedAt: survey.updatedAt.toISOString() })));
        const fields = [
            'id',
            'fullName',
            'email',
            'propertyLocation',
            'numberOfProperties',
            'propertyTypes',
            'tenantManagement',
            'biggestChallenges',
            'agentIssues',
            'platformInterest',
            'propertyListingRating',
            'dashboardRating',
            'maintenanceRating',
            'rentCollectionRating',
            'customerSupportRating',
            'monthlyReportRating',
            'wishEasier',
            'launchNotification',
            'createdAt',
            'updatedAt'
        ];
        const parser = new json2csv_1.Parser({ fields });
        const csv = parser.parse(csvData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="landlord-surveys.csv"');
        res.send(csv);
    }
    catch (error) {
        console.error('Error downloading landlord surveys:', error);
        res.status(500).json({ success: false, error: 'Failed to download surveys' });
    }
}));
// Get survey statistics (Admin only)
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantCount = yield prisma.tenantSurvey.count();
        const landlordCount = yield prisma.landlordSurvey.count();
        const recentTenantSurveys = yield prisma.tenantSurvey.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        });
        const recentLandlordSurveys = yield prisma.landlordSurvey.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        });
        res.json({
            success: true,
            data: {
                totalTenantSurveys: tenantCount,
                totalLandlordSurveys: landlordCount,
                recentTenantSurveys,
                recentLandlordSurveys,
                totalSurveys: tenantCount + landlordCount
            }
        });
    }
    catch (error) {
        console.error('Error fetching survey stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch survey statistics' });
    }
}));
exports.default = router;
