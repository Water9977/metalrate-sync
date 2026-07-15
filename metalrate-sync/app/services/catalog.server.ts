/**
 * Full-catalog fetch keyed by SKU, used by CSV import to match rows against
 * real Shopify variants. Paginates in-memory up to CATALOG_FETCH_CAP.
 *
 * KNOWN LIMIT: fine for the low thousands of variants. For genuine 10k+
 * SKU catalogs (the scale Chris actually runs at) this should move to the
 * Bulk Operations API instead of paginated in-memory fetch — see
 * architecture.md TODO "Load-test sync engine at 10k+ variants".
 */

const CATALOG_FETCH_CAP = 5000;
const PAGE_SIZE = 250;

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

export async function fetchCatalogBySku(
  admin: AdminClient,
): Promise<{ bySku: Map<string, CatalogVariant>; truncated: boolean }> {
  const bySku = new Map<string, CatalogVariant>();
  let after: string | null = null;
  let fetched = 0;
  let truncated = false;

  while (fetched < CATALOG_FETCH_CAP) {
    const response = await admin.graphql(ALL_VARIANTS_QUERY, {
      variables: { first: PAGE_SIZE, after },
    });
    const payload = (await response.json()) as {
      data?: {
        productVariants?: {
          edges: Array<{
            cursor: string;
            node: {
              id: string;
              sku: string | null;
              title: string;
              price: string;
              product: { id: string; title: string };
            };
          }>;
          pageInfo: { hasNextPage: boolean };
        };
      };
    };

    const connection = payload.data?.productVariants;
    if (!connection) break;

    for (const edge of connection.edges) {
      if (edge.node.sku) {
        bySku.set(edge.node.sku, {
          variantId: edge.node.id,
          productId: edge.node.product.id,
          productTitle: edge.node.product.title,
          variantTitle: edge.node.title,
          sku: edge.node.sku,
          price: edge.node.price,
        });
      }
      fetched += 1;
    }

    if (!connection.pageInfo.hasNextPage) break;
    if (fetched >= CATALOG_FETCH_CAP) {
      truncated = true;
      break;
    }
    after = connection.edges[connection.edges.length - 1]?.cursor ?? null;
    if (!after) break;
  }

  return { bySku, truncated };
}
