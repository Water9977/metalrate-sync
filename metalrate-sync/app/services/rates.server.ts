import prisma from "../db.server";
import { SUPPORTED_METALS, type MetalCode } from "../constants";

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
  /**
   * pricePerGram from immediately before this row's most recent refresh.
   * Only ever populated for the live ("metalpriceapi") provider — manual
   * and mock rates don't have a meaningful "previous" value, so this is
   * always null for those. Powers the storefront ticker's %/direction; not
   * used anywhere else today.
   */
  previousPricePerGram: number | null;
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
      return getLiveRates(settings.baseCurrency);
    case "manual":
      return fetchManualRates(shop, settings.baseCurrency);
    case "mock":
    default:
      return mockRates(settings.baseCurrency);
  }
}

/**
 * Q1 fix (audit #2): single-flight per currency. Concurrent callers — any
 * number of shops, tabs, or scheduler runs — share one in-flight provider
 * call. In-process only, which matches the app's documented single-instance
 * deployment (L7).
 */
const inflightRates = new Map<string, Promise<MetalRate[]>>();

function getLiveRates(currency: string): Promise<MetalRate[]> {
  const existing = inflightRates.get(currency);
  if (existing) return existing;
  const promise = getLiveRatesUncoalesced(currency).finally(() => {
    inflightRates.delete(currency);
  });
  inflightRates.set(currency, promise);
  return promise;
}

async function getLiveRatesUncoalesced(
  currency: string,
): Promise<MetalRate[]> {
  const cached = await prisma.globalRateCache.findMany({
    where: { currency, city: "" },
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
    const fresh = await fetchMetalPriceApi(currency);
    for (const rate of fresh) {
      // Carry the row's pre-refresh value forward as "previous" -- read
      // from cachedByMetal (this function's own pre-refresh snapshot,
      // taken above) rather than the DB, so this stays correct even under
      // the single-flight lock's coalesced concurrent callers. A metal
      // that's never been cached before has no previous value.
      const priorRow = cachedByMetal.get(rate.metal);
      await prisma.globalRateCache.upsert({
        where: {
          metal_currency_city: {
            metal: rate.metal,
            currency: rate.currency,
            city: "",
          },
        },
        update: {
          pricePerOzt: rate.pricePerOzt,
          pricePerGram: rate.pricePerGram,
          source: rate.source,
          fetchedAt: rate.fetchedAt,
          previousPricePerGram: priorRow?.pricePerGram ?? null,
          previousFetchedAt: priorRow?.fetchedAt ?? null,
        },
        create: {
          metal: rate.metal,
          currency: rate.currency,
          city: "",
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
      if (freshRate) {
        const priorRow = cachedByMetal.get(metal);
        return [{ ...freshRate, previousPricePerGram: priorRow?.pricePerGram ?? null }];
      }
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
  previousPricePerGram?: number | null;
}): MetalRate {
  return {
    metal: row.metal as MetalCode,
    currency: row.currency,
    pricePerOzt: row.pricePerOzt,
    pricePerGram: row.pricePerGram,
    source: row.source,
    fetchedAt: row.fetchedAt,
    previousPricePerGram: row.previousPricePerGram ?? null,
  };
}

/**
 * MetalPriceAPI (metalpriceapi.com), called with the single APP-OWNED key
 * from the METALPRICEAPI_KEY env var — merchants never see or supply a key
 * (audit #2 Q5 / audit #1 L2). Only the operator can change it, on the
 * hosting dashboard. Returns rates quoted as currency-per-metal when using
 * base=USD&currencies=XAU..., inverted to get the metal price.
 */
async function fetchMetalPriceApi(currency: string): Promise<MetalRate[]> {
  const apiKey = process.env.METALPRICEAPI_KEY;
  if (!apiKey) {
    throw new Error(
      "Live rates aren't configured on this server yet (missing METALPRICEAPI_KEY). Use Manual entry or Demo rates in Settings meanwhile.",
    );
  }
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${encodeURIComponent(apiKey)}&base=${encodeURIComponent(currency)}&currencies=${SUPPORTED_METALS.join(",")}`;
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
    const inverse = payload.rates?.[metal];
    if (!inverse || inverse <= 0) return [];
    const pricePerOzt = 1 / inverse;
    return [
      {
        metal,
        currency,
        pricePerOzt,
        pricePerGram: pricePerOzt / GRAMS_PER_TROY_OZ,
        source: "metalpriceapi",
        fetchedAt: now,
        // Overwritten by the caller with the real pre-refresh value; this
        // function only knows the freshly-fetched side of the comparison.
        previousPricePerGram: null,
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
    // Manual board rates have no tracked history, so there's no
    // meaningful "previous" value to diff against.
    previousPricePerGram: null,
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
      previousPricePerGram: null,
    };
  });
}
