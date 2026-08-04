import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticateWebhook } from "../services/webhooks.server";

/**
 * Mandatory GDPR compliance webhooks (App Store requirement).
 * MetalRate Sync stores no customer data — only shop-level pricing config —
 * so data requests return nothing and redaction only applies at shop level.
 *
 * Uses authenticateWebhook rather than authenticate.webhook directly: these
 * topics arrive precisely when a shop has uninstalled, which is the exact
 * case the framework 500s on. See webhooks.server.ts for the full story.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticateWebhook(request);

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
        // (rate cache is global now — no shop-scoped rows to redact)
        // P4 fix (audit #2): these were missing from the redaction wipe.
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
