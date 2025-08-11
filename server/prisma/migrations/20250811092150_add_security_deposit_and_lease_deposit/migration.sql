/*
  Warnings:

  - Added the required column `deposit` to the `Lease` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityDeposit` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "deposit" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "securityDeposit" DOUBLE PRECISION NOT NULL;
