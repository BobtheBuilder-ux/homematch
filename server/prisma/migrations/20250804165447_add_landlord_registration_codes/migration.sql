-- AlterTable
ALTER TABLE "Landlord" ADD COLUMN     "registrationCodeId" INTEGER;

-- CreateTable
CREATE TABLE "LandlordRegistrationCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "LandlordRegistrationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandlordRegistrationCode_code_key" ON "LandlordRegistrationCode"("code");

-- AddForeignKey
ALTER TABLE "Landlord" ADD CONSTRAINT "Landlord_registrationCodeId_fkey" FOREIGN KEY ("registrationCodeId") REFERENCES "LandlordRegistrationCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
