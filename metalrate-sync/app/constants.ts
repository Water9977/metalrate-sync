// Client-safe constants. Never add server-only imports here — this file is
// deliberately NOT suffixed .server so route components can import it for
// rendering (labels, dropdown options) without pulling server code into the
// browser bundle. See https://reactrouter.com/explanation/code-splitting

export const SUPPORTED_METALS = ["XAU", "XAG", "XPT", "XPD"] as const;
export type MetalCode = (typeof SUPPORTED_METALS)[number];

export const METAL_LABELS: Record<MetalCode, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
};

/**
 * Consistent color coding per metal, used on badges throughout the app so a
 * merchant can scan a table and recognize a metal by color, not just text.
 * Restricted to Polaris's own tone tokens (no raw hex) so it stays visually
 * native to Shopify admin in both light and dark mode.
 */
export const METAL_TONE: Record<
  MetalCode,
  "warning" | "neutral" | "info" | "success"
> = {
  XAU: "warning", // amber — gold
  XAG: "neutral", // grey — silver
  XPT: "info", // blue-white — platinum
  XPD: "success", // teal-green — palladium
};

/**
 * Weight units a merchant might already work in. Canonical storage is
 * always grams (VariantConfig.weightGrams) — these factors only convert at
 * input time, on the Products page and in CSV import.
 */
export const WEIGHT_UNITS = [
  { code: "g", label: "Grams (g)", gramsPerUnit: 1 },
  { code: "oz_t", label: "Troy ounce (oz t)", gramsPerUnit: 31.1034768 },
  { code: "dwt", label: "Pennyweight (dwt)", gramsPerUnit: 1.55517384 },
  { code: "tola", label: "Tola", gramsPerUnit: 11.6638038 },
  { code: "vori", label: "Vori", gramsPerUnit: 11.6638038 },
] as const;
export type WeightUnitCode = (typeof WEIGHT_UNITS)[number]["code"];

export function gramsPerUnit(code: string): number {
  return WEIGHT_UNITS.find((unit) => unit.code === code)?.gramsPerUnit ?? 1;
}

/**
 * India city-specific gold/silver rate symbols confirmed live against
 * MetalPriceAPI's own /v1/symbols endpoint (2026-07-18) — e.g. "XAU-MUMB"
 * for Mumbai gold. Requires a paid MetalPriceAPI plan (free tier returns
 * "requires a paid plan" for these). Platinum/palladium have no city-level
 * data at all, so city selection only ever affects gold and silver.
 */
export interface RateCity {
  code: string;
  label: string;
  hasSilver: boolean;
}
export const INDIA_RATE_CITIES: RateCity[] = [
  { code: "AHME", label: "Ahmedabad", hasSilver: true },
  { code: "BANG", label: "Bangalore", hasSilver: true },
  { code: "BHOP", label: "Bhopal", hasSilver: false },
  { code: "CHAN", label: "Chandigarh", hasSilver: true },
  { code: "CHEN", label: "Chennai", hasSilver: true },
  { code: "COIM", label: "Coimbatore", hasSilver: true },
  { code: "DEHR", label: "Dehradun", hasSilver: false },
  { code: "FARI", label: "Faridabad", hasSilver: false },
  { code: "GURG", label: "Gurgaon", hasSilver: false },
  { code: "GUWA", label: "Guwahati", hasSilver: false },
  { code: "HYDE", label: "Hyderabad", hasSilver: true },
  { code: "INDO", label: "Indore", hasSilver: false },
  { code: "JAIP", label: "Jaipur", hasSilver: true },
  { code: "KANP", label: "Kanpur", hasSilver: false },
  { code: "KOCH", label: "Kochi", hasSilver: false },
  { code: "KOLH", label: "Kolhapur", hasSilver: false },
  { code: "KOLK", label: "Kolkata", hasSilver: true },
  { code: "LUCK", label: "Lucknow", hasSilver: true },
  { code: "LUDH", label: "Ludhiana", hasSilver: false },
  { code: "MADU", label: "Madurai", hasSilver: true },
  { code: "MALA", label: "Malappuram", hasSilver: false },
  { code: "MANG", label: "Mangalore", hasSilver: true },
  { code: "MEER", label: "Meerut", hasSilver: false },
  { code: "MUMB", label: "Mumbai", hasSilver: true },
  { code: "MYSO", label: "Mysore", hasSilver: true },
  { code: "NAGP", label: "Nagpur", hasSilver: true },
  { code: "NOID", label: "Noida", hasSilver: false },
  { code: "PATN", label: "Patna", hasSilver: true },
  { code: "POND", label: "Pondicherry", hasSilver: false },
  { code: "PUNE", label: "Pune", hasSilver: true },
  { code: "RAIP", label: "Raipur", hasSilver: false },
  { code: "SALE", label: "Salem", hasSilver: true },
  { code: "VIJA", label: "Vijayawada", hasSilver: true },
  { code: "VISA", label: "Visakhapatnam", hasSilver: false },
];

/** Common karat/fineness presets surfaced in the formula builder UI. */
export const PURITY_PRESETS = [
  { label: "24K / Fine (0.999)", value: 0.999 },
  { label: "22K (0.916)", value: 0.916 },
  { label: "18K (0.750)", value: 0.75 },
  { label: "14K (0.585)", value: 0.585 },
  { label: "10K (0.417)", value: 0.417 },
  { label: "Sterling 925 (0.925)", value: 0.925 },
  { label: "Bullion .9999 (1.0)", value: 1.0 },
];
