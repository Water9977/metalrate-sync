import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
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

  const setupSteps = [
    {
      done: settings.rateProvider !== "mock",
      label: "Choose a live rate source in Settings",
      href: "/app/settings",
    },
    {
      done: formulaCount > 0,
      label: "Create your first pricing formula",
      href: "/app/formulas",
    },
    {
      done: variantCount > 0,
      label: "Assign products and metal weights",
      href: "/app/products",
    },
    {
      done: lastRun != null,
      label: "Preview and run your first price sync",
      href: "/app/sync",
    },
  ];
  const doneCount = setupSteps.filter((step) => step.done).length;
  const setupComplete = doneCount === setupSteps.length;

  return (
    <s-page heading="MetalRate Sync">
      <Link to="/app/sync" style={{ textDecoration: "none" }} viewTransition>
        <s-button slot="primary-action" variant="primary">
          Preview &amp; sync prices
        </s-button>
      </Link>

      {!setupComplete && (
        <s-section heading={`Setup guide (${doneCount}/${setupSteps.length})`}>
          <s-stack direction="block" gap="base">
            {setupSteps.map((step) => (
              <s-stack
                key={step.label}
                direction="inline"
                gap="base"
                alignItems="center"
              >
                <s-icon
                  type={step.done ? "check-circle" : "circle-dashed"}
                  tone={step.done ? "success" : "neutral"}
                ></s-icon>
                {step.done ? (
                  <s-text color="subdued">{step.label}</s-text>
                ) : (
                  <Link to={step.href} viewTransition>
                    <s-link>{step.label}</s-link>
                  </Link>
                )}
              </s-stack>
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
            rate source in{" "}
            <Link to="/app/settings" viewTransition>
              <s-link>Settings</s-link>
            </Link>{" "}
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
            <Link to="/app/history" viewTransition>
              <s-link>View full history</s-link>
            </Link>
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
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
