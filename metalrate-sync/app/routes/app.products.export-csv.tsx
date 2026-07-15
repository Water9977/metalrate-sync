import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { fetchCatalogBySku } from "../services/catalog.server";
import { toCsv } from "../services/csv.server";

/**
 * Resource route (no UI) — lets a merchant download their catalog as a CSV
 * pre-filled with current weight/formula assignments, ready to edit in
 * Excel/Sheets and re-upload via Bulk Import.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const { bySku } = await fetchCatalogBySku(admin, shop);
  const configs = await prisma.variantConfig.findMany({
    where: { shop },
    include: { formula: true },
  });
  const configBySku = new Map(configs.map((config) => [config.sku, config]));

  const rows = Array.from(bySku.values()).map((variant) => {
    const config = configBySku.get(variant.sku);
    return {
      sku: variant.sku,
      product: variant.productTitle,
      variant: variant.variantTitle,
      current_price: variant.price,
      weight_grams: config?.weightGrams ?? "",
      formula: config?.formula?.name ?? "",
    };
  });

  const csv = toCsv(rows, [
    "sku",
    "product",
    "variant",
    "current_price",
    "weight_grams",
    "formula",
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="metalrate-sync-products.csv"',
    },
  });
};
