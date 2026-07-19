ALTER TABLE "ShopSettings" ADD COLUMN "scheduleFailureCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ShopSettings" ADD COLUMN "lastScheduleError" TEXT;
