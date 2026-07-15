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
