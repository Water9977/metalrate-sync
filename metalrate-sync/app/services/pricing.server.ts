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
