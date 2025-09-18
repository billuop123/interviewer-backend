/*
  Warnings:

  - You are about to drop the column `linkedln` on the `userdetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."userdetails" DROP COLUMN "linkedln",
ADD COLUMN     "linkedin" TEXT;
