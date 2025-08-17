/*
  Warnings:

  - You are about to drop the column `highlights` on the `Property` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MaritalPreference" AS ENUM ('Single', 'Married', 'Any');

-- CreateEnum
CREATE TYPE "public"."GenderPreference" AS ENUM ('Male', 'Female', 'Any');

-- CreateEnum
CREATE TYPE "public"."ChildrenPreference" AS ENUM ('Yes', 'No', 'Any');

-- AlterTable
ALTER TABLE "public"."Property" DROP COLUMN "highlights",
ADD COLUMN     "childrenPreference" "public"."ChildrenPreference" NOT NULL DEFAULT 'Any',
ADD COLUMN     "genderPreference" "public"."GenderPreference" NOT NULL DEFAULT 'Any',
ADD COLUMN     "maritalPreference" "public"."MaritalPreference" NOT NULL DEFAULT 'Any';
