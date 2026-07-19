import prisma from "../db.server";
import { SUPPORTED_METALS, INDIA_RATE_CITIES, type MetalCode } from "../constants";

const GRAMS_PER_TROY_OZ = 31.1034768;

export interface MetalRate {
  metal: MetalCode;
  currency: string;
  pricePerOzt: number;
  pricePerGram: number;
  source: string;
  fetchedAt: Date;
}

export async function getSettings(shop: string) {
  return prisma.shopSettings.upsert({
    where: { shop },
    update: {},
    create: { shop },
  });
}

/**
 * Returns current rates for all supported metals, respecting the shop's
 * configured provider and cache TTL. Never throws on provider failure —
 * falls back to the last cached rate and flags staleness via fetchedAt.
 */
export async function getRates(shop: string): Promise<MetalRate[]> {
  const settings = await getSettings(shop);
  const cached = await prisma.metalRateCache.findMany({
    where: { shop, currency: settings.baseCurrency },
  });
  const cachedByMetal = new Map(cached.map((row) => [row.metal, row]));

  const ttlMs = settings.rateTtlMinutes * 60 * 1000;
  const now = Date.now();

  // H1 fix: gate freshness on the MOST RECENT successful update, not on
  // every single metal individually passing. The old "every metal must be
  // fresh" check meant one metal the provider chronically can't supply (a
  // partial outage, an unsupported city+metal combo) made isFresh false
  // forever, forcing a live API call on every single page load -- on a
  // 100-request/month free tier that burns the whole quota in a day. Using
  // "most recent" means a normal partial response (3 of 4 metals updated)
  // still counts as a fresh attempt and throttles the next call to once
  // per TTL, same as a full response would -- the chronically-missing
  // metal just keeps serving its last known value in between, exactly like
  // the full-outage stale-cache fallback below already does.
  const hasAllMetals = SUPPORTED_METALS.every((metal) => cachedByMetal.has(metal));
  const mostRecentFetch =
    cached.length > 0
      ? Math.max(...cached.map((row) => row.fetchedAt.getTime()))
      : 0;
  const isFresh = hasAllMetals && now - mostRecentFetch < ttlMs;

  if (isFresh) {
    return cached.map(toMetalRate);
  }

  try {
    const fresh = await fetchFromProvider(
      settings.rateProvider,
      settings.rateApiKey,
      settings.baseCurrency,
      shop,
      settings.rateCity,
    );
    for (const rate of fresh) {
      await prisma.metalRateCache.upsert({
        where: {
          shop_metal_currency: {
            shop,
            metal: rate.metal,
            currency: rate.currency,
          },
        },
        update: {
          pricePerOzt: rate.pricePerOzt,
          pricePerGram: rate.pricePerGram,
          source: rate.source,
          fetchedAt: rate.fetchedAt,
        },
        create: { shop, ...rate },
      });
    }
    // Merge: a metal the provider didn't return this round falls back to
    // its last cached value instead of vanishing from the result entirely.
    const freshByMetal = new Map(fresh.map((rate) => [rate.metal, rate]));
    return SUPPORTED_METALS.flatMap((metal) => {
      const freshRate = freshByMetal.get(metal);
      if (freshRate) return [freshRate];
      const cachedRow = cachedByMetal.get(metal);
      return cachedRow ? [toMetalRate(cachedRow)] : [];
    });
  } catch (error) {
    // Provider down: serve stale cache rather than blocking the merchant.
    if (cached.length > 0) return cached.map(toMetalRate);
    throw error;
  }
}

function toMetalRate(row: {
  metal: string;
  currency: string;
  pricePerOzt: number;
  pricePerGram: number;
  source: string;
  fetchedAt: Date;
}): MetalRate {
  return {
    metal: row.metal as MetalCode,
    currency: row.currency,
    pricePerOzt: row.pricePerOzt,
    pricePerGram: row.pricePerGram,
    source: row.source,
    fetchedAt: row.fetchedAt,
  };
}

async function fetchFromProvider(
  provider: string,
  apiKey: string | null,
  currency: string,
  shop: string,
  city: string | null,
): Promise<MetalRate[]> {
  switch (provider) {
    case "metalpriceapi":
      return fetchMetalPriceApi(apiKey, currency, city);
    case "manual":
      return fetchManualRates(shop, currency);
    case "mock":
    default:
      return mockRates(currency);
  }
}

