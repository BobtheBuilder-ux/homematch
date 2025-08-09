-- CreateTable
CREATE TABLE "TenantSurvey" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "rentingStatus" TEXT NOT NULL,
    "housingType" TEXT[],
    "frustrations" TEXT[],
    "scamExperience" TEXT NOT NULL,
    "scamDetails" TEXT,
    "propertyListingRating" TEXT NOT NULL,
    "dashboardRating" TEXT NOT NULL,
    "maintenanceRating" TEXT NOT NULL,
    "rentCollectionRating" TEXT NOT NULL,
    "customerSupportRating" TEXT NOT NULL,
    "monthlyReportRating" TEXT NOT NULL,
    "wishEasier" TEXT NOT NULL,
    "launchNotification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandlordSurvey" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "numberOfProperties" TEXT NOT NULL,
    "propertyTypes" TEXT[],
    "tenantManagement" TEXT[],
    "biggestChallenges" TEXT[],
    "agentIssues" TEXT NOT NULL,
    "platformInterest" TEXT NOT NULL,
    "propertyListingRating" TEXT NOT NULL,
    "dashboardRating" TEXT NOT NULL,
    "maintenanceRating" TEXT NOT NULL,
    "rentCollectionRating" TEXT NOT NULL,
    "customerSupportRating" TEXT NOT NULL,
    "monthlyReportRating" TEXT NOT NULL,
    "wishEasier" TEXT NOT NULL,
    "launchNotification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandlordSurvey_pkey" PRIMARY KEY ("id")
);
