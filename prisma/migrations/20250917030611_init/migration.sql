-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "companyId" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userdetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experience" INTEGER,
    "phone" TEXT,
    "resumelink" TEXT,
    "skills" TEXT[],
    "location" TEXT,
    "bio" TEXT,
    "linkedln" TEXT,
    "portfolio" TEXT,
    "github" TEXT,
    "expected_salary" INTEGER,
    "availability" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "userdetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companytypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "deleted" TIMESTAMP(3),

    CONSTRAINT "companytypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loginfo" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "delete" TIMESTAMP(3),

    CONSTRAINT "loginfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companysettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT true,
    "isSysemSetting" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "companysettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "postlimit" INTEGER,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobtypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "jobtypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyid" TEXT NOT NULL,
    "jobtypeid" TEXT NOT NULL,
    "location" TEXT,
    "isremote" BOOLEAN NOT NULL DEFAULT false,
    "salarymin" DECIMAL(12,2),
    "salarymax" DECIMAL(12,2),
    "salarycurrency" TEXT NOT NULL DEFAULT 'USD',
    "requirements" TEXT,
    "responsibilities" TEXT,
    "benefits" TEXT,
    "applicationUrl" TEXT,
    "contactemail" VARCHAR(255),
    "applicationdeadline" TIMESTAMP(3),
    "experiencerequired" INTEGER,
    "educationlevel" VARCHAR(100),
    "skills" TEXT[],
    "isactive" BOOLEAN NOT NULL DEFAULT true,
    "viewscount" INTEGER NOT NULL DEFAULT 0,
    "applicationscount" INTEGER NOT NULL DEFAULT 0,
    "isfeatured" BOOLEAN NOT NULL DEFAULT false,
    "postedby" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applicationstatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "modified" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "applicationstatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" TEXT NOT NULL,
    "jobid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "applicationstatusid" TEXT NOT NULL,
    "coverletter" TEXT,
    "relevancescore" DECIMAL(3,2),
    "relevancecomment" TEXT,
    "interviewdate" TIMESTAMP(3),
    "notes" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emailtemplates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "emailtemplates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailTracking" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "emailStatus" "public"."EmailStatus" NOT NULL DEFAULT 'SENT',
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3),
    "deleted" TIMESTAMP(3),

    CONSTRAINT "EmailTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "userdetails_userId_key" ON "public"."userdetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userdetails_phone_key" ON "public"."userdetails"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "companysettings_companyId_key_key" ON "public"."companysettings"("companyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "public"."companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jobtypes_name_key" ON "public"."jobtypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "applicationstatus_name_key" ON "public"."applicationstatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "emailtemplates_code_key" ON "public"."emailtemplates"("code");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userdetails" ADD CONSTRAINT "userdetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."companysettings" ADD CONSTRAINT "companysettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_companyid_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_jobtypeid_fkey" FOREIGN KEY ("jobtypeid") REFERENCES "public"."jobtypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_postedby_fkey" FOREIGN KEY ("postedby") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_jobid_fkey" FOREIGN KEY ("jobid") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_userid_fkey" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_applicationstatusid_fkey" FOREIGN KEY ("applicationstatusid") REFERENCES "public"."applicationstatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