/** Metal -> requested API symbol, using a city-specific rate when the shop
 * has one configured and that city actually publishes data for the metal
 * (platinum/palladium have no India city data at all; some cities only
 * have gold, not silver — see INDIA_RATE_CITIES). Falls back to the plain
 * global symbol otherwise. */
function symbolFor(metal: MetalCode, city: string | null): string {
  if (!city) return metal;
  const cityInfo = INDIA_RATE_CITIES.find((c) => c.code === city);
  if (!cityInfo) return metal;
  if (metal === "XAU") return `XAU-${city}`;
  if (metal === "XAG" && cityInfo.hasSilver) return `XAG-${city}`;
  return metal; // platinum/palladium: no city data exists, always global
}

/**
 * MetalPriceAPI (metalpriceapi.com) — free tier available, same vendor
 * competitor Metal Updater uses. Returns rates quoted as currency-per-metal
 * when using base=USD&currencies=XAU..., where the value is metal priced in
 * base currency terms (inverted). City-specific symbols (confirmed live
 * against /v1/symbols, e.g. "XAU-MUMB") require a paid plan — the free tier
 * returns a clear "requires a paid plan" error for those, surfaced as-is.
 */
async function fetchMetalPriceApi(
  apiKey: string | null,
  currency: string,
  city: string | null,
): Promise<MetalRate[]> {
  if (!apiKey) {
    throw new Error(
      "MetalPriceAPI selected but no API key saved in Settings.",
    );
  }
  const symbolByMetal = new Map(
    SUPPORTED_METALS.map((metal) => [metal, symbolFor(metal, city)]),
  );
  const requestedSymbols = Array.from(symbolByMetal.values());
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=${encodeURIComponent(currency)}&currencies=${requestedSymbols.join(",")}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MetalPriceAPI HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    success: boolean;
    rates?: Record<string, number>;
    error?: { message?: string; info?: string };
  };
  if (!payload.success || !payload.rates) {
    throw new Error(
      payload.error?.message ??
        payload.error?.info ??
        "MetalPriceAPI returned an error",
    );
  }

  const now = new Date();
  return SUPPORTED_METALS.flatMap((metal) => {
    // API returns metal-per-currency (e.g. XAU per 1 USD); invert for USD/ozt.
    // Always stored under the plain metal code — the city suffix only
    // affects which symbol was requested, not how the rate is keyed.
    const symbol = symbolByMetal.get(metal) ?? metal;
    const inverse = payload.rates?.[symbol];
    if (!inverse || inverse <= 0) return [];
    const pricePerOzt = 1 / inverse;
    return [
      {
        metal,
        currency,
        pricePerOzt,
        pricePerGram: pricePerOzt / GRAMS_PER_TROY_OZ,
        source: symbol === metal ? "metalpriceapi" : `metalpriceapi (${symbol})`,
        fetchedAt: now,
      },
    ];
  });
}

async function fetchManualRates(
  shop: string,
  currency: string,
): Promise<MetalRate[]> {
  const rows = await prisma.manualRate.findMany({ where: { shop } });
  if (rows.length === 0) {
    throw new Error(
      "Manual rates selected but none entered yet. Add them in Settings.",
    );
  }
  return rows.map((row) => ({
    metal: row.metal as MetalCode,
    currency,
    pricePerGram: row.pricePerGram,
    pricePerOzt: row.pricePerGram * GRAMS_PER_TROY_OZ,
    source: "manual",
    fetchedAt: row.updatedAt,
  }));
}

/** Deterministic realistic-looking rates so the app works on a dev store with zero setup. */
function mockRates(currency: string): MetalRate[] {
  const base: Record<MetalCode, number> = {
    XAU: 3345.0,
    XAG: 38.2,
    XPT: 1420.0,
    XPD: 1180.0,
  };
  const now = new Date();
  // Small time-based wobble so consecutive refreshes visibly move.
  const wobble = Math.sin(now.getTime() / 600_000) * 0.004;
  return SUPPORTED_METALS.map((metal) => {
    const pricePerOzt = base[metal] * (1 + wobble);
    return {
      metal,
      currency,
      pricePerOzt,
      pricePerGram: pricePerOzt / GRAMS_PER_TROY_OZ,
      source: "mock",
      fetchedAt: now,
    };
  });
}
