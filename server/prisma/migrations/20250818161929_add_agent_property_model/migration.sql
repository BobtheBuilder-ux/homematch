/*
  Warnings:

  - You are about to drop the column `averageRating` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfReviews` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Property" DROP COLUMN "averageRating",
DROP COLUMN "numberOfReviews";

-- CreateTable
CREATE TABLE "public"."AgentProperty" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentProperty_agentId_propertyId_key" ON "public"."AgentProperty"("agentId", "propertyId");

-- AddForeignKey
ALTER TABLE "public"."AgentProperty" ADD CONSTRAINT "AgentProperty_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentProperty" ADD CONSTRAINT "AgentProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
