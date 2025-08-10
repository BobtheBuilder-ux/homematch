-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('Available', 'Closed', 'UnderMaintenance');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'Available';
