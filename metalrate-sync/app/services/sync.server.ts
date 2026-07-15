import prisma from "../db.server";
import { computePrice, isChangeBelowThreshold } from "./pricing.server";
import { getRates, type MetalRate } from "./rates.server";

/**
 * The core of MetalRate Sync. Reliability at 10k+ SKU scale is the product's
 * whole wedge (see competition-analysis.md), so this module is deliberately
 * conservative: per-product batches within API limits, retries with backoff
 * on throttling, and a persistent per-variant audit trail for every run.
 */

// Admin API allows up to 250 variants per productVariantsBulkUpdate call.
const MAX_VARIANTS_PER_CALL = 250;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 750;

export interface PreviewRow {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  oldPrice: number | null;
  newPrice: number | null;
  changePct: number | null;
  status: "will_update" | "no_change" | "stop_loss" | "missing_data";
  formulaName: string;
}

interface AdminClient {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
}

export async function buildPreview(shop: string): Promise<{
  rows: PreviewRow[];
  rates: MetalRate[];
}> {
  const rates = await getRates(shop);
  const rateByMetal = new Map(rates.map((rate) => [rate.metal, rate]));

  const configs = await prisma.variantConfig.findMany({
    where: { shop, enabled: true },
    include: { formula: true },
    orderBy: [{ productTitle: "asc" }, { variantTitle: "asc" }],
  });

  const rows: PreviewRow[] = configs.map((config) => {
    if (!config.formula || !config.formula.active || config.weightGrams <= 0) {
      return {
        variantId: config.variantId,
        productId: config.productId,
        title: `${config.productTitle} — ${config.variantTitle}`.trim(),
        sku: config.sku,
        oldPrice: config.lastPrice,
        newPrice: null,
        changePct: null,
        status: "missing_data",
        formulaName: config.formula?.name ?? "(none)",
      };
    }

    const rate = rateByMetal.get(config.formula.metal as MetalRate["metal"]);
    if (!rate) {
      return {
        variantId: config.variantId,
        productId: config.productId,
        title: `${config.productTitle} — ${config.variantTitle}`.trim(),
        sku: config.sku,
        oldPrice: config.lastPrice,
        newPrice: null,
        changePct: null,
        status: "missing_data",
        formulaName: config.formula.name,
      };
    }

    const breakdown = computePrice(config.formula, {
      weightGrams: config.weightGrams,
      purityFactor: config.purityOverride ?? config.formula.purityFactor,
      ratePerGram: rate.pricePerGram,
    });

    if (breakdown.stopLossTriggered) {
      return {
        variantId: config.variantId,
        productId: config.productId,
        title: `${config.productTitle} — ${config.variantTitle}`.trim(),
        sku: config.sku,
        oldPrice: config.lastPrice,
        newPrice: null,
        changePct: null,
        status: "stop_loss",
        formulaName: config.formula.name,
      };
    }

    const oldPrice = config.lastPrice;
    const newPrice = breakdown.finalPrice;
    const unchanged = isChangeBelowThreshold(
      oldPrice,
      newPrice,
      config.formula.minChangeAmount,
    );

    return {
      variantId: config.variantId,
      productId: config.productId,
      title: `${config.productTitle} — ${config.variantTitle}`.trim(),
      sku: config.sku,
      oldPrice,
      newPrice,
      changePct:
        oldPrice != null && oldPrice > 0
          ? ((newPrice - oldPrice) / oldPrice) * 100
          : null,
      status: unchanged ? "no_change" : "will_update",
      formulaName: config.formula.name,
    };
  });

  return { rows, rates };
}

