-- Initial database schema for Jaffna Freelance Connect
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'FREELANCER', 'ADMIN');
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "displayName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'FREELANCER',
  "phone" TEXT,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "FreelancerProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "headline" TEXT,
  "bio" TEXT,
  "skills" TEXT[] NOT NULL,
  "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
  "hourlyRate" DECIMAL(12,2),
  "availability" TEXT,
  "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FreelancerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreelancerProfile_userId_key" ON "FreelancerProfile"("userId");

CREATE TABLE "Job" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "skills" TEXT[] NOT NULL,
  "budgetMin" DECIMAL(12,2),
  "budgetMax" DECIMAL(12,2),
  "location" TEXT,
  "contact" TEXT,
  "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
  "moderation" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_clientId_idx" ON "Job"("clientId");
CREATE INDEX "Job_status_moderation_idx" ON "Job"("status", "moderation");
CREATE INDEX "Job_category_idx" ON "Job"("category");
CREATE INDEX "Job_location_idx" ON "Job"("location");

CREATE TABLE "Application" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "freelancerProfileId" TEXT,
  "coverMessage" TEXT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Application_jobId_freelancerId_key" ON "Application"("jobId", "freelancerId");
CREATE INDEX "Application_freelancerId_idx" ON "Application"("freelancerId");
CREATE INDEX "Application_status_idx" ON "Application"("status");

ALTER TABLE "FreelancerProfile"
  ADD CONSTRAINT "FreelancerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Job"
  ADD CONSTRAINT "Job_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_freelancerId_fkey"
  FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Application"
  ADD CONSTRAINT "Application_freelancerProfileId_fkey"
  FOREIGN KEY ("freelancerProfileId") REFERENCES "FreelancerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
