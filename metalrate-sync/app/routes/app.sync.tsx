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
import { buildPreview, executeSync } from "../services/sync.server";
import { METAL_LABELS } from "../services/rates.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  try {
    const { rows, rates } = await buildPreview(session.shop);
    return {
      rows,
      rates: rates.map((rate) => ({
        metal: rate.metal,
        pricePerGram: rate.pricePerGram,
        currency: rate.currency,
        source: rate.source,
      })),
      error: null as string | null,
    };
  } catch (error) {
    return {
      rows: [],
      rates: [],
      error: error instanceof Error ? error.message : "Preview failed",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  try {
    const runId = await executeSync(admin, session.shop, "manual");
    return { ok: true, runId, message: "Sync complete" };
  } catch (error) {
    return {
      ok: false,
      runId: null,
      message: error instanceof Error ? error.message : "Sync failed",
    };
  }
};

const STATUS_META: Record<
  string,
  { label: string; tone: "success" | "neutral" | "warning" | "critical" }
> = {
  will_update: { label: "Will update", tone: "success" },
  no_change: { label: "No change", tone: "neutral" },
  stop_loss: { label: "Stop-loss hold", tone: "warning" },
  missing_data: { label: "Missing data", tone: "critical" },
};

export default function SyncPreview() {
  const { rows, rates, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const syncing = fetcher.state !== "idle";

  const willUpdate = rows.filter((row) => row.status === "will_update");
  const held = rows.filter((row) => row.status === "stop_loss");
  const missing = rows.filter((row) => row.status === "missing_data");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, { isError: !fetcher.data.ok });
    }
  }, [fetcher.state, fetcher.data, shopify]);

  return (
    <s-page heading="Preview &amp; sync" inlineSize="large">
      <s-button
        slot="primary-action"
        variant="primary"
        {...(syncing ? { loading: true } : {})}
        {...(willUpdate.length === 0 ? { disabled: true } : {})}
        onClick={() => fetcher.submit({}, { method: "POST" })}
      >
        {willUpdate.length > 0
          ? `Apply ${willUpdate.length} price change${willUpdate.length === 1 ? "" : "s"}`
          : "Nothing to update"}
      </s-button>

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Preview unavailable">
            {error} — check your rate source in{" "}
            <Link to="/app/settings" viewTransition>
              <s-link>Settings</s-link>
            </Link>
            .
          </s-banner>
        </s-section>
      )}

      {!error && (
        <>
          <s-section heading="Rates used for this preview">
            <s-stack direction="inline" gap="base">
              {rates.map((rate) => (
                <s-badge key={rate.metal} tone="info">
                  {METAL_LABELS[rate.metal as keyof typeof METAL_LABELS] ??
                    rate.metal}{" "}
                  {rate.currency} {rate.pricePerGram.toFixed(2)}/g ·{" "}
                  {rate.source}
                </s-badge>
              ))}
            </s-stack>
          </s-section>

          {fetcher.data?.ok && (
            <s-section>
              <s-banner tone="success" heading="Sync finished">
                Prices were pushed to Shopify.{" "}
                <Link to="/app/history" viewTransition>
                  <s-link>See the full run report</s-link>
                </Link>
                .
              </s-banner>
            </s-section>
          )}

          {held.length > 0 && (
            <s-section>
              <s-banner tone="warning" heading={`${held.length} variants held by stop-loss`}>
                The live rate is below the stop-loss floor on their formulas, so
                these prices were left untouched.
              </s-banner>
            </s-section>
          )}
          {missing.length > 0 && (
            <s-section>
              <s-banner tone="critical" heading={`${missing.length} variants missing data`}>
                These variants need a weight and an active formula on the{" "}
                <Link to="/app/products" viewTransition>
                  <s-link>Products page</s-link>
                </Link>
                .
              </s-banner>
            </s-section>
          )}

          <s-section heading={`Preview (${rows.length} tracked variants)`}>
            {rows.length === 0 ? (
              <s-stack direction="block" gap="base" alignItems="center">
                <s-heading>Nothing tracked yet</s-heading>
                <s-paragraph>
                  Assign weights and formulas to variants on the Products page,
                  then come back here to preview the repricing before anything
                  touches your store.
                </s-paragraph>
                <Link to="/app/products" viewTransition>
                  <s-button variant="primary">Go to Products</s-button>
                </Link>
              </s-stack>
            ) : (
              <s-table variant="auto">
                <s-table-header-row>
                  <s-table-header listSlot="primary">Variant</s-table-header>
                  <s-table-header>Formula</s-table-header>
                  <s-table-header format="currency">Current</s-table-header>
                  <s-table-header format="currency">New</s-table-header>
                  <s-table-header>Change</s-table-header>
                  <s-table-header>Status</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {rows.map((row) => {
                    const meta = STATUS_META[row.status] ?? STATUS_META.no_change;
                    return (
                      <s-table-row key={row.variantId}>
                        <s-table-cell>
                          <s-stack direction="block" gap="small-300">
                            <s-text>{row.title}</s-text>
                            {row.sku && (
                              <s-text color="subdued">{row.sku}</s-text>
                            )}
                          </s-stack>
                        </s-table-cell>
                        <s-table-cell>{row.formulaName}</s-table-cell>
                        <s-table-cell>
                          {row.oldPrice != null ? row.oldPrice.toFixed(2) : "—"}
                        </s-table-cell>
                        <s-table-cell>
                          {row.newPrice != null ? row.newPrice.toFixed(2) : "—"}
                        </s-table-cell>
                        <s-table-cell>
                          {row.changePct != null ? (
                            <s-text
                              tone={row.changePct >= 0 ? "success" : "critical"}
                            >
                              {row.changePct >= 0 ? "+" : ""}
                              {row.changePct.toFixed(2)}%
                            </s-text>
                          ) : (
                            "—"
                          )}
                        </s-table-cell>
                        <s-table-cell>
                          <s-badge tone={meta.tone}>{meta.label}</s-badge>
                        </s-table-cell>
                      </s-table-row>
                    );
                  })}
                </s-table-body>
              </s-table>
            )}
          </s-section>
        </>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