const BULK_UPDATE_MUTATION = `#graphql
  mutation metalRateSyncBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
      productVariants {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function executeSync(
  admin: AdminClient,
  shop: string,
  trigger: "manual" | "scheduled" = "manual",
): Promise<number> {
  const { rows, rates } = await buildPreview(shop);
  const actionable = rows.filter((row) => row.status === "will_update");
  const skipped = rows.filter(
    (row) => row.status === "stop_loss" || row.status === "no_change",
  );

  const run = await prisma.syncRun.create({
    data: {
      shop,
      status: "running",
      trigger,
      totalItems: rows.length,
      skippedCount: skipped.length,
      rateSnapshot: JSON.stringify(
        rates.map((rate) => ({
          metal: rate.metal,
          pricePerGram: rate.pricePerGram,
          currency: rate.currency,
          source: rate.source,
        })),
      ),
      items: {
        create: rows
          .filter((row) => row.status !== "no_change")
          .map((row) => ({
            variantId: row.variantId,
            sku: row.sku,
            title: row.title,
            oldPrice: row.oldPrice,
            newPrice: row.newPrice,
            status:
              row.status === "will_update"
                ? "pending"
                : row.status === "stop_loss"
                  ? "skipped_stop_loss"
                  : "skipped_missing_data",
          })),
      },
    },
  });

  // Group actionable rows by product — the mutation operates per product.
  const byProduct = new Map<string, PreviewRow[]>();
  for (const row of actionable) {
    const list = byProduct.get(row.productId) ?? [];
    list.push(row);
    byProduct.set(row.productId, list);
  }

  let updated = 0;
  let failed = 0;

  for (const [productId, productRows] of byProduct) {
    for (
      let offset = 0;
      offset < productRows.length;
      offset += MAX_VARIANTS_PER_CALL
    ) {
      const chunk = productRows.slice(offset, offset + MAX_VARIANTS_PER_CALL);
      const result = await updateChunkWithRetry(admin, productId, chunk);

      for (const row of chunk) {
        const rowFailed = result.failedVariantIds.has(row.variantId);
        if (rowFailed) {
          failed += 1;
        } else {
          updated += 1;
          await prisma.variantConfig.updateMany({
            where: { shop, variantId: row.variantId },
            data: { lastPrice: row.newPrice ?? undefined },
          });
        }
        await prisma.syncRunItem.updateMany({
          where: { runId: run.id, variantId: row.variantId },
          data: {
            status: rowFailed ? "failed" : "updated",
            error: rowFailed
              ? (result.errorsByVariantId.get(row.variantId) ??
                result.chunkError ??
                "Unknown error")
              : null,
          },
        });
      }
    }
  }

  await prisma.syncRun.update({
    where: { id: run.id },
    data: {
      status:
        failed === 0
          ? "completed"
          : updated > 0
            ? "completed_with_errors"
            : "failed",
      updatedCount: updated,
      failedCount: failed,
      finishedAt: new Date(),
    },
  });

  return run.id;
}

interface ChunkResult {
  failedVariantIds: Set<string>;
  errorsByVariantId: Map<string, string>;
  chunkError: string | null;
}

async function updateChunkWithRetry(
  admin: AdminClient,
  productId: string,
  chunk: PreviewRow[],
): Promise<ChunkResult> {
  const failedVariantIds = new Set<string>();
  const errorsByVariantId = new Map<string, string>();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await admin.graphql(BULK_UPDATE_MUTATION, {
        variables: {
          productId,
          variants: chunk.map((row) => ({
            id: row.variantId,
            price: (row.newPrice ?? 0).toFixed(2),
          })),
        },
      });
      const payload = (await response.json()) as {
        data?: {
          productVariantsBulkUpdate?: {
            productVariants?: Array<{ id: string }>;
            userErrors?: Array<{ field?: string[] | null; message: string }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      if (payload.errors?.length) {
        const throttled = payload.errors.some((error) =>
          /throttl/i.test(error.message),
        );
        if (throttled && attempt < MAX_RETRIES) {
          await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
          continue;
        }
        for (const row of chunk) failedVariantIds.add(row.variantId);
        return {
          failedVariantIds,
          errorsByVariantId,
          chunkError: payload.errors.map((error) => error.message).join("; "),
        };
      }

      const mutationResult = payload.data?.productVariantsBulkUpdate;
      const succeededIds = new Set(
        (mutationResult?.productVariants ?? []).map((variant) => variant.id),
      );
      for (const userError of mutationResult?.userErrors ?? []) {
        // userErrors reference variants by index in the field path, e.g. ["variants", "3", "price"]
        const indexSegment = userError.field?.[1];
        const index = indexSegment != null ? Number(indexSegment) : NaN;
        if (!Number.isNaN(index) && chunk[index]) {
          failedVariantIds.add(chunk[index].variantId);
          errorsByVariantId.set(chunk[index].variantId, userError.message);
        }
      }
      // With allowPartialUpdates, anything not echoed back and not in userErrors
      // is treated as failed so nothing silently disappears.
      for (const row of chunk) {
        if (!succeededIds.has(row.variantId) && !failedVariantIds.has(row.variantId)) {
          if ((mutationResult?.userErrors ?? []).length > 0) {
            failedVariantIds.add(row.variantId);
            errorsByVariantId.set(
              row.variantId,
              "Not confirmed by Shopify in bulk update response",
            );
          }
        }
      }
      return { failedVariantIds, errorsByVariantId, chunkError: null };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
        continue;
      }
      for (const row of chunk) failedVariantIds.add(row.variantId);
      return {
        failedVariantIds,
        errorsByVariantId,
        chunkError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { failedVariantIds, errorsByVariantId, chunkError: "Retries exhausted" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
