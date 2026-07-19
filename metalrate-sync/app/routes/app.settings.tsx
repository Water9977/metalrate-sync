import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getSettings } from "../services/rates.server";
import { METAL_LABELS, SUPPORTED_METALS, INDIA_RATE_CITIES } from "../constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const settings = await getSettings(shop);
  const manualRates = await prisma.manualRate.findMany({ where: { shop } });
  return {
    settings: {
      rateProvider: settings.rateProvider,
      hasApiKey: Boolean(settings.rateApiKey),
      rateCity: settings.rateCity ?? "",
      baseCurrency: settings.baseCurrency,
      rateTtlMinutes: settings.rateTtlMinutes,
      scheduleEnabled: settings.scheduleEnabled,
      scheduleInterval: settings.scheduleInterval,
      scheduleFailureCount: settings.scheduleFailureCount,
      lastScheduleError: settings.lastScheduleError,
    },
    manualRates: Object.fromEntries(
      manualRates.map((rate) => [rate.metal, rate.pricePerGram]),
    ) as Record<string, number>,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "saveSettings") {
    const providerInput = String(form.get("rateProvider") ?? "mock");
    const apiKeyInput = String(form.get("rateApiKey") ?? "").trim();
    const rateCityInput = String(form.get("rateCity") ?? "").trim();
    const currencyInput = String(form.get("baseCurrency") ?? "USD").toUpperCase();
    const existing = await getSettings(shop);
    await prisma.shopSettings.upsert({
      where: { shop },
      update: {
        rateProvider: providerInput,
        // Keep the stored key when the field is left blank.
        ...(apiKeyInput ? { rateApiKey: apiKeyInput } : {}),
        // M1 fix: the city field only renders when provider is
        // metalpriceapi, so saving on manual/demo submits no rateCity at
        // all -- that used to be read as "clear the city" and silently
        // wipe the choice for when the merchant switches back. Only
        // touch rateCity when the field was actually on the form.
        ...(providerInput === "metalpriceapi"
          ? { rateCity: rateCityInput || null }
          : {}),
        baseCurrency: currencyInput,
        // Q3 fix (audit #2): floor raised from 1 to 15 minutes. A 1-minute
        // TTL let a browsing merchant burn ~60 provider calls/hour.
        rateTtlMinutes: Math.max(15, Number(form.get("rateTtlMinutes") ?? 15)),
        scheduleEnabled: form.get("scheduleEnabled") === "on",
        scheduleInterval: Math.max(
          15,
          Number(form.get("scheduleInterval") ?? 60),
        ),
      },
      create: {
        shop,
        rateProvider: providerInput,
        rateApiKey: apiKeyInput || null,
        rateCity: rateCityInput || null,
        baseCurrency: currencyInput,
      },
    });
    // Q2 fix (audit #2): only bust the rate cache when something that
    // actually affects the rates changed. It used to be unconditional, so
    // toggling the schedule switch forced a fresh provider API call.
    const rateSourceChanged =
      existing.rateProvider !== providerInput ||
      existing.baseCurrency !== currencyInput ||
      Boolean(apiKeyInput) ||
      (providerInput === "metalpriceapi" &&
        (existing.rateCity ?? "") !== rateCityInput);
    if (rateSourceChanged) {
      await prisma.metalRateCache.deleteMany({ where: { shop } });
    }
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
    await prisma.metalRateCache.deleteMany({ where: { shop } });
    return { ok: true, message: "Manual rates saved" };
  }

  return { ok: false, message: "Unknown action" };
};

export default function Settings() {
  const { settings, manualRates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const manualFetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
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
              <s-option value="mock">Demo rates (testing only)</s-option>
              <s-option value="metalpriceapi">MetalPriceAPI (live)</s-option>
              <s-option value="manual">Manual entry (your own board rate)</s-option>
            </s-select>

            {provider === "metalpriceapi" && (
              <>
                <s-text-field
                  label="MetalPriceAPI key"
                  name="rateApiKey"
                  placeholder={
                    settings.hasApiKey ? "•••••••• (saved — leave blank to keep)" : "Paste API key"
                  }
                  details="Get a free key at metalpriceapi.com."
                ></s-text-field>

                <s-select
                  label="India city rate (optional)"
                  name="rateCity"
                  value={settings.rateCity}
                  details="Use a city-specific gold/silver rate instead of the global spot price. Needs a paid MetalPriceAPI plan — leave on Global if you're on the free tier. Platinum and palladium always use the global rate (no city data exists for them)."
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

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-text-field
                label="Base currency"
                name="baseCurrency"
                value={settings.baseCurrency}
                details="ISO code, e.g. USD, INR, AED"
              ></s-text-field>
              <s-number-field
                label="Rate cache (minutes)"
                name="rateTtlMinutes"
                min={15}
                value={String(settings.rateTtlMinutes)}
                details="On a free MetalPriceAPI plan (~100 requests/month) keep this at 480+ (8h) or higher. Lower it only if you're on a paid plan and need fresher rates."
              ></s-number-field>
            </s-grid>

            <s-divider></s-divider>

            <s-switch
              label="Automatic sync schedule"
              name="scheduleEnabled"
              details="Reprice automatically at a fixed interval. Manual preview stays available anytime."
              {...(settings.scheduleEnabled ? { checked: true } : {})}
            ></s-switch>
            <s-number-field
              label="Sync every (minutes)"
              name="scheduleInterval"
              min={15}
              value={String(settings.scheduleInterval)}
              details="Minimum 15 minutes"
            ></s-number-field>

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
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
