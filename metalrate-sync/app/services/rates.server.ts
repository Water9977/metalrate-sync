import prisma from "../db.server";
import { SUPPORTED_METALS, INDIA_RATE_CITIES, type MetalCode } from "../constants";

const GRAMS_PER_TROY_OZ = 31.1034768;

/**
 * Server-controlled cache TTL (audit #2 Q5): merchants no longer set this.
 * With the single app-owned key and the global cache, this is the only knob
 * that decides provider-call frequency — and only the operator can turn it
 * (RATE_TTL_MINUTES env var on the host).
 */
export const RATE_TTL_MINUTES = Math.max(
  15,
  Number(process.env.RATE_TTL_MINUTES ?? 480),
);

/**
 * Same reasoning, different knob: how often the scheduler reprices at all.
 * This used to be a free-form merchant field (min 15) — nothing stopped a
 * merchant setting it to 15 and getting 96 automatic Apply cycles/day,
 * hammering their own Shopify Admin API and (once plans exist) bypassing
 * the "2x/day Starter, 5x/day Pro" tier design entirely by self-selecting
 * unlimited. Twice a day (720min) matches the Starter-tier promise and is
 * the sane default for everyone until plan-gating exists.
 */
export const SCHEDULE_INTERVAL_MINUTES = Math.max(
  15,
  Number(process.env.SCHEDULE_INTERVAL_MINUTES ?? 720),
);

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
    // New installs default straight to live rates when the app-owned key is
    // configured — demo rates are only the default fallback in a dev
    // environment with no key set.
    create: {
      shop,
      rateProvider: process.env.METALPRICEAPI_KEY ? "metalpriceapi" : "mock",
    },
  });
}

/**
 * Returns current rates for all supported metals for this shop's configured
 * provider. Mock and manual providers never touch the network or the cache.
 * Live rates go through the GLOBAL cache — one row set per
 * (currency, city) shared by every shop — so no merchant action can
 * multiply provider API calls (audit #2 Q5).
 */
export async function getRates(shop: string): Promise<MetalRate[]> {
  const settings = await getSettings(shop);
  switch (settings.rateProvider) {
    case "metalpriceapi":
      return getLiveRates(settings.baseCurrency, settings.rateCity);
    case "manual":
      return fetchManualRates(shop, settings.baseCurrency);
    case "mock":
    default:
      return mockRates(settings.baseCurrency);
  }
}

/**
 * Q1 fix (audit #2): single-flight per (currency, city). Concurrent
 * callers — any number of shops, tabs, or scheduler runs — share one
 * in-flight provider call. In-process only, which matches the app's
 * documented single-instance deployment (L7).
 */
const inflightRates = new Map<string, Promise<MetalRate[]>>();

function getLiveRates(currency: string, city: string | null): Promise<MetalRate[]> {
  const key = `${currency}:${city ?? ""}`;
  const existing = inflightRates.get(key);
  if (existing) return existing;
  const promise = getLiveRatesUncoalesced(currency, city).finally(() => {
    inflightRates.delete(key);
  });
  inflightRates.set(key, promise);
  return promise;
}

async function getLiveRatesUncoalesced(
  currency: string,
  city: string | null,
): Promise<MetalRate[]> {
  const cacheCity = city ?? "";
  const cached = await prisma.globalRateCache.findMany({
    where: { currency, city: cacheCity },
  });
  const cachedByMetal = new Map(cached.map((row) => [row.metal, row]));

  const ttlMs = RATE_TTL_MINUTES * 60 * 1000;
  const now = Date.now();

  // H1 fix (audit #1), carried over: freshness gates on the MOST RECENT
  // successful update, not on every metal individually — one chronically
  // missing metal can't force a refetch on every call.
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
    const fresh = await fetchMetalPriceApi(currency, city);
    for (const rate of fresh) {
      await prisma.globalRateCache.upsert({
        where: {
          metal_currency_city: {
            metal: rate.metal,
            currency: rate.currency,
            city: cacheCity,
          },
        },
        update: {
          pricePerOzt: rate.pricePerOzt,
          pricePerGram: rate.pricePerGram,
          source: rate.source,
          fetchedAt: rate.fetchedAt,
        },
        create: {
          metal: rate.metal,
          currency: rate.currency,
          city: cacheCity,
          pricePerOzt: rate.pricePerOzt,
          pricePerGram: rate.pricePerGram,
          source: rate.source,
          fetchedAt: rate.fetchedAt,
        },
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
 * MetalPriceAPI (metalpriceapi.com), called with the single APP-OWNED key
 * from the METALPRICEAPI_KEY env var — merchants never see or supply a key
 * (audit #2 Q5 / audit #1 L2). Only the operator can change it, on the
 * hosting dashboard. Returns rates quoted as currency-per-metal when using
 * base=USD&currencies=XAU..., inverted to get the metal price.
 */
async function fetchMetalPriceApi(
  currency: string,
  city: string | null,
): Promise<MetalRate[]> {
  const apiKey = process.env.METALPRICEAPI_KEY;
  if (!apiKey) {
    throw new Error(
      "Live rates aren't configured on this server yet (missing METALPRICEAPI_KEY). Use Manual entry or Demo rates in Settings meanwhile.",
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
  // M-a fix (audit #2): rows are tagged with the currency they were entered
  // in. If the store's base currency changed since, refuse to silently
  // relabel the numbers (a ₹6,800/g rate is not a $6,800/g rate).
  const matching = rows.filter((row) => row.currency === currency);
  if (matching.length === 0) {
    throw new Error(
      `Manual rates were entered in ${rows[0].currency}, but the store currency is now ${currency}. Re-enter them in Settings.`,
    );
  }
  return matching.map((row) => ({
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
