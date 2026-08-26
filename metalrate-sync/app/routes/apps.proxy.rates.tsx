import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getSettings, getRates } from "../services/rates.server";
import { requireActivePlan } from "../services/billing.server";
import { METAL_LABELS, SUPPORTED_METALS } from "../constants";

/**
 * Public, unauthenticated-by-the-browser endpoint behind Shopify's App
 * Proxy (see [app_proxy] in shopify.app.toml) -- a shop's storefront calls
 * https://<shop>/apps/ticker/rates, Shopify proxies it here after signing
 * the request with its own HMAC. `authenticate.public.appProxy` verifies
 * that signature and throws a 400 itself for anything forged, before this
 * loader's body ever runs (confirmed by reading the framework's own source,
 * not assumed).
 *
 * Deliberately reuses `getRates`, the exact same cached rate lookup the
 * admin dashboard and Preview & Sync already call. A busy storefront
 * ticker adds ZERO new MetalPriceAPI requests -- it only ever reads
 * whatever's already in GlobalRateCache, refreshed on the same
 * RATE_TTL_MINUTES schedule regardless of how many customers load the
 * ticker. That's also why this doesn't need its own rate limiting: the
 * expensive part (the provider call) is already decoupled from request
 * volume, and this loader is just a cheap DB read.
 *
 * Returns only public market data (metal, price, % change, direction) --
 * nothing shop-identifying beyond what the merchant already chose to
 * expose by adding the block to their theme, no customer/order data ever
 * touches this path.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.public.appProxy(request);

  // No session means either the shop never installed the app or its
  // offline token is gone (e.g. mid-uninstall) -- nothing to show.
  if (!session || !admin) {
    return jsonResponse({ metals: [] }, 404);
  }

  const shop = session.shop;

  // Same defense-in-depth gate every other mutating/reading action in this
  // app uses: a canceled subscription shouldn't keep serving a "live"
  // ticker to that shop's customers.
  const plan = await requireActivePlan(admin);
  if (!plan.ok) {
    return jsonResponse({ metals: [] }, 403);
  }

  const settings = await getSettings(shop);
  const rates = await getRates(shop);
  const byMetal = new Map(rates.map((rate) => [rate.metal, rate]));

  const metals = SUPPORTED_METALS.map((code) => {
    const rate = byMetal.get(code);
    if (!rate) {
      return { code, label: METAL_LABELS[code], available: false as const };
    }
    const changePct =
      rate.previousPricePerGram && rate.previousPricePerGram > 0
        ? ((rate.pricePerGram - rate.previousPricePerGram) /
            rate.previousPricePerGram) *
          100
        : null;
    const direction: "up" | "down" | "flat" | null =
      changePct == null
        ? null
        : changePct > 0.005
          ? "up"
          : changePct < -0.005
            ? "down"
            : "flat";
    return {
      code,
      label: METAL_LABELS[code],
      available: true as const,
      pricePerGram: round2(rate.pricePerGram),
      pricePerOzt: round2(rate.pricePerOzt),
      currency: rate.currency,
      changePct: changePct == null ? null : Math.round(changePct * 100) / 100,
      direction,
    };
  });

  return jsonResponse({
    currency: settings.baseCurrency,
    fetchedAt: rates[0]?.fetchedAt.toISOString() ?? null,
    metals,
  });
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Underlying data refreshes at most every RATE_TTL_MINUTES (default
      // 8h) -- a short public cache just spares repeat visitors an extra
      // DB round trip through the proxy, it isn't load-bearing for cost.
      "Cache-Control": "public, max-age=300",
    },
  });
}
