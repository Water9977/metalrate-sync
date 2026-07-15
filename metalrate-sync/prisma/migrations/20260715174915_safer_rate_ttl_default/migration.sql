-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "rateProvider" TEXT NOT NULL DEFAULT 'mock',
    "rateApiKey" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "rateTtlMinutes" INTEGER NOT NULL DEFAULT 480,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleInterval" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSettings" ("baseCurrency", "createdAt", "id", "rateApiKey", "rateProvider", "rateTtlMinutes", "scheduleEnabled", "scheduleInterval", "shop", "updatedAt") SELECT "baseCurrency", "createdAt", "id", "rateApiKey", "rateProvider", "rateTtlMinutes", "scheduleEnabled", "scheduleInterval", "shop", "updatedAt" FROM "ShopSettings";
DROP TABLE "ShopSettings";
ALTER TABLE "new_ShopSettings" RENAME TO "ShopSettings";
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
