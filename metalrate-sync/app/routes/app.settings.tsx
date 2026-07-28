import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getSettings, SCHEDULE_INTERVAL_MINUTES } from "../services/rates.server";
import {
  getBillingStatus,
  requireActivePlan,
  PLAN_LIMITS,
} from "../services/billing.server";
import { METAL_LABELS, SUPPORTED_METALS, INDIA_RATE_CITIES } from "../constants";

function describeInterval(minutes: number): string {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "day" : `${days} days`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "hour" : `${hours} hours`;
  }
  return `${minutes} minutes`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const settings = await getSettings(shop);
  const manualRates = await prisma.manualRate.findMany({ where: { shop } });
  // Not re-gated here (app.tsx already redirected if there's no active
  // plan) -- just reading the tier to show real numbers on this page.
  const billing = await getBillingStatus(admin);
  const enabledCount = await prisma.variantConfig.count({
    where: { shop, enabled: true },
  });
  const limits = billing.tier ? PLAN_LIMITS[billing.tier] : null;
  return {
    settings: {
      rateProvider: settings.rateProvider,
      liveRatesAvailable: Boolean(process.env.METALPRICEAPI_KEY),
      rateCity: settings.rateCity ?? "",
      baseCurrency: settings.baseCurrency,
      scheduleEnabled: settings.scheduleEnabled,
      scheduleIntervalMinutes: limits?.scheduleIntervalMinutes ?? SCHEDULE_INTERVAL_MINUTES,
      scheduleFailureCount: settings.scheduleFailureCount,
      lastScheduleError: settings.lastScheduleError,
    },
    plan: {
      tier: billing.tier,
      subscriptionName: billing.subscriptionName,
      skuCap: limits?.skuCap ?? null,
      enabledCount,
    },
    manualRates: Object.fromEntries(
      manualRates.map((rate) => [rate.metal, rate.pricePerGram]),
    ) as Record<string, number>,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Defense in depth: see app.formulas.tsx for why actions can't just
  // trust the app.tsx layout loader already gated this.
  const plan = await requireActivePlan(admin);
  if (!plan.ok) return plan;

  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "saveSettings") {
    const providerInput = String(form.get("rateProvider") ?? "mock");
    const rateCityInput = String(form.get("rateCity") ?? "").trim();
    const currencyInput = String(form.get("baseCurrency") ?? "USD").toUpperCase();
    // Sync frequency is server-controlled and plan-dependent -- not a
    // merchant-set field. Re-derive from the shop's actual tier rather
    // than trusting whatever was last saved.
    const scheduleIntervalMinutes =
      PLAN_LIMITS[plan.tier].scheduleIntervalMinutes;
    await prisma.shopSettings.upsert({
      where: { shop },
      update: {
        rateProvider: providerInput,
        // M1 fix: the city field only renders when provider is
        // metalpriceapi, so saving on manual/demo submits no rateCity at
        // all -- that used to be read as "clear the city" and silently
        // wipe the choice for when the merchant switches back. Only
        // touch rateCity when the field was actually on the form.
        ...(providerInput === "metalpriceapi"
          ? { rateCity: rateCityInput || null }
          : {}),
        baseCurrency: currencyInput,
        scheduleEnabled: form.get("scheduleEnabled") === "on",
        scheduleInterval: scheduleIntervalMinutes,
      },
      create: {
        shop,
        rateProvider: providerInput,
        rateCity: rateCityInput || null,
        baseCurrency: currencyInput,
        scheduleInterval: scheduleIntervalMinutes,
      },
    });
    // No cache bust needed anymore: the rate cache is global and keyed by
    // (currency, city) — switching provider/currency just reads different
    // rows (audit #2 Q2/Q5).
    return { ok: true, message: "Settings saved" };
  }

  if (intent === "saveManualRates") {
    // M-a fix (audit #2): tag each manual rate with the currency it was
    // entered in, so a later base-currency change can't silently relabel
    // the numbers (₹6,800/g is not $6,800/g).
    const { baseCurrency } = await getSettings(shop);
    for (const metal of SUPPORTED_METALS) {
      const raw = String(form.get(`rate_${metal}`) ?? "").trim();
      if (!raw) continue;
      const pricePerGram = Number(raw);
      if (Number.isNaN(pricePerGram) || pricePerGram <= 0) continue;
      await prisma.manualRate.upsert({
        where: { shop_metal: { shop, metal } },
        update: { pricePerGram, currency: baseCurrency },
        create: { shop, metal, pricePerGram, currency: baseCurrency },
      });
    }
    return { ok: true, message: "Manual rates saved" };
  }

  return { ok: false, message: "Unknown action" };
};

