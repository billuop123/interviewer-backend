/*
  Warnings:

  - You are about to drop the column `isSysemSetting` on the `companysettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."companysettings" DROP COLUMN "isSysemSetting",
ADD COLUMN     "isSystemSetting" BOOLEAN NOT NULL DEFAULT false;
