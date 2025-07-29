/*
  Warnings:

  - You are about to drop the column `message` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "message",
ADD COLUMN     "accessibilityNeeds" TEXT,
ADD COLUMN     "consentToInformation" BOOLEAN,
ADD COLUMN     "consentToPrivacyPolicy" BOOLEAN,
ADD COLUMN     "consentToTenancyTerms" BOOLEAN,
ADD COLUMN     "consentToVerification" BOOLEAN,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "desiredLeaseDuration" TEXT,
ADD COLUMN     "durationAtCurrentAddress" TEXT,
ADD COLUMN     "durationAtCurrentJob" TEXT,
ADD COLUMN     "employerName" TEXT,
ADD COLUMN     "employmentStatus" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hasPets" BOOLEAN,
ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "idType" TEXT,
ADD COLUMN     "incomeProofUrl" TEXT,
ADD COLUMN     "isSmoker" BOOLEAN,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "monthlyIncome" DOUBLE PRECISION,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "numberOfOccupants" INTEGER,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "preferredMoveInDate" TIMESTAMP(3),
ADD COLUMN     "previousEmployerName" TEXT,
ADD COLUMN     "previousEmploymentDuration" TEXT,
ADD COLUMN     "previousJobTitle" TEXT,
ADD COLUMN     "reasonForLeaving" TEXT,
ADD COLUMN     "reasonForLeavingPrevJob" TEXT,
ADD COLUMN     "relationshipToOccupants" TEXT,
ADD COLUMN     "workAddress" TEXT;
