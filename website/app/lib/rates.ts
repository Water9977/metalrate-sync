/**
 * Server-only live ticker fetch for the marketing site. Uses a SEPARATE
 * free-tier MetalPriceAPI key from the one the actual Shopify app uses on
 * Railway — the two are intentionally isolated so a traffic spike on the
 * marketing site can never eat into the app's own rate-fetch quota (or vice
 * versa). Same request/response shape as the app's rates.server.ts, kept in
 * sync deliberately since it's already validated against the live API.
 *
 * Free tier caps at 100 requests/month. Next.js's fetch cache means this
 * runs once per revalidate window for ALL visitors combined, not once per
 * visitor — at revalidate: 28800 (8h, ~3x/day) that's ~90 calls/month,
 * leaving headroom for redeploys. Never call this without the `next`
 * revalidate option.
 *
 * No up/down direction indicator: MetalPriceAPI's /change endpoint requires
 * a paid plan for more than one currency at a time, and four separate
 * single-currency calls would blow the monthly cap. Showing a fabricated
 * direction would violate the "real data only" rule this project holds
 * everywhere else, so it's just not shown here — a live price + timestamp
 * is honest, a guessed arrow isn't.
 */

const REVALIDATE_SECONDS = 8 * 60 * 60; // ~3x/day

export interface LiveTick {
  metal: "GOLD" | "SILVER" | "PLATINUM" | "PALLADIUM";
  price: string;
}

export interface LiveRatesResult {
  ticks: LiveTick[];
  fetchedAt: Date;
}

const SYMBOL_TO_METAL: Record<string, LiveTick["metal"]> = {
  XAU: "GOLD",
  XAG: "SILVER",
  XPT: "PLATINUM",
  XPD: "PALLADIUM",
};
const METAL_ORDER: LiveTick["metal"][] = [
  "GOLD",
  "SILVER",
  "PLATINUM",
  "PALLADIUM",
];

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function getLiveRates(): Promise<LiveRatesResult | null> {
  const apiKey = process.env.METALPRICEAPI_SITE_KEY;
  if (!apiKey) return null;

  const symbols = Object.keys(SYMBOL_TO_METAL);
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=USD&currencies=${symbols.join(",")}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      success: boolean;
      rates?: Record<string, number>;
    };
    if (!payload.success || !payload.rates) return null;

    const byMetal = new Map<LiveTick["metal"], string>();
    for (const symbol of symbols) {
      const inverse = payload.rates[symbol];
      if (!inverse || inverse <= 0) continue;
      const pricePerOzt = 1 / inverse;
      byMetal.set(SYMBOL_TO_METAL[symbol], formatPrice(pricePerOzt));
    }
    if (byMetal.size !== METAL_ORDER.length) return null;

    return {
      ticks: METAL_ORDER.map((metal) => ({
        metal,
        price: byMetal.get(metal)!,
      })),
      fetchedAt: new Date(),
    };
  } catch {
    return null;
  }
}
