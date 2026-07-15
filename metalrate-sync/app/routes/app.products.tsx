import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const PRODUCTS_QUERY = `#graphql
  query metalRateSyncProducts($first: Int!, $query: String) {
    products(first: $first, query: $query, sortKey: TITLE) {
      edges {
        node {
          id
          title
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
              }
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? "";

  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first: 25, query: search || null },
  });
  const payload = (await response.json()) as {
    data?: {
      products?: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            variants: {
              edges: Array<{
                node: { id: string; title: string; sku: string | null; price: string };
              }>;
            };
          };
        }>;
      };
    };
  };

  const products = (payload.data?.products?.edges ?? []).map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    variants: edge.node.variants.edges.map((variantEdge) => variantEdge.node),
  }));

  const variantIds = products.flatMap((product) =>
    product.variants.map((variant) => variant.id),
  );
  const configs = await prisma.variantConfig.findMany({
    where: { shop, variantId: { in: variantIds } },
  });
  const formulas = await prisma.pricingFormula.findMany({
    where: { shop, active: true },
    orderBy: { name: "asc" },
  });

  return {
    products,
    search,
    formulas: formulas.map((formula) => ({ id: formula.id, name: formula.name })),
    configByVariantId: Object.fromEntries(
      configs.map((config) => [config.variantId, config]),
    ),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "saveVariant") {
    const variantId = String(form.get("variantId"));
    const weightGrams = Number(form.get("weightGrams") ?? 0);
    const formulaIdRaw = String(form.get("formulaId") ?? "");
    const formulaId = formulaIdRaw ? Number(formulaIdRaw) : null;

    if (formulaId != null) {
      const owned = await prisma.pricingFormula.findFirst({
        where: { id: formulaId, shop },
      });
      if (!owned) return { ok: false, message: "Formula not found" };
    }

    await prisma.variantConfig.upsert({
      where: { shop_variantId: { shop, variantId } },
      update: {
        weightGrams,
        formulaId,
        productId: String(form.get("productId")),
        productTitle: String(form.get("productTitle") ?? ""),
        variantTitle: String(form.get("variantTitle") ?? ""),
        sku: String(form.get("sku") ?? ""),
        lastPrice: Number(form.get("currentPrice") ?? 0) || null,
        enabled: weightGrams > 0 && formulaId != null,
      },
      create: {
        shop,
        variantId,
        productId: String(form.get("productId")),
        productTitle: String(form.get("productTitle") ?? ""),
        variantTitle: String(form.get("variantTitle") ?? ""),
        sku: String(form.get("sku") ?? ""),
        weightGrams,
        formulaId,
        lastPrice: Number(form.get("currentPrice") ?? 0) || null,
        enabled: weightGrams > 0 && formulaId != null,
      },
    });
    return { ok: true, message: "Saved" };
  }

  if (intent === "removeVariant") {
    const variantId = String(form.get("variantId"));
    await prisma.variantConfig.deleteMany({ where: { shop, variantId } });
    return { ok: true, message: "Removed from sync" };
  }

  return { ok: false, message: "Unknown action" };
};

function VariantRow({
  product,
  variant,
  config,
  formulas,
}: {
  product: { id: string; title: string };
  variant: { id: string; title: string; sku: string | null; price: string };
  config?: {
    weightGrams: number;
    formulaId: number | null;
    enabled: boolean;
  };
  formulas: Array<{ id: number; name: string }>;
}) {
  const fetcher = useFetcher<typeof action>();
  const saving = fetcher.state !== "idle";
  const tracked = config != null && config.enabled;

  return (
    <s-table-row>
      <s-table-cell>
        <s-stack direction="block" gap="small-300">
          <s-text type="strong">{product.title}</s-text>
          <s-text color="subdued">
            {variant.title === "Default Title" ? "" : variant.title}
            {variant.sku ? ` · ${variant.sku}` : ""}
          </s-text>
        </s-stack>
      </s-table-cell>
      <s-table-cell>{variant.price}</s-table-cell>
      <s-table-cell>
        <fetcher.Form method="POST" id={`variant-form-${variant.id}`}>
          <input type="hidden" name="intent" value="saveVariant" />
          <input type="hidden" name="variantId" value={variant.id} />
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="productTitle" value={product.title} />
          <input type="hidden" name="variantTitle" value={variant.title} />
          <input type="hidden" name="sku" value={variant.sku ?? ""} />
          <input type="hidden" name="currentPrice" value={variant.price} />
          <s-stack direction="inline" gap="base" alignItems="end">
            <s-number-field
              label="Metal weight (g)"
              labelAccessibilityVisibility="exclusive"
              name="weightGrams"
              min={0}
              placeholder="0.00"
              value={config ? String(config.weightGrams) : ""}
            ></s-number-field>
            <s-select
              label="Formula"
              labelAccessibilityVisibility="exclusive"
              name="formulaId"
              value={config?.formulaId != null ? String(config.formulaId) : ""}
            >
              <s-option value="">No formula</s-option>
              {formulas.map((formula) => (
                <s-option key={formula.id} value={String(formula.id)}>
                  {formula.name}
                </s-option>
              ))}
            </s-select>
            <s-button
              type="submit"
              variant="secondary"
              {...(saving ? { loading: true } : {})}
            >
              Save
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={tracked ? "success" : "neutral"}>
          {tracked ? "Tracked" : "Not tracked"}
        </s-badge>
      </s-table-cell>
    </s-table-row>
  );
}

export default function Products() {
  const { products, formulas, configByVariantId, search } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const shopify = useAppBridge();

  useEffect(() => {
    // no-op: reserved for future toast wiring per-row
  }, [shopify]);

  return (
    <s-page heading="Products" inlineSize="large">
      <s-section>
        <s-stack direction="block" gap="base">
          {formulas.length === 0 && (
            <s-banner tone="warning" heading="Create a formula first">
              Variants need a pricing formula before they can be tracked. Go to
              the Formulas page and create one.
            </s-banner>
          )}
          <s-search-field
            label="Search products"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search products…"
            value={search}
            onChange={(event: Event) => {
              const target = event.target as HTMLInputElement;
              setSearchParams(target.value ? { q: target.value } : {});
            }}
          ></s-search-field>

          {products.length === 0 ? (
            <s-paragraph>No products found.</s-paragraph>
          ) : (
            <s-table variant="auto">
              <s-table-header-row>
                <s-table-header listSlot="primary">Product</s-table-header>
                <s-table-header>Current price</s-table-header>
                <s-table-header>Weight &amp; formula</s-table-header>
                <s-table-header>Status</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {products.flatMap((product) =>
                  product.variants.map((variant) => (
                    <VariantRow
                      key={variant.id}
                      product={product}
                      variant={variant}
                      config={configByVariantId[variant.id]}
                      formulas={formulas}
                    />
                  )),
                )}
              </s-table-body>
            </s-table>
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
