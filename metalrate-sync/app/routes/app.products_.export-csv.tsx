import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { fetchCatalogBySku } from "../services/catalog.server";
import { toCsv } from "../services/csv.server";

/**
 * Resource route (no UI) — lets a merchant download their catalog as a CSV
 * pre-filled with current weight/formula assignments, ready to edit in
 * Excel/Sheets and re-upload via Bulk Import.
 *
 * L5 fix: renamed from the dotted app.products.export-csv.tsx to the
 * products_ (trailing-underscore) convention already used by
 * app.products_.import.tsx. The dotted name only worked because this is a
 * resource route with no component to render under app.products.tsx's
 * layout — the same dotted name on any route with a component reproduces
 * the earlier bulk-import nesting bug. Same URL either way (/app/products/
 * export-csv); this just removes the landmine for the next route added here.
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
