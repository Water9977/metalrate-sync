import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useNavigate, useLoaderData, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { runImport, type ImportSummary } from "../services/import.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formulaCount = await prisma.pricingFormula.count({
    where: { shop: session.shop, active: true },
  });
  return { formulaCount };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV file first.", summary: null };
  }

  const text = await file.text();
  return runImport(shop, admin, text);
};

export default function BulkImport() {
  const { formulaCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const importing = fetcher.state !== "idle";
  const summary = fetcher.data?.summary as ImportSummary | null | undefined;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, { isError: !fetcher.data.ok });
    }
  }, [fetcher.state, fetcher.data, shopify]);

  // Download via an authenticated fetch (App Bridge attaches the session
  // token to same-origin requests automatically) then save the blob
  // client-side. Opening the resource route in a new tab would land
  // outside the embedded session and fail auth.
  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/app/products/export-csv");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "metalrate-sync-products.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      shopify.toast.show(
        `Couldn't download CSV: ${error instanceof Error ? error.message : "unknown error"}`,
        { isError: true },
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <s-page heading="Bulk import" inlineSize="large">
      <s-button
        slot="primary-action"
        variant="tertiary"
        onClick={() => navigate("/app/products")}
      >
        Back to Products
      </s-button>

      {formulaCount === 0 && (
        <s-section>
          <s-banner tone="warning" heading="Create a formula first">
            Import can set weights and formula assignments in one pass, but
            you need at least one formula to assign. Go to{" "}
            <s-link href="/app/formulas">Formulas</s-link> first.
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
          <s-button
            variant="secondary"
            icon="import"
            onClick={downloadCsv}
            {...(downloading ? { loading: true } : {})}
          >
            Download current products as CSV
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="2. Upload">
        <fetcher.Form method="POST" encType="multipart/form-data">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Required column: <s-text type="strong">sku</s-text>. Optional:
              a weight column in whatever unit you already use —{" "}
              <s-text type="strong">weight_grams</s-text>,{" "}
              <s-text type="strong">weight_tola</s-text>,{" "}
              <s-text type="strong">weight_vori</s-text>,{" "}
              <s-text type="strong">weight_troy_oz</s-text>, or{" "}
              <s-text type="strong">weight_dwt</s-text> — and{" "}
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

            <s-button
              variant="primary"
              onClick={() => navigate("/app/products")}
            >
              View in Products
            </s-button>
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
