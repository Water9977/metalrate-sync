import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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

  let selectedRun = null;
  if (selectedRunId) {
    selectedRun = await prisma.syncRun.findFirst({
      where: { shop, id: Number(selectedRunId) },
      include: {
        items: { orderBy: { id: "asc" }, take: 500 },
        _count: { select: { items: true } },
      },
    });
  }

  return {
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
  failed: "critical",
  pending: "neutral",
};

export default function History() {
  const { runs, selectedRun } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  return (
    <s-page heading="Sync history" inlineSize="large">
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

      {selectedRun && (
        <s-section heading={`Run #${selectedRun.id} details`}>
          <s-stack direction="block" gap="base">
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
          </s-stack>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
