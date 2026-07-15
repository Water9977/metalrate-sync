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

  const finalPrice = applyRounding(taxable + tax, formula.rounding);

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

function applyRounding(value: number, mode: string): number {
  switch (mode) {
    case "whole":
      return Math.round(value);
    case "end99": {
      // 1234.56 -> 1234.99 style ending, never rounding below the raw value by more than a cent
      const whole = Math.floor(value);
      return whole + 0.99;
    }
    case "none":
    default:
      return round2(value);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Common karat presets surfaced in the formula builder UI. */
export const PURITY_PRESETS = [
  { label: "24K / Fine (0.999)", value: 0.999 },
  { label: "22K (0.916)", value: 0.916 },
  { label: "18K (0.750)", value: 0.75 },
  { label: "14K (0.585)", value: 0.585 },
  { label: "10K (0.417)", value: 0.417 },
  { label: "Sterling 925 (0.925)", value: 0.925 },
  { label: "Bullion .9999 (1.0)", value: 1.0 },
];