export default function Settings() {
  const { settings, plan, manualRates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const manualFetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  // Mirrors the provider dropdown so only the fields relevant to the chosen
  // provider are visible — the API key and city picker mean nothing on
  // manual/demo, and the manual-rates table means nothing on live API.
  const [provider, setProvider] = useState(settings.rateProvider);

  useEffect(() => {
    const data = fetcher.data ?? manualFetcher.data;
    if ((fetcher.state === "idle" || manualFetcher.state === "idle") && data?.message) {
      shopify.toast.show(data.message, { isError: !data.ok });
    }
  }, [fetcher.state, fetcher.data, manualFetcher.state, manualFetcher.data, shopify]);

  return (
    <s-page heading="Settings">
      <s-section heading="Plan">
        <s-stack direction="block" gap="base">
          {plan.tier ? (
            <>
              <s-paragraph>
                <s-text type="strong">
                  {plan.subscriptionName ?? (plan.tier === "pro" ? "Pro" : "Starter")}
                </s-text>{" "}
                plan —{" "}
                {plan.skuCap == null
                  ? `${plan.enabledCount} SKU${plan.enabledCount === 1 ? "" : "s"} tracked, unlimited on this plan`
                  : `${plan.enabledCount} of ${plan.skuCap} SKUs tracked`}
                . Auto-sync every{" "}
                {describeInterval(settings.scheduleIntervalMinutes)}.
              </s-paragraph>
              {plan.skuCap != null && plan.enabledCount >= plan.skuCap && (
                <s-banner tone="warning" heading="SKU limit reached">
                  You're at your plan's {plan.skuCap}-SKU limit. Upgrade to
                  Pro for unlimited SKUs and faster auto-sync.
                </s-banner>
              )}
              <s-button
                variant="secondary"
                onClick={() => navigate("/app/settings/change-plan")}
              >
                Change plan
              </s-button>
            </>
          ) : (
            <s-banner tone="critical" heading="No active plan">
              Your subscription isn't active. Pick a plan to keep syncing.
            </s-banner>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Rate source">
        <fetcher.Form method="POST">
          <input type="hidden" name="intent" value="saveSettings" />
          <s-stack direction="block" gap="base">
            <s-select
              label="Provider"
              name="rateProvider"
              value={provider}
              details="Where live metal prices come from"
              onChange={(event: Event) =>
                setProvider((event.target as HTMLSelectElement).value)
              }
            >
              <s-option value="metalpriceapi">Live market rates</s-option>
              <s-option value="manual">Manual entry (your own board rate)</s-option>
              <s-option value="mock">Demo rates (testing only)</s-option>
            </s-select>

            {provider === "metalpriceapi" && (
              <>
                {!settings.liveRatesAvailable && (
                  <s-banner tone="warning" heading="Live rates not configured">
                    This server doesn't have a rate-provider key configured
                    yet. Use Manual entry or Demo rates until it does.
                  </s-banner>
                )}
                <s-select
                  label="India city rate (optional)"
                  name="rateCity"
                  value={settings.rateCity}
                  details="Use a city-specific gold/silver rate instead of the global spot price. Platinum and palladium always use the global rate (no city data exists for them)."
                >
                  <s-option value="">Global (no city)</s-option>
                  {INDIA_RATE_CITIES.map((city) => (
                    <s-option key={city.code} value={city.code}>
                      {city.label}
                      {!city.hasSilver ? " (gold only)" : ""}
                    </s-option>
                  ))}
                </s-select>
              </>
            )}

            <s-text-field
              label="Base currency"
              name="baseCurrency"
              value={settings.baseCurrency}
              details="ISO code, e.g. USD, INR, AED"
            ></s-text-field>

            <s-divider></s-divider>

            <s-switch
              label="Automatic sync schedule"
              name="scheduleEnabled"
              details={`Reprice automatically every ${describeInterval(settings.scheduleIntervalMinutes)}. Manual preview stays available anytime.`}
              {...(settings.scheduleEnabled ? { checked: true } : {})}
            ></s-switch>

            <s-button
              variant="primary"
              type="submit"
              {...(fetcher.state !== "idle" ? { loading: true } : {})}
            >
              Save settings
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      {provider === "manual" && (
      <s-section heading="Manual rates (per gram)">
        <manualFetcher.Form method="POST">
          <input type="hidden" name="intent" value="saveManualRates" />
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Used when the provider is set to Manual entry. Enter your board
              rate per gram in {settings.baseCurrency}.
            </s-paragraph>
            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              {SUPPORTED_METALS.map((metal) => (
                <s-number-field
                  key={metal}
                  label={`${METAL_LABELS[metal]} (${metal})`}
                  name={`rate_${metal}`}
                  min={0}
                  value={
                    manualRates[metal] != null ? String(manualRates[metal]) : ""
                  }
                ></s-number-field>
              ))}
            </s-grid>
            <s-button
              type="submit"
              {...(manualFetcher.state !== "idle" ? { loading: true } : {})}
            >
              Save manual rates
            </s-button>
          </s-stack>
        </manualFetcher.Form>
      </s-section>
      )}

      <s-section slot="aside" heading="About scheduling">
        {settings.scheduleEnabled && settings.rateProvider === "mock" && (
          <s-banner tone="warning" heading="Scheduling on demo rates">
            Automatic sync is on while the provider is still Demo rates —
            scheduled runs will push simulated prices, not real market
            prices. Switch to a live source or Manual entry before relying
            on this on a real store.
          </s-banner>
        )}
        {!settings.scheduleEnabled && settings.lastScheduleError && (
          <s-banner tone="warning" heading="Automatic sync turned itself off">
            After several failed attempts in a row, scheduling was
            automatically disabled to stop retrying a broken connection.
            Last error: {settings.lastScheduleError}. Fix the underlying
            issue (often a rate source problem — check above) and turn
            scheduling back on.
          </s-banner>
        )}
        {settings.scheduleEnabled && settings.scheduleFailureCount > 0 && (
          <s-banner tone="warning" heading="Recent scheduled sync trouble">
            {settings.scheduleFailureCount} failed attempt
            {settings.scheduleFailureCount === 1 ? "" : "s"} in a row so far.
            Last error: {settings.lastScheduleError}.
          </s-banner>
        )}
        <s-paragraph>
          Scheduled syncs run automatically in the background once enabled,
          checked every minute and triggered when your interval has elapsed.
          This needs the app running continuously — it works once deployed to
          a persistent host (Fly.io, Railway, Render), not on serverless
          hosting. During local development, the scheduler runs too as long
          as `npm run dev` stays open, but Preview &amp; Sync is the more
          reliable way to test manually.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Need help?">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            Formulas, weight units, bulk import, plans and a full FAQ — all in
            one place.
          </s-paragraph>
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
