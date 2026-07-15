import prisma from "../db.server";
import { fetchCatalogBySku, type CatalogVariant } from "./catalog.server";
import { parseImportCsv } from "./csv.server";

export interface ImportSummary {
  matched: number;
  updated: number;
  notFound: string[];
  invalidFormula: Array<{ sku: string; formulaName: string }>;
  truncated: boolean;
}

export interface ImportResult {
  ok: boolean;
  message: string;
  summary: ImportSummary | null;
}

interface AdminClient {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
}

/**
 * Bulk import core: parse CSV -> match each row to a real Shopify variant by
 * SKU -> upsert weight/formula config for every match -> report what didn't
 * match instead of silently dropping it. Pulled out of the route so it can
 * be exercised directly (with a mocked admin client) without a live Shopify
 * session — see docs/testing notes in architecture.md.
 */
export async function runImport(
  shop: string,
  admin: AdminClient,
  csvText: string,
): Promise<ImportResult> {
  const { rows, error } = parseImportCsv(csvText);
  if (error) {
    return { ok: false, message: error, summary: null };
  }
  if (rows.length === 0) {
    return { ok: false, message: "No data rows found in that CSV.", summary: null };
  }

  const [{ bySku, truncated }, formulas] = await Promise.all([
    fetchCatalogBySku(admin, shop),
    prisma.pricingFormula.findMany({ where: { shop, active: true } }),
  ]);
  const formulaByName = new Map(
    formulas.map((formula) => [formula.name.toLowerCase(), formula]),
  );

  const summary: ImportSummary = {
    matched: 0,
    updated: 0,
    notFound: [],
    invalidFormula: [],
    truncated,
  };

  const matchedVariantIds = rows
    .map((row) => bySku.get(row.sku)?.variantId)
    .filter((id): id is string => Boolean(id));
  const existingConfigs = await prisma.variantConfig.findMany({
    where: { shop, variantId: { in: matchedVariantIds } },
  });
  const existingByVariantId = new Map(
    existingConfigs.map((config) => [config.variantId, config]),
  );

  for (const row of rows) {
    const variant: CatalogVariant | undefined = bySku.get(row.sku);
    if (!variant) {
      summary.notFound.push(row.sku);
      continue;
    }
    summary.matched += 1;

    let formulaId: number | null =
      existingByVariantId.get(variant.variantId)?.formulaId ?? null;
    if (row.formulaName) {
      const match = formulaByName.get(row.formulaName.toLowerCase());
      if (match) {
        formulaId = match.id;
      } else {
        summary.invalidFormula.push({ sku: row.sku, formulaName: row.formulaName });
      }
    }

    const weightGrams =
      row.weightGrams ?? existingByVariantId.get(variant.variantId)?.weightGrams ?? 0;

    await prisma.variantConfig.upsert({
      where: { shop_variantId: { shop, variantId: variant.variantId } },
      update: {
        weightGrams,
        formulaId,
        productId: variant.productId,
        productTitle: variant.productTitle,
        variantTitle: variant.variantTitle,
        sku: variant.sku,
        enabled: weightGrams > 0 && formulaId != null,
      },
      create: {
        shop,
        variantId: variant.variantId,
        productId: variant.productId,
        productTitle: variant.productTitle,
        variantTitle: variant.variantTitle,
        sku: variant.sku,
        weightGrams,
        formulaId,
        enabled: weightGrams > 0 && formulaId != null,
      },
    });
    summary.updated += 1;
  }

  return {
    ok: true,
    message: `Imported ${summary.updated} of ${rows.length} rows.`,
    summary,
  };
}
