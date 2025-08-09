import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

const router = Router();
const prisma = new PrismaClient();

// Submit tenant survey
router.post('/tenant', async (req, res) => {
  try {
    const {
      fullName,
      email,
      currentLocation,
      rentingStatus,
      housingType,
      biggestFrustrations,
      scammedExperience,
      scamDetails,
      directLandlordPreference,
      virtualTourRating,
      streetViewRating,
      verifiedListingsRating,
      supportTeamRating,
      inAppChatRating,
      rentPaymentRating,
      wishExisted,
      launchNotification
    } = req.body;

    const survey = await prisma.tenantSurvey.create({
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

    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    console.error('Error submitting tenant survey:', error);
    res.status(500).json({ success: false, error: 'Failed to submit survey' });
  }
});

// Submit landlord survey
router.post('/landlord', async (req, res) => {
  try {
    const {
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
    } = req.body;

    const survey = await prisma.landlordSurvey.create({
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

    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    console.error('Error submitting landlord survey:', error);
    res.status(500).json({ success: false, error: 'Failed to submit survey' });
  }
});

// Download tenant surveys (Admin only)
router.get('/tenant/download', async (req, res) => {
  try {
    const surveys = await prisma.tenantSurvey.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convert array fields to comma-separated strings for CSV
    const csvData = surveys.map(survey => ({
      ...survey,
      housingType: survey.housingType.join(', '),
      frustrations: survey.frustrations.join(', '),
      createdAt: survey.createdAt.toISOString(),
      updatedAt: survey.updatedAt.toISOString()
    }));

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

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tenant-surveys.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error downloading tenant surveys:', error);
    res.status(500).json({ success: false, error: 'Failed to download surveys' });
  }
});

// Download landlord surveys (Admin only)
router.get('/landlord/download', async (req, res) => {
  try {
    const surveys = await prisma.landlordSurvey.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convert array fields to comma-separated strings for CSV
    const csvData = surveys.map(survey => ({
      ...survey,
      propertyTypes: survey.propertyTypes.join(', '),
      tenantManagement: survey.tenantManagement.join(', '),
      biggestChallenges: survey.biggestChallenges.join(', '),
      createdAt: survey.createdAt.toISOString(),
      updatedAt: survey.updatedAt.toISOString()
    }));

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

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="landlord-surveys.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error downloading landlord surveys:', error);
    res.status(500).json({ success: false, error: 'Failed to download surveys' });
  }
});

// Get survey statistics (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const tenantCount = await prisma.tenantSurvey.count();
    const landlordCount = await prisma.landlordSurvey.count();
    
    const recentTenantSurveys = await prisma.tenantSurvey.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    const recentLandlordSurveys = await prisma.landlordSurvey.count({
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
  } catch (error) {
    console.error('Error fetching survey stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch survey statistics' });
  }
});

export default router;