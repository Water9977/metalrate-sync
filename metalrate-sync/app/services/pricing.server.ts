import type { PricingFormula } from "@prisma/client";

export interface PriceBreakdown {
  metalValue: number;
  makingCharge: number;
  wastage: number;
  markup: number;
  tax: number;
  finalPrice: number;
  stopLossTriggered: boolean;
}

export interface PricingInput {
  weightGrams: number;
  purityFactor: number; // effective purity after any variant override
  ratePerGram: number; // live rate for the formula's metal, per gram, fine
}

/**
 * Pure pricing engine. Order of operations mirrors how jewellers and bullion
 * dealers actually quote:
 *   metal value  = weight x purity x rate
 *   wastage      = % of metal value (jewellery convention)
 *   making       = flat | per-gram | % of metal value
 *   markup       = flat | % of (metal + wastage + making)
 *   tax          = % of everything above
 */
export function computePrice(
  formula: PricingFormula,
  input: PricingInput,
): PriceBreakdown {
  const stopLossTriggered =
    formula.stopLossPerGram != null && input.ratePerGram < formula.stopLossPerGram;

  const metalValue = input.weightGrams * input.purityFactor * input.ratePerGram;

  const wastage = metalValue * (formula.wastagePct / 100);

  let makingCharge = 0;
  switch (formula.makingChargeType) {
    case "perGram":
      makingCharge = formula.makingChargeValue * input.weightGrams;
      break;
    case "percent":
      makingCharge = metalValue * (formula.makingChargeValue / 100);
      break;
    case "flat":
    default:
      makingCharge = formula.makingChargeValue;
  }

  const subtotal = metalValue + wastage + makingCharge;

  const markup =
    formula.markupType === "percent"
      ? subtotal * (formula.markupValue / 100)
      : formula.markupValue;

  const taxable = subtotal + markup;
  const tax = taxable * (formula.taxPct / 100);

  const finalPrice = applyRounding(
    taxable + tax,
    formula.roundingStep,
    formula.endsIn99,
  );

  return {
    metalValue: round2(metalValue),
    makingCharge: round2(makingCharge),
    wastage: round2(wastage),
    markup: round2(markup),
    tax: round2(tax),
    finalPrice,
    stopLossTriggered,
  };
}

/**
 * step = 0 keeps exact cents (bullion — track spot as closely as possible).
 * step > 0 snaps to the nearest multiple of that amount (5/10/25/...) for
 * clean jewellery pricing. endsIn99 layers classic charm pricing on top.
 */
function applyRounding(value: number, step: number, endsIn99: boolean): number {
  if (step > 0) {
    const stepped = Math.round(value / step) * step;
    return endsIn99 ? round2(Math.max(0, stepped - 0.01)) : round2(stepped);
  }
  if (endsIn99) {
    return round2(Math.floor(value) + 0.99);
  }
  return round2(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * True when moving from oldPrice to newPrice is too small to bother with,
 * per the formula's configured floor. A half-cent epsilon always applies
 * even at minChangeAmount 0, so floating-point noise never counts as a
 * "change" — that's what stops a $220 chain from twitching to $217/$223
 * on every tiny rate wobble.
 */
export function isChangeBelowThreshold(
  oldPrice: number | null,
  newPrice: number,
  minChangeAmount: number,
): boolean {
  if (oldPrice == null) return false;
  const floor = Math.max(0.005, minChangeAmount);
  return Math.abs(newPrice - oldPrice) < floor;
}
