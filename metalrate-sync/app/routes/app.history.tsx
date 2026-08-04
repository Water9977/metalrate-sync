import { useEffect, useRef } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { parseRowId } from "../constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const selectedRunId = url.searchParams.get("run");

  const runs = await prisma.syncRun.findMany({
    where: { shop },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  // A non-numeric ?run= used to reach Prisma as NaN and throw a 500 error
  // page. An unparseable id is simply "not found", which the UI already
  // handles with a clear banner.
  const parsedRunId = parseRowId(selectedRunId);

  let selectedRun = null;
  if (parsedRunId != null) {
    selectedRun = await prisma.syncRun.findFirst({
      where: { shop, id: parsedRunId },
      include: {
        items: { orderBy: { id: "asc" }, take: 500 },
        _count: { select: { items: true } },
      },
    });
  }

  return {
    requestedRunId: selectedRunId,
    runs: runs.map((run) => ({
      id: run.id,
      status: run.status,
      trigger: run.trigger,
      totalItems: run.totalItems,
      updatedCount: run.updatedCount,
      skippedCount: run.skippedCount,
      failedCount: run.failedCount,
      startedAt: run.startedAt.toISOString(),
    })),
    selectedRun: selectedRun
      ? {
          id: selectedRun.id,
          totalItemCount: selectedRun._count.items,
          rateSnapshot: safeParseRates(selectedRun.rateSnapshot),
          items: selectedRun.items.map((item) => ({
            id: item.id,
            title: item.title,
            sku: item.sku,
            oldPrice: item.oldPrice,
            newPrice: item.newPrice,
            status: item.status,
            error: item.error,
          })),
        }
      : null,
  };
};

function safeParseRates(
  raw: string,
): Array<{ metal: string; pricePerGram: number; currency: string; source: string }> {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const RUN_TONE: Record<string, "success" | "warning" | "critical" | "info"> = {
  completed: "success",
  completed_with_errors: "warning",
  failed: "critical",
  running: "info",
  pending: "info",
};

const ITEM_TONE: Record<string, "success" | "warning" | "critical" | "neutral"> = {
  updated: "success",
  skipped_stop_loss: "warning",
  skipped_missing_data: "neutral",
  skipped_plan_limit: "warning",
  failed: "critical",
  pending: "neutral",
};

export default function History() {
  const { runs, selectedRun, requestedRunId } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const detailsRef = useRef<HTMLElement>(null);
  const selectedRunSummary = selectedRun
    ? runs.find((run) => run.id === selectedRun.id)
    : undefined;

  // B1 follow-up: reordering the details section above the Runs table only
  // fixes WHERE it sits in the DOM -- it does nothing for WHERE the viewport
  // is already scrolled to. React Router doesn't reset scroll position on a
  // same-route search-param navigation, so clicking Details on, say, row 20
  // of a long list left the viewport exactly where it was -- looking at the
  // middle of the Runs table, with the (now-reordered) details section
  // sitting further up, still off-screen. Scroll it into view explicitly.
  useEffect(() => {
    if (selectedRun && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedRun?.id]);

  return (
    <s-page heading="Sync history" inlineSize="large">
      {requestedRunId && !selectedRun && (
        // Defensive: a run id in the URL that doesn't resolve to a real row
        // (wrong shop, deleted run, bad id) used to just render nothing with
        // no explanation. Never fail silently.
        <s-section heading="Run not found">
          <s-banner tone="warning">
            Run #{requestedRunId} couldn&apos;t be found. It may have been
            removed, or the link is out of date.
          </s-banner>
        </s-section>
      )}

      {selectedRun && (
        // B1 fix: this used to render AFTER the Runs table below, so on a
        // list long enough to fill the screen (the common case), clicking
        // Details appeared to do nothing -- the new section was there, just
        // off-screen. Showing it first means it's always immediately visible.
        <s-section
          ref={detailsRef as React.Ref<never>}
          heading={`Run #${selectedRun.id} details`}
        >
          <s-stack direction="block" gap="base">
            <s-button
              variant="tertiary"
              onClick={() => setSearchParams({})}
            >
              ← Back to all runs
            </s-button>
            {selectedRun.totalItemCount > selectedRun.items.length && (
              // S3 fix (audit #2): the 500-item cap used to be silent.
              <s-text color="subdued">
                Showing the first {selectedRun.items.length} of{" "}
                {selectedRun.totalItemCount} items in this run.
              </s-text>
            )}
            <s-stack direction="inline" gap="base">
              {selectedRun.rateSnapshot.map((rate) => (
                <s-badge key={rate.metal} tone="info">
                  {rate.metal} {rate.currency} {rate.pricePerGram.toFixed(2)}/g
                  · {rate.source}
                </s-badge>
              ))}
            </s-stack>
            {selectedRun.items.length === 0 ? (
              // A run where every row was "no_change" gets zero SyncRunItem
              // rows by design (see runBatchedApply) -- an empty table with
              // no explanation looked exactly like a bug. Say why instead.
              <s-banner tone="info">
                {selectedRunSummary
                  ? `This run checked ${selectedRunSummary.totalItems} tracked variant${selectedRunSummary.totalItems === 1 ? "" : "s"} against the live rate — all of them already matched, so nothing needed updating.`
                  : "This run had nothing to update — every tracked variant already matched the live rate at the time."}
              </s-banner>
            ) : (
            <s-table variant="auto">
              <s-table-header-row>
                <s-table-header listSlot="primary">Variant</s-table-header>
                <s-table-header format="currency">Old</s-table-header>
                <s-table-header format="currency">New</s-table-header>
                <s-table-header>Status</s-table-header>
                <s-table-header>Error</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {selectedRun.items.map((item) => (
                  <s-table-row key={item.id}>
                    <s-table-cell>
                      <s-stack direction="block" gap="small-300">
                        <s-text>{item.title}</s-text>
                        {item.sku && <s-text color="subdued">{item.sku}</s-text>}
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      {item.oldPrice != null ? item.oldPrice.toFixed(2) : "—"}
                    </s-table-cell>
                    <s-table-cell>
                      {item.newPrice != null ? item.newPrice.toFixed(2) : "—"}
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={ITEM_TONE[item.status] ?? "neutral"}>
                        {item.status.replaceAll("_", " ")}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>{item.error ?? ""}</s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
            )}
          </s-stack>
        </s-section>
      )}

      <s-section heading="Runs">
        {runs.length === 0 ? (
          <s-paragraph>
            No syncs yet. Every run is recorded here with a per-variant audit
            trail — what changed, what was skipped, and why.
          </s-paragraph>
        ) : (
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="primary">Started</s-table-header>
              <s-table-header>Trigger</s-table-header>
              <s-table-header>Updated</s-table-header>
              <s-table-header>Skipped</s-table-header>
              <s-table-header>Failed</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header></s-table-header>
            </s-table-header-row>
            <s-table-body>
              {runs.map((run) => (
                <s-table-row key={run.id}>
                  <s-table-cell>
                    {new Date(run.startedAt).toLocaleString()}
                  </s-table-cell>
                  <s-table-cell>{run.trigger}</s-table-cell>
                  <s-table-cell>{run.updatedCount}</s-table-cell>
                  <s-table-cell>{run.skippedCount}</s-table-cell>
                  <s-table-cell>{run.failedCount}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone={RUN_TONE[run.status] ?? "info"}>
                      {run.status.replaceAll("_", " ")}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-button
                      variant="tertiary"
                      onClick={() => setSearchParams({ run: String(run.id) })}
                    >
                      Details
                    </s-button>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
