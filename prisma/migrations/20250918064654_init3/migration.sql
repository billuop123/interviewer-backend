/*
  Warnings:

  - You are about to drop the `applicationstatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."applications" DROP CONSTRAINT "applications_applicationstatusid_fkey";

-- DropTable
DROP TABLE "public"."applicationstatus";
