-- Replace the old 3-mode "rounding" string with a numeric step + charm-pricing
-- flag, and add a minimum-change threshold so small moves don't reprice.
-- One test-only formula row loses its old rounding value; that's fine, it's
-- throwaway dev data.

ALTER TABLE "PricingFormula" ADD COLUMN "roundingStep" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PricingFormula" ADD COLUMN "endsIn99" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PricingFormula" ADD COLUMN "minChangeAmount" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PricingFormula" DROP COLUMN "rounding";
