-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('PropertyUpdate', 'ApplicationStatus', 'PaymentReminder', 'InspectionScheduled', 'LeaseExpiring', 'MaintenanceRequest', 'SystemAlert', 'Welcome', 'General');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('PropertyCreated', 'PropertyUpdated', 'PropertyDeleted', 'ApplicationSubmitted', 'ApplicationApproved', 'ApplicationDenied', 'LeaseCreated', 'LeaseExpired', 'PaymentMade', 'PaymentOverdue', 'InspectionScheduled', 'InspectionCompleted', 'TenantRegistered', 'LandlordRegistered', 'AgentAssigned', 'MaintenanceRequested', 'MaintenanceCompleted', 'WithdrawalRequested', 'WithdrawalProcessed');

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'Medium',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "relatedId" INTEGER,
    "relatedType" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityFeed" (
    "id" SERIAL NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "targetId" INTEGER,
    "targetType" TEXT,
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFeed_pkey" PRIMARY KEY ("id")
);
