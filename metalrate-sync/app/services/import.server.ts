import prisma from "../db.server";
import { fetchCatalogBySku, type CatalogVariant } from "./catalog.server";
import { parseImportCsv } from "./csv.server";
import { PLAN_LIMITS, type PlanTier } from "./billing.server";

export interface ImportSummary {
  matched: number;
  updated: number;
  notFound: string[];
  invalidFormula: Array<{ sku: string; formulaName: string }>;
  truncated: boolean;
  // SKUs that had a valid weight+formula (would normally turn ON) but were
  // kept disabled because the plan's SKU cap was already full by the time
  // the row was processed. Distinct from notFound/invalidFormula -- these
  // rows matched fine, they just didn't fit under the cap.
  planCapped: string[];
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
  planTier: PlanTier,
): Promise<ImportResult> {
  const { rows, error } = parseImportCsv(csvText);
  if (error) {
    return { ok: false, message: error, summary: null };
  }
  if (rows.length === 0) {
    return { ok: false, message: "No data rows found in that CSV.", summary: null };
  }

  // M5 fix: duplicate SKU rows each used to upsert independently and each
  // increment summary.updated, so a CSV with the same SKU twice over-
  // reported how many variants actually changed. Dedupe first, keeping
  // the last occurrence — the same row that would "win" in the DB anyway
  // since upserts for the same SKU overwrite each other in row order.
  const dedupedBySku = new Map(rows.map((row) => [row.sku, row]));
  const dedupedRows = Array.from(dedupedBySku.values());

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
    planCapped: [],
  };

  const matchedVariantIds = dedupedRows
    .map((row) => bySku.get(row.sku)?.variantId)
    .filter((id): id is string => Boolean(id));
  const existingConfigs = await prisma.variantConfig.findMany({
    where: { shop, variantId: { in: matchedVariantIds } },
  });
  const existingByVariantId = new Map(
    existingConfigs.map((config) => [config.variantId, config]),
  );

  // SKU-cap enforcement, mirroring the single-save check in
  // app.products.tsx: a variant already enabled being re-imported (e.g. its
  // weight changed) doesn't consume a new slot, only a row that flips
  // disabled -> enabled does. Track a running count seeded from the shop's
  // current enabled total so rows are capped correctly as they're processed
  // in sequence, not just against the pre-import snapshot.
  const cap = PLAN_LIMITS[planTier].skuCap;
  let enabledCount =
    cap == null
      ? 0
      : await prisma.variantConfig.count({ where: { shop, enabled: true } });

  for (const row of dedupedRows) {
    const variant: CatalogVariant | undefined = bySku.get(row.sku);
    if (!variant) {
      summary.notFound.push(row.sku);
      continue;
    }
    summary.matched += 1;

    const existing = existingByVariantId.get(variant.variantId);
    let formulaId: number | null = existing?.formulaId ?? null;
    if (row.formulaName) {
      const match = formulaByName.get(row.formulaName.toLowerCase());
      if (match) {
        formulaId = match.id;
      } else {
        summary.invalidFormula.push({ sku: row.sku, formulaName: row.formulaName });
      }
    }

    const weightGrams =
      row.weightGrams ?? existing?.weightGrams ?? 0;

    let enabled = weightGrams > 0 && formulaId != null;
    const wasEnabled = existing?.enabled ?? false;
    if (enabled && !wasEnabled && cap != null) {
      if (enabledCount >= cap) {
        enabled = false;
        summary.planCapped.push(row.sku);
      } else {
        enabledCount += 1;
      }
    }

    await prisma.variantConfig.upsert({
      where: { shop_variantId: { shop, variantId: variant.variantId } },
      update: {
        weightGrams,
        formulaId,
        productId: variant.productId,
        productTitle: variant.productTitle,
        variantTitle: variant.variantTitle,
        sku: variant.sku,
        enabled,
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
        enabled,
      },
    });
    summary.updated += 1;
  }

  const cappedNote =
    summary.planCapped.length > 0
      ? ` ${summary.planCapped.length} matched but weren't turned on — your plan's ${cap}-SKU limit is full.`
      : "";
  return {
    ok: true,
    message: `Imported ${summary.updated} of ${rows.length} rows.${cappedNote}`,
    summary,
  };
}
