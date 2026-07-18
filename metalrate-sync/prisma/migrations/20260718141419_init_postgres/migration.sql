-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "rateProvider" TEXT NOT NULL DEFAULT 'mock',
    "rateApiKey" TEXT,
    "rateCity" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "rateTtlMinutes" INTEGER NOT NULL DEFAULT 480,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleInterval" INTEGER NOT NULL DEFAULT 60,
    "lastScheduledSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalRateCache" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "pricePerOzt" DOUBLE PRECISION NOT NULL,
    "pricePerGram" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetalRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualRate" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricePerGram" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingFormula" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal" TEXT NOT NULL DEFAULT 'XAU',
    "purityFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "makingChargeType" TEXT NOT NULL DEFAULT 'flat',
    "makingChargeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wastagePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markupType" TEXT NOT NULL DEFAULT 'percent',
    "markupValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundingStep" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endsIn99" BOOLEAN NOT NULL DEFAULT false,
    "minChangeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stopLossPerGram" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantConfig" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL DEFAULT '',
    "variantTitle" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "weightGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purityOverride" DOUBLE PRECISION,
    "formulaId" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "rateSnapshot" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRunItem" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "oldPrice" DOUBLE PRECISION,
    "newPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,

    CONSTRAINT "SyncRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkCatalogJob" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifyOperationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "resultUrl" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkCatalogJob_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "BulkCatalogJob_shop_key" ON "BulkCatalogJob"("shop");

-- AddForeignKey
ALTER TABLE "VariantConfig" ADD CONSTRAINT "VariantConfig_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "PricingFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRunItem" ADD CONSTRAINT "SyncRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
