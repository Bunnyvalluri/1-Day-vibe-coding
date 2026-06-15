-- =========================================================================
-- CHURCH EVENT REGISTRATION SYSTEM - NEON POSTGRESQL SCHEMA SETUP & SEED
-- =========================================================================
-- Paste and execute this script in the Neon Console SQL Editor.
-- It will create all tables, set up relational keys, and seed mock data.

-- 1. DROP EXISTING TABLES (CAUTION: Clears old test records)
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Attendance" CASCADE;
DROP TABLE IF EXISTS "Registration" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "Ministry" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 2. CREATE USER TABLE
CREATE TABLE "User" (
  "id" VARCHAR(255) PRIMARY KEY,
  "fullName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "phone" VARCHAR(255),
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(255) DEFAULT 'MEMBER' NOT NULL, -- MEMBER, MINISTRY_LEADER, ADMIN, SUPER_ADMIN
  "memberId" VARCHAR(255) UNIQUE,
  "ministryId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. CREATE MINISTRY TABLE
CREATE TABLE "Ministry" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "description" TEXT,
  "leaderId" VARCHAR(255),
  "status" VARCHAR(255) DEFAULT 'ACTIVE' NOT NULL, -- ACTIVE, INACTIVE
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. CREATE EVENT TABLE
CREATE TABLE "Event" (
  "id" VARCHAR(255) PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(255) NOT NULL,
  "banner" VARCHAR(255),
  "venue" VARCHAR(255) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "registrationDeadline" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" VARCHAR(255) DEFAULT 'DRAFT' NOT NULL, -- DRAFT, OPEN, CLOSED, COMPLETED, CANCELLED
  "ministryId" VARCHAR(255),
  "organizerId" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. CREATE REGISTRATION TABLE
CREATE TABLE "Registration" (
  "id" VARCHAR(255) PRIMARY KEY,
  "eventId" VARCHAR(255) NOT NULL,
  "userId" VARCHAR(255) NOT NULL,
  "registrationType" VARCHAR(255) DEFAULT 'INDIVIDUAL' NOT NULL, -- INDIVIDUAL, FAMILY, GROUP
  "attendeeCount" INTEGER DEFAULT 1 NOT NULL,
  "notes" TEXT,
  "status" VARCHAR(255) DEFAULT 'PENDING' NOT NULL, -- PENDING, CONFIRMED, CANCELLED, ATTENDED, ABSENT
  "registeredAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. CREATE ATTENDANCE TABLE
CREATE TABLE "Attendance" (
  "id" VARCHAR(255) PRIMARY KEY,
  "registrationId" VARCHAR(255) UNIQUE NOT NULL,
  "eventId" VARCHAR(255) NOT NULL,
  "userId" VARCHAR(255) NOT NULL,
  "checkInTime" TIMESTAMP WITH TIME ZONE,
  "attendanceStatus" VARCHAR(255) DEFAULT 'ABSENT' NOT NULL, -- PRESENT, LATE, ABSENT
  "markedById" VARCHAR(255),
  "markedBy" VARCHAR(255)
);

-- 7. CREATE NOTIFICATION TABLE
CREATE TABLE "Notification" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(255) DEFAULT 'INFO' NOT NULL, -- INFO, REMINDER, CANCELLATION, CHECK_IN
  "isRead" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- ADD RELATIONSHIP FOREIGN KEYS
-- =========================================================================
ALTER TABLE "User" ADD CONSTRAINT "fk_user_ministry" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE SET NULL;
ALTER TABLE "Ministry" ADD CONSTRAINT "fk_ministry_leader" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Event" ADD CONSTRAINT "fk_event_ministry" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE SET NULL;
ALTER TABLE "Event" ADD CONSTRAINT "fk_event_organizer" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "fk_registration_event" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "fk_registration_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "fk_attendance_registration" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "fk_attendance_event" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "fk_attendance_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "fk_notification_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- =========================================================================
-- SEED DATA (INSERTS)
-- =========================================================================

-- 1. Insert Users (Password hashes correspond to: Admin123!, Leader123!, Member123!)
-- Elijah Vance (SUPER_ADMIN)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-superadmin', 'Elijah Vance', 'superadmin@church.com', '+15550100', '$2a$10$Wd.67X/9tZ0Zc2P/K.h3pe7K1P3lCgO3tUaGv.G/gK8VlU1n1F9qG', 'SUPER_ADMIN', 'M-77777', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sarah Jenkins (ADMIN)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-admin', 'Sarah Jenkins', 'admin@church.com', '+15550101', '$2a$10$Wd.67X/9tZ0Zc2P/K.h3pe7K1P3lCgO3tUaGv.G/gK8VlU1n1F9qG', 'ADMIN', 'M-10001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- David Praise (MINISTRY_LEADER)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-worship-leader', 'David Praise', 'worship@church.com', '+15550102', '$2a$10$832mH5qQW3Q/PjQW3Q2tReY1.3V3P3G/gX9U8V1n1F9tG4l2P3v4y', 'MINISTRY_LEADER', 'M-20001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Joshua Strong (MINISTRY_LEADER)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-youth-leader', 'Joshua Strong', 'youth@church.com', '+15550103', '$2a$10$832mH5qQW3Q/PjQW3Q2tReY1.3V3P3G/gX9U8V1n1F9tG4l2P3v4y', 'MINISTRY_LEADER', 'M-20002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Grace Miller (MEMBER)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-member1', 'Grace Miller', 'member@church.com', '+15550104', '$2a$10$S9V/6H3Q3P3R3K.k3h3pe7K1P3lCgO3tUaGv.G/gK8VlU1n1F9qG', 'MEMBER', 'M-30001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Caleb Peterson (MEMBER)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-member2', 'Caleb Peterson', 'caleb@church.com', '+15550105', '$2a$10$S9V/6H3Q3P3R3K.k3h3pe7K1P3lCgO3tUaGv.G/gK8VlU1n1F9qG', 'MEMBER', 'M-30002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Hannah Wilson (MEMBER)
INSERT INTO "User" ("id", "fullName", "email", "phone", "password", "role", "memberId", "createdAt", "updatedAt") 
VALUES ('u-member3', 'Hannah Wilson', 'hannah@church.com', '+15550106', '$2a$10$S9V/6H3Q3P3R3K.k3h3pe7K1P3lCgO3tUaGv.G/gK8VlU1n1F9qG', 'MEMBER', 'M-30003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Insert Ministries
INSERT INTO "Ministry" ("id", "name", "description", "leaderId", "status", "createdAt", "updatedAt") 
VALUES ('m-worship', 'Worship & Creative Arts', 'Responsible for Sunday music, tech, and production.', 'u-worship-leader', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Ministry" ("id", "name", "description", "leaderId", "status", "createdAt", "updatedAt") 
VALUES ('m-youth', 'Youth Ministry (Radiant)', 'Nurturing teenagers and high school students in faith.', 'u-youth-leader', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Ministry" ("id", "name", "description", "leaderId", "status", "createdAt", "updatedAt") 
VALUES ('m-outreach', 'Community Outreach', 'Local food drives, charity, and missionary service.', 'u-admin', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update user associations to ministries
UPDATE "User" SET "ministryId" = 'm-worship' WHERE "id" IN ('u-worship-leader', 'u-member1');
UPDATE "User" SET "ministryId" = 'm-youth' WHERE "id" = 'u-youth-leader';

-- 3. Insert Events (Adjust dates into the future relative to current times)
INSERT INTO "Event" ("id", "title", "description", "category", "venue", "capacity", "startDate", "endDate", "registrationDeadline", "status", "ministryId", "organizerId", "createdAt", "updatedAt") 
VALUES ('e-worship-sunday', 'Sunday Morning Worship Experience', 'Join us for a dynamic service of praise, worship, and an inspiring message.', 'Worship', 'Main Sanctuary', 300, NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', NOW() + INTERVAL '6 days', 'OPEN', 'm-worship', 'u-worship-leader', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Event" ("id", "title", "description", "category", "venue", "capacity", "startDate", "endDate", "registrationDeadline", "status", "ministryId", "organizerId", "createdAt", "updatedAt") 
VALUES ('e-youth-camp', 'Youth Explosion Summer Camp 2026', 'A 3-day action-packed retreat for teens. Music, games, workshops, and worship.', 'Retreat', 'Fellowship Forest Campgrounds', 100, NOW() + INTERVAL '30 days', NOW() + INTERVAL '33 days', NOW() + INTERVAL '25 days', 'OPEN', 'm-youth', 'u-youth-leader', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Event" ("id", "title", "description", "category", "venue", "capacity", "startDate", "endDate", "registrationDeadline", "status", "ministryId", "organizerId", "createdAt", "updatedAt") 
VALUES ('e-worship-prayer', 'Midweek Power Prayer Meeting', 'A dedicated time for intercessory prayer, worship, and quiet reflection.', 'Prayer Meeting', 'Chapel Room A', 50, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', NOW() + INTERVAL '1 day', 'OPEN', 'm-worship', 'u-worship-leader', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Event" ("id", "title", "description", "category", "venue", "capacity", "startDate", "endDate", "registrationDeadline", "status", "ministryId", "organizerId", "createdAt", "updatedAt") 
VALUES ('e-outreach-food', 'Community Food Drive & Outreach', 'Distributing food baskets to local families in need. Volunteers welcome!', 'Outreach', 'Downtown Community Center', 150, NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '4 hours', NOW() + INTERVAL '7 days', 'OPEN', 'm-outreach', 'u-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Event" ("id", "title", "description", "category", "venue", "capacity", "startDate", "endDate", "registrationDeadline", "status", "ministryId", "organizerId", "createdAt", "updatedAt") 
VALUES ('e-past-pentecost', 'Pentecost Weekend Conference 2026', 'A special conference reflecting on the Acts of the Apostles, with guest speakers.', 'Conference', 'Main Sanctuary', 250, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '8 hours', NOW() - INTERVAL '9 days', 'COMPLETED', 'm-worship', 'u-worship-leader', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Seed Registrations and Attendance for Completed Past Event
INSERT INTO "Registration" ("id", "eventId", "userId", "registrationType", "attendeeCount", "notes", "status", "registeredAt") 
VALUES ('r-past-1', 'e-past-pentecost', 'u-member1', 'INDIVIDUAL', 1, 'Looking forward to it!', 'ATTENDED', NOW() - INTERVAL '10 days');

INSERT INTO "Attendance" ("id", "registrationId", "eventId", "userId", "checkInTime", "attendanceStatus", "markedById", "markedBy") 
VALUES ('a-past-1', 'r-past-1', 'e-past-pentecost', 'u-member1', NOW() - INTERVAL '7 days' + INTERVAL '30 minutes', 'PRESENT', 'u-worship-leader', 'David Praise');

INSERT INTO "Registration" ("id", "eventId", "userId", "registrationType", "attendeeCount", "notes", "status", "registeredAt") 
VALUES ('r-past-2', 'e-past-pentecost', 'u-member2', 'INDIVIDUAL', 1, 'Hope to learn a lot.', 'ATTENDED', NOW() - INTERVAL '10 days');

INSERT INTO "Attendance" ("id", "registrationId", "eventId", "userId", "checkInTime", "attendanceStatus", "markedById", "markedBy") 
VALUES ('a-past-2', 'r-past-2', 'e-past-pentecost', 'u-member2', NOW() - INTERVAL '7 days' + INTERVAL '45 minutes', 'LATE', 'u-worship-leader', 'David Praise');

INSERT INTO "Registration" ("id", "eventId", "userId", "registrationType", "attendeeCount", "notes", "status", "registeredAt") 
VALUES ('r-past-3', 'e-past-pentecost', 'u-member3', 'INDIVIDUAL', 1, '', 'ABSENT', NOW() - INTERVAL '11 days');

INSERT INTO "Attendance" ("id", "registrationId", "eventId", "userId", "checkInTime", "attendanceStatus", "markedById", "markedBy") 
VALUES ('a-past-3', 'r-past-3', 'e-past-pentecost', 'u-member3', NULL, 'ABSENT', 'u-worship-leader', 'David Praise');

-- 5. Seed Pre-bookings for Future Sunday Worship
INSERT INTO "Registration" ("id", "eventId", "userId", "registrationType", "attendeeCount", "notes", "status", "registeredAt") 
VALUES ('r-future-1', 'e-worship-sunday', 'u-member1', 'INDIVIDUAL', 1, 'Booking seat.', 'CONFIRMED', CURRENT_TIMESTAMP);

INSERT INTO "Attendance" ("id", "registrationId", "eventId", "userId", "checkInTime", "attendanceStatus") 
VALUES ('a-future-1', 'r-future-1', 'e-worship-sunday', 'u-member1', NULL, 'ABSENT');

INSERT INTO "Registration" ("id", "eventId", "userId", "registrationType", "attendeeCount", "notes", "status", "registeredAt") 
VALUES ('r-future-2', 'e-worship-sunday', 'u-member2', 'FAMILY', 2, 'Bringing spouse.', 'CONFIRMED', CURRENT_TIMESTAMP);

INSERT INTO "Attendance" ("id", "registrationId", "eventId", "userId", "checkInTime", "attendanceStatus") 
VALUES ('a-future-2', 'r-future-2', 'e-worship-sunday', 'u-member2', NULL, 'ABSENT');

-- 6. Insert Starter Notifications
INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "isRead", "createdAt") 
VALUES ('n-1', 'u-member1', 'Registration Confirmed', 'You have registered successfully for Sunday Morning Worship Experience.', 'INFO', FALSE, CURRENT_TIMESTAMP);

INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "isRead", "createdAt") 
VALUES ('n-2', 'u-member1', 'Welcome to Church Events!', 'Explore and register for upcoming ministries, services, and outreach events.', 'INFO', TRUE, CURRENT_TIMESTAMP);
