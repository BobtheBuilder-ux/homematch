/*
  Warnings:

  - You are about to drop the column `managerCognitoId` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the `Manager` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `landlordCognitoId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_landlordCognitoId_fkey";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "landlordCognitoId",
ADD COLUMN     "landlordCognitoId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Landlord";

-- CreateTable
CREATE TABLE "Landlord" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,

    CONSTRAINT "Landlord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Landlord_cognitoId_key" ON "Landlord"("cognitoId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_landlordCognitoId_fkey" FOREIGN KEY ("landlordCognitoId") REFERENCES "Landlord"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;
