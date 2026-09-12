-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "rejectedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ClassTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "bonoRenewalId" TEXT,
    CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_bonoRenewalId_fkey" FOREIGN KEY ("bonoRenewalId") REFERENCES "BonoRenewal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bono" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL DEFAULT 0,
    "cycleLabel" TEXT NOT NULL DEFAULT 'Sin bono',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bono_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonoRenewal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cycleLabel" TEXT NOT NULL,
    "sessionsAdded" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonoRenewal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "studioName" TEXT NOT NULL DEFAULT 'Estudio Reformer',
    "location" TEXT NOT NULL DEFAULT 'Enguera (Valencia)',
    "currentCycleLabel" TEXT NOT NULL DEFAULT 'Septiembre 2026',
    "nextCycleLabel" TEXT NOT NULL DEFAULT 'Octubre 2026',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderChannelApp" BOOLEAN NOT NULL DEFAULT true,
    "reminderChannelWhatsapp" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_templateId_date_key" ON "ClassSession"("templateId", "date");

-- CreateIndex
CREATE INDEX "Booking_sessionId_status_idx" ON "Booking"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_sessionId_position_idx" ON "WaitlistEntry"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_sessionId_userId_key" ON "WaitlistEntry"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Offer_userId_status_idx" ON "Offer"("userId", "status");

-- CreateIndex
CREATE INDEX "Offer_sessionId_status_idx" ON "Offer"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Bono_userId_key" ON "Bono"("userId");
