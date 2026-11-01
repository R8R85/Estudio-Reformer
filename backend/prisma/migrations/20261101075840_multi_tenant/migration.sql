/*
  Warnings:

  - You are about to drop the `AppSettings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tenantId` to the `Bono` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `BonoRenewal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ClassSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ClassTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AppSettings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "currentCycleLabel" TEXT NOT NULL DEFAULT 'Mes actual',
    "nextCycleLabel" TEXT NOT NULL DEFAULT 'Mes siguiente',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderChannelApp" BOOLEAN NOT NULL DEFAULT true,
    "reminderChannelWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "planMemberLimit" INTEGER NOT NULL DEFAULT 60,
    "planWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "planMultiSede" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" DATETIME,
    "suspendedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bono" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "cycleLabel" TEXT NOT NULL DEFAULT 'Sin bono',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bono_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bono_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bono" ("cycleLabel", "id", "remaining", "updatedAt", "userId") SELECT "cycleLabel", "id", "remaining", "updatedAt", "userId" FROM "Bono";
DROP TABLE "Bono";
ALTER TABLE "new_Bono" RENAME TO "Bono";
CREATE UNIQUE INDEX "Bono_userId_key" ON "Bono"("userId");
CREATE INDEX "Bono_tenantId_cycleLabel_idx" ON "Bono"("tenantId", "cycleLabel");
CREATE TABLE "new_BonoRenewal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleLabel" TEXT NOT NULL,
    "sessionsAdded" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonoRenewal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonoRenewal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonoRenewal" ("createdAt", "cycleLabel", "id", "sessionsAdded", "userId") SELECT "createdAt", "cycleLabel", "id", "sessionsAdded", "userId" FROM "BonoRenewal";
DROP TABLE "BonoRenewal";
ALTER TABLE "new_BonoRenewal" RENAME TO "BonoRenewal";
CREATE INDEX "BonoRenewal_tenantId_userId_idx" ON "BonoRenewal"("tenantId", "userId");
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "bonoRenewalId" TEXT,
    CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_bonoRenewalId_fkey" FOREIGN KEY ("bonoRenewalId") REFERENCES "BonoRenewal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bonoRenewalId", "cancelledAt", "createdAt", "id", "sessionId", "status", "userId") SELECT "bonoRenewalId", "cancelledAt", "createdAt", "id", "sessionId", "status", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_tenantId_sessionId_status_idx" ON "Booking"("tenantId", "sessionId", "status");
CREATE INDEX "Booking_tenantId_userId_status_idx" ON "Booking"("tenantId", "userId", "status");
CREATE TABLE "new_ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClassSession" ("capacity", "className", "coachName", "createdAt", "date", "id", "templateId", "time") SELECT "capacity", "className", "coachName", "createdAt", "date", "id", "templateId", "time" FROM "ClassSession";
DROP TABLE "ClassSession";
ALTER TABLE "new_ClassSession" RENAME TO "ClassSession";
CREATE INDEX "ClassSession_tenantId_date_idx" ON "ClassSession"("tenantId", "date");
CREATE UNIQUE INDEX "ClassSession_templateId_date_key" ON "ClassSession"("templateId", "date");
CREATE TABLE "new_ClassTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClassTemplate" ("capacity", "className", "coachName", "createdAt", "dayOfWeek", "id", "time", "updatedAt") SELECT "capacity", "className", "coachName", "createdAt", "dayOfWeek", "id", "time", "updatedAt" FROM "ClassTemplate";
DROP TABLE "ClassTemplate";
ALTER TABLE "new_ClassTemplate" RENAME TO "ClassTemplate";
CREATE INDEX "ClassTemplate_tenantId_dayOfWeek_idx" ON "ClassTemplate"("tenantId", "dayOfWeek");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("channel", "createdAt", "id", "message", "userId") SELECT "channel", "createdAt", "id", "message", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("createdAt", "expiresAt", "id", "sessionId", "status", "userId") SELECT "createdAt", "expiresAt", "id", "sessionId", "status", "userId" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE INDEX "Offer_tenantId_userId_status_idx" ON "Offer"("tenantId", "userId", "status");
CREATE INDEX "Offer_tenantId_sessionId_status_idx" ON "Offer"("tenantId", "sessionId", "status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "experienciaPrevia" BOOLEAN NOT NULL DEFAULT false,
    "patologia" BOOLEAN NOT NULL DEFAULT false,
    "patologiaTexto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("approvedAt", "createdAt", "email", "experienciaPrevia", "id", "name", "passwordHash", "patologia", "patologiaTexto", "phone", "rejectedAt", "role", "status") SELECT "approvedAt", "createdAt", "email", "experienciaPrevia", "id", "name", "passwordHash", "patologia", "patologiaTexto", "phone", "rejectedAt", "role", "status" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE INDEX "User_tenantId_status_idx" ON "User"("tenantId", "status");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE TABLE "new_WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WaitlistEntry" ("createdAt", "id", "position", "sessionId", "userId") SELECT "createdAt", "id", "position", "sessionId", "userId" FROM "WaitlistEntry";
DROP TABLE "WaitlistEntry";
ALTER TABLE "new_WaitlistEntry" RENAME TO "WaitlistEntry";
CREATE INDEX "WaitlistEntry_tenantId_sessionId_position_idx" ON "WaitlistEntry"("tenantId", "sessionId", "position");
CREATE UNIQUE INDEX "WaitlistEntry_sessionId_userId_key" ON "WaitlistEntry"("sessionId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
