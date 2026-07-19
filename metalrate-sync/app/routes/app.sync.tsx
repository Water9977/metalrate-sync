import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useNavigate, useLoaderData, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import prisma from "../db.server";
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
  const shop = session.shop;
  const settings = await getSettings(shop);
  try {
    const { rows, rates } = await buildPreview(shop);
    // P3/S1 fix (audit #2): persist what the merchant is being shown, and
    // let Apply reference it by id. The client can no longer forge prices,
    // rates, or freshness — and the Apply request stays a few bytes even
    // with 10k tracked variants (it used to round-trip every row as JSON).
    const snapshot = await prisma.previewSnapshot.upsert({
      where: { shop },
      update: {
        rowsJson: JSON.stringify(rows),
        ratesJson: JSON.stringify(rates),
        createdAt: new Date(),
      },
      create: {
        shop,
        rowsJson: JSON.stringify(rows),
        ratesJson: JSON.stringify(rates),
      },
    });
    return {
      snapshotId: snapshot.id,
      provider: settings.rateProvider,
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
      snapshotId: null,
      provider: settings.rateProvider,
      rows: [] as PreviewRow[],
      rates: [],
      error: error instanceof Error ? error.message : "Preview failed",
    };
  }
};

interface StoredRate {
  metal: string;
  pricePerGram: number;
  pricePerOzt: number;
  currency: string;
  source: string;
  fetchedAt: string;
}

/**
 * Applies exactly what the merchant previewed, loaded back from the
 * server-side snapshot their preview created — the client only names the
 * snapshot, it can't supply prices. The freshness check runs against the
 * server-stored timestamps, so it can't be spoofed either.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  try {
    const payload = (await request.json()) as { snapshotId?: number };
    const snapshot = await prisma.previewSnapshot.findUnique({
      where: { shop },
    });
    if (!snapshot || snapshot.id !== payload.snapshotId) {
      return {
        ok: false,
        runId: null,
        message:
          "This preview is no longer current (it was refreshed elsewhere or already applied). Reload the page and try again.",
      };
    }

    const rows = JSON.parse(snapshot.rowsJson) as PreviewRow[];
    const storedRates = JSON.parse(snapshot.ratesJson) as StoredRate[];
    if (rows.length === 0) {
      return {
        ok: false,
        runId: null,
        message: "Nothing to apply — refresh the preview and try again.",
      };
    }

    const settings = await getSettings(shop);
    const maxAgeMs = settings.rateTtlMinutes * 60_000;
    const now = Date.now();
    const stale = storedRates.some(
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

    const rates: MetalRate[] = storedRates.map((rate) => ({
      metal: rate.metal as MetalRate["metal"],
      pricePerGram: rate.pricePerGram,
      pricePerOzt: rate.pricePerOzt,
      currency: rate.currency,
      source: rate.source,
      fetchedAt: new Date(rate.fetchedAt),
    }));

    const runId = await applyPreviewedRows(admin, shop, rows, rates);
    // One snapshot = one apply. Deleting it makes a double-click or a
    // stale second tab a clean "no longer current" error, not a re-run.
    await prisma.previewSnapshot.delete({ where: { shop } });
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
  const { snapshotId, provider, rows, rates, error } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const syncing = fetcher.state !== "idle";
  // P1 fix (audit #2): applying DEMO rates to a store needs an explicit
  // second click — first click arms, second actually applies.
  const [demoArmed, setDemoArmed] = useState(false);

  const willUpdate = rows.filter((row) => row.status === "will_update");
  const held = rows.filter((row) => row.status === "stop_loss");
  const missing = rows.filter((row) => row.status === "missing_data");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, { isError: !fetcher.data.ok });
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const submitApply = () =>
    fetcher.submit(
      { snapshotId },
      { method: "POST", encType: "application/json" },
    );

  return (
    <s-page heading="Preview &amp; sync" inlineSize="large">
      <s-button
        slot="primary-action"
        variant="primary"
        {...(demoArmed ? { tone: "critical" } : {})}
        {...(syncing ? { loading: true } : {})}
        {...(willUpdate.length === 0 || snapshotId == null
          ? { disabled: true }
          : {})}
        onClick={() => {
          if (provider === "mock" && !demoArmed) {
            setDemoArmed(true);
            return;
          }
          setDemoArmed(false);
          submitApply();
        }}
      >
        {willUpdate.length === 0
          ? "Nothing to update"
          : demoArmed
            ? "Really apply DEMO prices?"
            : `Apply ${willUpdate.length} price change${willUpdate.length === 1 ? "" : "s"}`}
      </s-button>

      {provider === "mock" && !error && rows.length > 0 && (
        <s-section>
          <s-banner tone="warning" heading="These are demo rates">
            Prices below are computed from simulated rates, not the real
            market. Fine for testing — do not apply on a live store. Switch
            to a live source in{" "}
            <s-link href="/app/settings">Settings</s-link>.
          </s-banner>
        </s-section>
      )}

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
