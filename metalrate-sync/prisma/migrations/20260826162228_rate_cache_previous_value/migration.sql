-- Storefront ticker: track each rate row's previous value so a % change
-- and direction can be shown without a separate history table.
-- NOT YET APPLIED to production -- written by hand, review before running
-- `prisma migrate deploy` against the live Railway Postgres instance.

ALTER TABLE "GlobalRateCache" ADD COLUMN "previousPricePerGram" DOUBLE PRECISION;
ALTER TABLE "GlobalRateCache" ADD COLUMN "previousFetchedAt" TIMESTAMP(3);
