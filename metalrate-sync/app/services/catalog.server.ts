/**
 * Full-catalog fetch keyed by SKU, used by CSV import and preview to match
 * against real Shopify variants.
 *
 * Small/medium catalogs (up to FAST_PATH_CAP) use plain paginated GraphQL,
 * which is effectively instant. Larger catalogs switch to Shopify's Bulk
 * Operations API — the officially recommended mechanism for reading a whole
 * connection without manual pagination or rate-limit bookkeeping — polled
 * synchronously up to a bounded budget so it still fits inside one request.
 * If the bulk job is still running when the budget runs out, the fast-path
 * partial result is returned with truncated=true, and the job itself keeps
 * running server-side on Shopify's infrastructure — a retry shortly after
 * finds it already finished instead of restarting it from scratch.
 */

import prisma from "../db.server";

const FAST_PATH_CAP = 2000;
const PAGE_SIZE = 250;
const BULK_POLL_INTERVAL_MS = 1500;
const BULK_POLL_BUDGET_MS = 45_000;

export interface CatalogVariant {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  price: string;
}

interface AdminClient {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
}

interface RawVariantNode {
  id: string;
  sku: string | null;
  title: string;
  price: string;
  product: { id: string; title: string };
}

const ALL_VARIANTS_QUERY = `#graphql
  query metalRateSyncAllVariants($first: Int!, $after: String) {
    productVariants(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          sku
          title
          price
          product {
            id
            title
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const START_BULK_QUERY = `#graphql
  mutation metalRateSyncStartBulkCatalog {
    bulkOperationRunQuery(
      query: "{ productVariants { edges { node { id sku title price product { id title } } } } }"
    ) {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const POLL_BULK_QUERY = `#graphql
  query metalRateSyncPollBulk($id: ID!) {
    bulkOperation(id: $id) {
      id
      status
      errorCode
      objectCount
      url
      partialDataUrl
    }
  }
`;

function toCatalogVariant(node: RawVariantNode): CatalogVariant {
  return {
    variantId: node.id,
    productId: node.product.id,
    productTitle: node.product.title,
    variantTitle: node.title,
    sku: node.sku ?? "",
    price: node.price,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paginateFast(
  admin: AdminClient,
  cap: number,
): Promise<{ bySku: Map<string, CatalogVariant>; hitCap: boolean }> {
  const bySku = new Map<string, CatalogVariant>();
  let after: string | null = null;
  let fetched = 0;

  while (fetched < cap) {
    const response = await admin.graphql(ALL_VARIANTS_QUERY, {
      variables: { first: PAGE_SIZE, after },
    });
    const payload = (await response.json()) as {
      data?: {
        productVariants?: {
          edges: Array<{ cursor: string; node: RawVariantNode }>;
          pageInfo: { hasNextPage: boolean };
        };
      };
    };
    const connection = payload.data?.productVariants;
    if (!connection) break;

    for (const edge of connection.edges) {
      if (edge.node.sku) bySku.set(edge.node.sku, toCatalogVariant(edge.node));
      fetched += 1;
    }

    if (!connection.pageInfo.hasNextPage) {
      return { bySku, hitCap: false };
    }
    if (fetched >= cap) {
      return { bySku, hitCap: true };
    }
    after = connection.edges[connection.edges.length - 1]?.cursor ?? null;
    if (!after) break;
  }
  return { bySku, hitCap: fetched >= cap };
}

async function downloadAndParseJsonl(
  url: string,
): Promise<Map<string, CatalogVariant>> {
  const bySku = new Map<string, CatalogVariant>();
  const response = await fetch(url);
  const text = await response.text();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const node = JSON.parse(line) as RawVariantNode;
    if (node.sku) bySku.set(node.sku, toCatalogVariant(node));
  }
  return bySku;
}

async function runBulkCatalogFetch(
  admin: AdminClient,
  shop: string,
): Promise<Map<string, CatalogVariant> | null> {
  // Reuse an already-running job for this shop instead of starting a duplicate
  // one every time a merchant retries within the same minute.
  const existing = await prisma.bulkCatalogJob.findUnique({ where: { shop } });
  let operationId =
    existing?.status === "RUNNING" ? existing.shopifyOperationId : null;

  if (!operationId) {
    const startRes = await admin.graphql(START_BULK_QUERY);
    const startPayload = (await startRes.json()) as {
      data?: {
        bulkOperationRunQuery?: {
          bulkOperation?: { id: string; status: string };
          userErrors?: Array<{ message: string }>;
        };
      };
    };
    const started = startPayload.data?.bulkOperationRunQuery;
    if (!started?.bulkOperation || (started.userErrors?.length ?? 0) > 0) {
      return null; // caller falls back to the fast-path partial result
    }
    operationId = started.bulkOperation.id;
    await prisma.bulkCatalogJob.upsert({
      where: { shop },
      update: {
        shopifyOperationId: operationId,
        status: "RUNNING",
        startedAt: new Date(),
        completedAt: null,
        resultUrl: null,
      },
      create: { shop, shopifyOperationId: operationId, status: "RUNNING" },
    });
  }

  const deadline = Date.now() + BULK_POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    const pollRes = await admin.graphql(POLL_BULK_QUERY, {
      variables: { id: operationId },
    });
    const pollPayload = (await pollRes.json()) as {
      data?: {
        bulkOperation?: { id: string; status: string; url: string | null };
      };
    };
    const op = pollPayload.data?.bulkOperation;
    if (!op) break;

    if (op.status === "COMPLETED" && op.url) {
      await prisma.bulkCatalogJob.update({
        where: { shop },
        data: { status: "COMPLETED", completedAt: new Date(), resultUrl: op.url },
      });
      return downloadAndParseJsonl(op.url);
    }
    if (op.status === "FAILED" || op.status === "CANCELED") {
      await prisma.bulkCatalogJob.update({
        where: { shop },
        data: { status: op.status },
      });
      return null;
    }
    await sleep(BULK_POLL_INTERVAL_MS);
  }

  // Still running when our budget ran out. Leave the DB row as RUNNING so
  // the next call finds and polls the same job instead of starting a new one.
  return null;
}

/**
 * @param shop required to track/reuse Bulk Operations job state across
 * requests. Without it, catalogs larger than FAST_PATH_CAP are truncated
 * rather than escalated to a bulk fetch.
 */
export async function fetchCatalogBySku(
  admin: AdminClient,
  shop?: string,
): Promise<{ bySku: Map<string, CatalogVariant>; truncated: boolean }> {
  const fast = await paginateFast(admin, FAST_PATH_CAP);
  if (!fast.hitCap) {
    return { bySku: fast.bySku, truncated: false };
  }
  if (!shop) {
    return { bySku: fast.bySku, truncated: true };
  }

  const full = await runBulkCatalogFetch(admin, shop);
  if (full) {
    return { bySku: full, truncated: false };
  }
  return { bySku: fast.bySku, truncated: true };
}
