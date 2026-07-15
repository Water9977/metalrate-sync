import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Link, useLoaderData, useFetcher } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { fetchCatalogBySku } from "../services/catalog.server";
import { parseImportCsv } from "../services/csv.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formulaCount = await prisma.pricingFormula.count({
    where: { shop: session.shop, active: true },
  });
  return { formulaCount };
};

interface ImportSummary {
  matched: number;
  updated: number;
  notFound: string[];
  invalidFormula: Array<{ sku: string; formulaName: string }>;
  truncated: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV file first.", summary: null };
  }

  const text = await file.text();
  const { rows, error } = parseImportCsv(text);
  if (error) {
    return { ok: false, message: error, summary: null };
  }
  if (rows.length === 0) {
    return { ok: false, message: "No data rows found in that CSV.", summary: null };
  }

  const [{ bySku, truncated }, formulas] = await Promise.all([
    fetchCatalogBySku(admin),
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

  const existingConfigs = await prisma.variantConfig.findMany({
    where: {
      shop,
      variantId: { in: rows.map((r) => bySku.get(r.sku)?.variantId ?? "").filter(Boolean) },
    },
  });
  const existingByVariantId = new Map(
    existingConfigs.map((config) => [config.variantId, config]),
  );

  for (const row of rows) {
    const variant = bySku.get(row.sku);
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
};

export default function BulkImport() {
  const { formulaCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const importing = fetcher.state !== "idle";
  const summary = fetcher.data?.summary as ImportSummary | null | undefined;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, { isError: !fetcher.data.ok });
    }
  }, [fetcher.state, fetcher.data, shopify]);

  return (
    <s-page heading="Bulk import" inlineSize="large">
      <Link to="/app/products" viewTransition>
        <s-button slot="primary-action" variant="tertiary">
          Back to Products
        </s-button>
      </Link>

      {formulaCount === 0 && (
        <s-section>
          <s-banner tone="warning" heading="Create a formula first">
            Import can set weights and formula assignments in one pass, but
            you need at least one formula to assign. Go to{" "}
            <Link to="/app/formulas" viewTransition>
              <s-link>Formulas</s-link>
            </Link>{" "}
            first.
          </s-banner>
        </s-section>
      )}

      <s-section heading="1. Get a starting file">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Download your current catalog as a CSV, pre-filled with SKU,
            product name, current price, and any weight/formula already set.
            Edit it in Excel or Google Sheets, then upload it below.
          </s-paragraph>
          <a href="/app/products/export-csv" target="_blank" rel="noreferrer">
            <s-button variant="secondary" icon="import">
              Download current products as CSV
            </s-button>
          </a>
        </s-stack>
      </s-section>

      <s-section heading="2. Upload">
        <fetcher.Form method="POST" encType="multipart/form-data">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Required column: <s-text type="strong">sku</s-text>. Optional:{" "}
              <s-text type="strong">weight_grams</s-text> and{" "}
              <s-text type="strong">formula</s-text> (must match an existing
              formula name exactly). Rows with a SKU the app can't find in
              your store are reported, not silently dropped.
            </s-paragraph>
            <s-drop-zone
              label="CSV file"
              name="file"
              accept=".csv"
            ></s-drop-zone>
            <s-button
              type="submit"
              variant="primary"
              {...(importing ? { loading: true } : {})}
            >
              Import
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      {summary && (
        <s-section heading="Result">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-badge tone="success">{summary.updated} updated</s-badge>
              {summary.notFound.length > 0 && (
                <s-badge tone="warning">
                  {summary.notFound.length} SKU not found
                </s-badge>
              )}
              {summary.invalidFormula.length > 0 && (
                <s-badge tone="critical">
                  {summary.invalidFormula.length} unknown formula name
                </s-badge>
              )}
            </s-stack>

            {summary.truncated && (
              <s-banner tone="warning" heading="Catalog partially scanned">
                Your store has more than 5,000 variants — only the first
                5,000 were checked for matches. Large-catalog support is on
                the roadmap.
              </s-banner>
            )}

            {summary.notFound.length > 0 && (
              <s-box padding="base" background="subdued" borderRadius="base">
                <s-text type="strong">SKUs not found in your store:</s-text>
                <s-paragraph>{summary.notFound.join(", ")}</s-paragraph>
              </s-box>
            )}

            {summary.invalidFormula.length > 0 && (
              <s-box padding="base" background="subdued" borderRadius="base">
                <s-text type="strong">Unknown formula names:</s-text>
                <s-paragraph>
                  {summary.invalidFormula
                    .map((item) => `${item.sku} → "${item.formulaName}"`)
                    .join(", ")}
                </s-paragraph>
              </s-box>
            )}

            <Link to="/app/products" viewTransition>
              <s-button variant="primary">View in Products</s-button>
            </Link>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
