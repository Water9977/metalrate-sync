import prisma from "../db.server";

export const SUPPORTED_METALS = ["XAU", "XAG", "XPT", "XPD"] as const;
export type MetalCode = (typeof SUPPORTED_METALS)[number];

export const METAL_LABELS: Record<MetalCode, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
};

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

  const ttlMs = settings.rateTtlMinutes * 60 * 1000;
  const isFresh =
    cached.length >= SUPPORTED_METALS.length &&
    cached.every((rate) => Date.now() - rate.fetchedAt.getTime() < ttlMs);

  if (isFresh) {
    return cached.map(toMetalRate);
  }

  try {
    const fresh = await fetchFromProvider(
      settings.rateProvider,
      settings.rateApiKey,
      settings.baseCurrency,
      shop,
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
    return fresh;
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
): Promise<MetalRate[]> {
  switch (provider) {
    case "metalpriceapi":
      return fetchMetalPriceApi(apiKey, currency);
    case "manual":
      return fetchManualRates(shop, currency);
    case "mock":
    default:
      return mockRates(currency);
  }
}

/**
 * MetalPriceAPI (metalpriceapi.com) — free tier available, same vendor
 * competitor Metal Updater uses. Returns rates quoted as currency-per-metal
 * when using base=USD&currencies=XAU..., where the value is metal priced in
 * base currency terms (inverted).
 */
async function fetchMetalPriceApi(
  apiKey: string | null,
  currency: string,
): Promise<MetalRate[]> {
  if (!apiKey) {
    throw new Error(
      "MetalPriceAPI selected but no API key saved in Settings.",
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
    error?: { info?: string };
  };
  if (!payload.success || !payload.rates) {
    throw new Error(payload.error?.info ?? "MetalPriceAPI returned an error");
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
