import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * Mandatory GDPR compliance webhooks (App Store requirement).
 * MetalRate Sync stores no customer data — only shop-level pricing config —
 * so data requests return nothing and redaction only applies at shop level.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // No customer data stored; nothing to export.
      break;
    case "CUSTOMERS_REDACT":
      // No customer data stored; nothing to redact.
      break;
    case "SHOP_REDACT":
      await prisma.$transaction([
        prisma.syncRun.deleteMany({ where: { shop } }),
        prisma.variantConfig.deleteMany({ where: { shop } }),
        prisma.pricingFormula.deleteMany({ where: { shop } }),
        prisma.manualRate.deleteMany({ where: { shop } }),
        prisma.metalRateCache.deleteMany({ where: { shop } }),
        // P4 fix (audit #2): these two were missing from the redaction wipe.
        prisma.previewSnapshot.deleteMany({ where: { shop } }),
        prisma.bulkCatalogJob.deleteMany({ where: { shop } }),
        prisma.session.deleteMany({ where: { shop } }),
        prisma.shopSettings.deleteMany({ where: { shop } }),
      ]);
      break;
    default:
      break;
  }

  return new Response();
};
