/*
  Warnings:

  - You are about to drop the column `videolink` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."applications" ADD COLUMN     "videolink" TEXT;

-- AlterTable
ALTER TABLE "public"."jobs" DROP COLUMN "videolink";
