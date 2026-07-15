-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "rateProvider" TEXT NOT NULL DEFAULT 'mock',
    "rateApiKey" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "rateTtlMinutes" INTEGER NOT NULL DEFAULT 15,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleInterval" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MetalRateCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "pricePerOzt" REAL NOT NULL,
    "pricePerGram" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ManualRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricePerGram" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PricingFormula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal" TEXT NOT NULL DEFAULT 'XAU',
    "purityFactor" REAL NOT NULL DEFAULT 1.0,
    "makingChargeType" TEXT NOT NULL DEFAULT 'flat',
    "makingChargeValue" REAL NOT NULL DEFAULT 0,
    "wastagePct" REAL NOT NULL DEFAULT 0,
    "markupType" TEXT NOT NULL DEFAULT 'percent',
    "markupValue" REAL NOT NULL DEFAULT 0,
    "taxPct" REAL NOT NULL DEFAULT 0,
    "rounding" TEXT NOT NULL DEFAULT 'none',
    "stopLossPerGram" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VariantConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL DEFAULT '',
    "variantTitle" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "weightGrams" REAL NOT NULL DEFAULT 0,
    "purityOverride" REAL,
    "formulaId" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariantConfig_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "PricingFormula" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "rateSnapshot" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SyncRunItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "oldPrice" REAL,
    "newPrice" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    CONSTRAINT "SyncRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SyncRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "MetalRateCache_shop_metal_currency_key" ON "MetalRateCache"("shop", "metal", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ManualRate_shop_metal_key" ON "ManualRate"("shop", "metal");

-- CreateIndex
CREATE UNIQUE INDEX "PricingFormula_shop_name_key" ON "PricingFormula"("shop", "name");

-- CreateIndex
CREATE INDEX "VariantConfig_shop_productId_idx" ON "VariantConfig"("shop", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantConfig_shop_variantId_key" ON "VariantConfig"("shop", "variantId");

-- CreateIndex
CREATE INDEX "SyncRun_shop_startedAt_idx" ON "SyncRun"("shop", "startedAt");

-- CreateIndex
CREATE INDEX "SyncRunItem_runId_idx" ON "SyncRunItem"("runId");
