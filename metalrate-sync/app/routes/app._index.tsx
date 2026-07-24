import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useNavigate, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getRates, getSettings } from "../services/rates.server";
import { METAL_LABELS, METAL_TONE } from "../constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, formulaCount, variantCount, lastRun] = await Promise.all([
    getSettings(shop),
    prisma.pricingFormula.count({ where: { shop, active: true } }),
    prisma.variantConfig.count({ where: { shop, enabled: true } }),
    prisma.syncRun.findFirst({
      where: { shop },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  let rates: Awaited<ReturnType<typeof getRates>> = [];
  let ratesError: string | null = null;
  try {
    rates = await getRates(shop);
  } catch (error) {
    ratesError = error instanceof Error ? error.message : "Could not load rates";
  }

  return {
    settings,
    formulaCount,
    variantCount,
    rates: rates.map((rate) => ({
      ...rate,
      fetchedAt: rate.fetchedAt.toISOString(),
    })),
    ratesError,
    lastRun: lastRun
      ? {
          id: lastRun.id,
          status: lastRun.status,
          updatedCount: lastRun.updatedCount,
          failedCount: lastRun.failedCount,
          skippedCount: lastRun.skippedCount,
          startedAt: lastRun.startedAt.toISOString(),
        }
      : null,
  };
};

const RUN_STATUS_TONE: Record<string, "success" | "critical" | "warning" | "info"> = {
  completed: "success",
  completed_with_errors: "warning",
  failed: "critical",
  running: "info",
  pending: "info",
};

export default function Dashboard() {
  const { settings, formulaCount, variantCount, rates, ratesError, lastRun } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const setupSteps = [
    {
      done: settings.rateProvider !== "mock",
      label: "Choose your rate source",
      description:
        "Settings → pick where live gold/silver prices come from. Demo rates work for exploring, switch to a live source before real syncing.",
      href: "/app/settings",
    },
    {
      done: formulaCount > 0,
      label: "Create a pricing formula",
      description:
        "A formula is your pricing recipe: metal + purity + your charges. Example: 22K gold + 10% making charge + 3% tax. Make one per product type.",
      href: "/app/formulas",
    },
    {
      done: variantCount > 0,
      label: "Tell us what your products weigh",
      description:
        "Pick a product, enter its metal weight, choose which formula prices it. Lots of products? Use Bulk import to do it from a spreadsheet.",
      href: "/app/products",
    },
    {
      done: lastRun != null,
      label: "Preview, then sync",
      description:
        "See every price change before it happens — nothing touches your store until you click Apply.",
      href: "/app/sync",
    },
  ];
  const doneCount = setupSteps.filter((step) => step.done).length;
  const setupComplete = doneCount === setupSteps.length;

  return (
    <s-page heading="MetalRate Sync">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/sync")}
      >
        Preview &amp; sync prices
      </s-button>

      {!setupComplete && (
        <s-section heading={`Get set up (${doneCount}/${setupSteps.length} done)`}>
          <s-stack direction="block" gap="base">
            <s-paragraph>
              <s-text color="subdued">
                Four steps, about five minutes. Your store's prices are never
                touched until you preview and approve a sync yourself.
              </s-text>
            </s-paragraph>
            {setupSteps.map((step, index) => (
              <s-box
                key={step.label}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background={step.done ? "subdued" : "base"}
              >
                <s-stack direction="inline" gap="base" alignItems="center">
                  <s-badge tone={step.done ? "success" : "info"}>
                    {step.done ? "✓" : String(index + 1)}
                  </s-badge>
                  <s-stack direction="block" gap="small-300">
                    {step.done ? (
                      <s-text color="subdued">{step.label}</s-text>
                    ) : (
                      <s-link href={step.href}>
                        <s-text type="strong">{step.label}</s-text>
                      </s-link>
                    )}
                    {!step.done && (
                      <s-text color="subdued">{step.description}</s-text>
                    )}
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        </s-section>
      )}

      <s-section heading="Live metal rates">
        {ratesError ? (
          <s-banner tone="warning" heading="Rates unavailable">
            {ratesError}
          </s-banner>
        ) : (
          <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base">
            {rates.map((rate) => (
              <s-box
                key={rate.metal}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small-300">
                  <s-badge
                    tone={
                      METAL_TONE[rate.metal as keyof typeof METAL_TONE] ??
                      "neutral"
                    }
                  >
                    {METAL_LABELS[rate.metal as keyof typeof METAL_LABELS] ??
                      rate.metal}
                  </s-badge>
                  <s-heading>
                    {rate.currency} {rate.pricePerOzt.toFixed(2)}/ozt
                  </s-heading>
                  <s-text color="subdued">
                    {rate.pricePerGram.toFixed(2)}/g · {rate.source}
                  </s-text>
                </s-stack>
              </s-box>
            ))}
          </s-grid>
        )}
        {settings.rateProvider === "mock" && !ratesError && (
          <s-banner tone="info" heading="Demo rates active">
            These are simulated rates so you can explore the app. Pick a real
            rate source in <s-link href="/app/settings">Settings</s-link>{" "}
            before syncing live prices.
          </s-banner>
        )}
      </s-section>

      <s-section heading="Last sync">
        {lastRun ? (
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-badge tone={RUN_STATUS_TONE[lastRun.status] ?? "info"}>
                {lastRun.status.replaceAll("_", " ")}
              </s-badge>
              <s-text color="subdued">
                {new Date(lastRun.startedAt).toLocaleString()}
              </s-text>
            </s-stack>
            <s-paragraph>
              {lastRun.updatedCount} updated · {lastRun.skippedCount} skipped ·{" "}
              {lastRun.failedCount} failed
            </s-paragraph>
            <s-link href="/app/history">View full history</s-link>
          </s-stack>
        ) : (
          <s-paragraph>
            No syncs yet. Configure products and formulas, then run your first
            preview.
          </s-paragraph>
        )}
      </s-section>

      <s-section slot="aside" heading="At a glance">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text type="strong">{variantCount}</s-text>{" "}
            <s-text color="subdued">variants tracked</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text type="strong">{formulaCount}</s-text>{" "}
            <s-text color="subdued">active formulas</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text type="strong">
              {settings.scheduleEnabled
                ? `Every ${settings.scheduleInterval} min`
                : "Manual"}
            </s-text>{" "}
            <s-text color="subdued">sync schedule</s-text>
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="How it works">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text color="subdued">
              Your price = weight × purity × live rate, plus your making
              charges, markup and tax. When the metal market moves, Preview
              &amp; Sync shows what every price would become — you approve it
              before anything changes in your store. Every sync is logged in
              History.
            </s-text>
          </s-paragraph>
          <s-link href="/app/formulas">Manage formulas</s-link>
          <s-link href="/app/products/import">Bulk import from spreadsheet</s-link>
          <s-link href="https://metalratesync.com/docs" target="_blank">
            Full documentation &amp; guide
          </s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
