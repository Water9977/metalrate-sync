import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useNavigate, useLoaderData, useFetcher } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildPreview,
  applyPreviewedRows,
  type PreviewRow,
} from "../services/sync.server";
import { getSettings, type MetalRate } from "../services/rates.server";
import { METAL_LABELS, METAL_TONE } from "../constants";

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
        fetchedAt: rate.fetchedAt.toISOString(),
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

interface ApplyPayload {
  rows: PreviewRow[];
  rates: Array<{
    metal: string;
    pricePerGram: number;
    currency: string;
    source: string;
    fetchedAt: string;
  }>;
}

/**
 * Applies exactly what the merchant previewed — see applyPreviewedRows in
 * sync.server.ts. The rate-freshness check here is what stops a preview
 * left open for hours from applying silently-stale prices: it must be
 * refreshed rather than trusted forever.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  try {
    const payload = (await request.json()) as ApplyPayload;
    if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
      return {
        ok: false,
        runId: null,
        message: "Nothing to apply — refresh the preview and try again.",
      };
    }

    const settings = await getSettings(shop);
    const maxAgeMs = settings.rateTtlMinutes * 60_000;
    const now = Date.now();
    const stale = payload.rates.some(
      (rate) => now - new Date(rate.fetchedAt).getTime() > maxAgeMs,
    );
    if (stale) {
      return {
        ok: false,
        runId: null,
        message:
          "This preview has gone stale since it was loaded. Refresh the page and try again so you're applying current prices.",
      };
    }

    const rates: MetalRate[] = payload.rates.map((rate) => ({
      metal: rate.metal as MetalRate["metal"],
      pricePerGram: rate.pricePerGram,
      currency: rate.currency,
      source: rate.source,
      fetchedAt: new Date(rate.fetchedAt),
      pricePerOzt: rate.pricePerGram * 31.1034768,
    }));

    const runId = await applyPreviewedRows(admin, shop, payload.rows, rates);
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
  const navigate = useNavigate();
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
        onClick={() =>
          // react-router's JsonValue index-signature type rejects typed
          // interfaces (PreviewRow[]) even though this is plain JSON-safe
          // data at runtime -- known friction with useFetcher's JSON submit.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fetcher.submit({ rows, rates } as any, {
            method: "POST",
            encType: "application/json",
          })
        }
      >
        {willUpdate.length > 0
          ? `Apply ${willUpdate.length} price change${willUpdate.length === 1 ? "" : "s"}`
          : "Nothing to update"}
      </s-button>

      {error && (
        <s-section>
          <s-banner tone="critical" heading="Preview unavailable">
            {error} — check your rate source in{" "}
            <s-link href="/app/settings">Settings</s-link>.
          </s-banner>
        </s-section>
      )}

      {!error && (
        <>
          <s-section heading="Rates used for this preview">
            <s-stack direction="inline" gap="base">
              {rates.map((rate) => (
                <s-badge
                  key={rate.metal}
                  tone={
                    METAL_TONE[rate.metal as keyof typeof METAL_TONE] ??
                    "info"
                  }
                >
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
                <s-link href="/app/history">See the full run report</s-link>.
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
                <s-link href="/app/products">Products page</s-link>.
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
                <s-button
                  variant="primary"
                  onClick={() => navigate("/app/products")}
                >
                  Go to Products
                </s-button>
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
