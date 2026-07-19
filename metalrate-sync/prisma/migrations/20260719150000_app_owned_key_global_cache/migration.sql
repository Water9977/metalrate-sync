-- App-owned rate key + global cache (audit #2 Q5 / L2):
-- merchants no longer store their own MetalPriceAPI key or cache TTL,
-- and the rate cache is shared globally instead of duplicated per shop.

-- Drop merchant-owned rate-source columns
ALTER TABLE "ShopSettings" DROP COLUMN "rateApiKey";
ALTER TABLE "ShopSettings" DROP COLUMN "rateTtlMinutes";

-- Replace the per-shop cache with a global one (cache data is disposable)
DROP TABLE "MetalRateCache";

CREATE TABLE "GlobalRateCache" (
    "id" SERIAL NOT NULL,
    "metal" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "pricePerOzt" DOUBLE PRECISION NOT NULL,
    "pricePerGram" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalRateCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GlobalRateCache_metal_currency_city_key" ON "GlobalRateCache"("metal", "currency", "city");
