"use client";

import { useState } from "react";
import Link from "next/link";

export interface RateItem {
  metal: "GOLD" | "SILVER" | "PLATINUM" | "PALLADIUM";
  pricePerOzt: number;
}

const PURITY_PRESETS = [
  { label: "24K Gold (Fine / 999)", factor: 0.999, metal: "GOLD" },
  { label: "22K Gold (916)", factor: 0.916, metal: "GOLD" },
  { label: "18K Gold (750)", factor: 0.75, metal: "GOLD" },
  { label: "14K Gold (585)", factor: 0.585, metal: "GOLD" },
  { label: "10K Gold (417)", factor: 0.417, metal: "GOLD" },
  { label: "Fine Silver (999)", factor: 0.999, metal: "SILVER" },
  { label: "Sterling Silver (925)", factor: 0.925, metal: "SILVER" },
  { label: "Platinum 950 (Pt950)", factor: 0.95, metal: "PLATINUM" },
  { label: "Palladium 950 (Pd950)", factor: 0.95, metal: "PALLADIUM" },
] as const;

const WEIGHT_UNITS = [
  { label: "Grams (g)", toGrams: 1.0 },
  { label: "Troy Ounces (ozt)", toGrams: 31.1035 },
  { label: "Tola", toGrams: 11.6638 },
  { label: "Pennyweight (dwt)", toGrams: 1.55517 },
] as const;

export function CalculatorWidget({ initialRates }: { initialRates: RateItem[] }) {
  const [selectedMetal, setSelectedMetal] = useState<RateItem["metal"]>("GOLD");
  const [selectedPurityIdx, setSelectedPurityIdx] = useState<number>(2); // Default 18K
  const [weightValue, setWeightValue] = useState<number>(10.0);
  const [unitIdx, setUnitIdx] = useState<number>(0); // Grams
  const [makingChargeType, setMakingChargeType] = useState<"percent" | "per_gram">("percent");
  const [makingChargeValue, setMakingChargeValue] = useState<number>(12.0);
  const [wastagePercent, setWastagePercent] = useState<number>(3.0);
  const [markupPercent, setMarkupPercent] = useState<number>(20.0);
  const [taxPercent, setTaxPercent] = useState<number>(0.0);

  const currentRateObj = initialRates.find((r) => r.metal === selectedMetal) || initialRates[0];
  const spotPerOzt = currentRateObj.pricePerOzt;
  const spotPerGram = spotPerOzt / 31.1035;

  const purityFactor = PURITY_PRESETS[selectedPurityIdx]?.factor ?? 0.75;
  const unitGramsFactor = WEIGHT_UNITS[unitIdx]?.toGrams ?? 1.0;
  const totalWeightInGrams = Math.max(0, weightValue) * unitGramsFactor;

  // Math
  const fineGoldWeightGrams = totalWeightInGrams * purityFactor;
  const rawMetalCost = totalWeightInGrams * purityFactor * spotPerGram;
  const wastageCost = rawMetalCost * (Math.max(0, wastagePercent) / 100);

  const makingCost =
    makingChargeType === "percent"
      ? rawMetalCost * (Math.max(0, makingChargeValue) / 100)
      : totalWeightInGrams * Math.max(0, makingChargeValue);

  const baseProductionCost = rawMetalCost + wastageCost + makingCost;
  const markupAmount = baseProductionCost * (Math.max(0, markupPercent) / 100);
  const preTaxPrice = baseProductionCost + markupAmount;
  const taxAmount = preTaxPrice * (Math.max(0, taxPercent) / 100);
  const finalPrice = preTaxPrice + taxAmount;

  return (
    <div
      style={{
        background: "var(--card-bg, #fff)",
        border: "1px solid var(--line, #e2e8f0)",
        borderRadius: "12px",
        padding: "24px",
        margin: "24px 0 32px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Controls Column */}
        <div>
          <div style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.2rem", fontWeight: 700 }}>
            1. Select Metal &amp; Purity
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
              Precious Metal:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(["GOLD", "SILVER", "PLATINUM", "PALLADIUM"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMetal(m);
                    const matchingIdx = PURITY_PRESETS.findIndex((p) => p.metal === m);
                    if (matchingIdx !== -1) setSelectedPurityIdx(matchingIdx);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: selectedMetal === m ? "2px solid #000" : "1px solid #cbd5e1",
                    background: selectedMetal === m ? "#000" : "#f8fafc",
                    color: selectedMetal === m ? "#fff" : "#334155",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
              Alloy &amp; Purity:
            </label>
            <select
              value={selectedPurityIdx}
              onChange={(e) => setSelectedPurityIdx(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "0.9rem",
              }}
            >
              {PURITY_PRESETS.map((p, idx) => (
                <option key={p.label} value={idx}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Weight:
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={weightValue}
                onChange={(e) => setWeightValue(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Unit:
              </label>
              <select
                value={unitIdx}
                onChange={(e) => setUnitIdx(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "0.9rem",
                }}
              >
                {WEIGHT_UNITS.map((u, idx) => (
                  <option key={u.label} value={idx}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "20px", marginBottom: "14px", fontSize: "1.1rem", fontWeight: 700 }}>
            2. Charges, Wastage &amp; Margins
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
              Making Charges:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={makingChargeType}
                onChange={(e) => setMakingChargeType(e.target.value as "percent" | "per_gram")}
                style={{
                  width: "45%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  fontSize: "0.85rem",
                }}
              >
                <option value="percent">% of Metal</option>
                <option value="per_gram">$ per Gram</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={makingChargeValue}
                onChange={(e) => setMakingChargeValue(parseFloat(e.target.value) || 0)}
                style={{
                  width: "55%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Wastage (%):
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={wastagePercent}
                onChange={(e) => setWastagePercent(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>
                Retail Markup (%):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Calculation Breakdown Column */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "10px",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                Live {selectedMetal} Spot Rate:
              </span>
              <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                ${spotPerOzt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ozt
              </strong>
            </div>

            <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Total Weight (Grams):</span>
                <span>{totalWeightInGrams.toFixed(2)} g</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Pure Metal Content:</span>
                <span>{fineGoldWeightGrams.toFixed(2)} g ({(purityFactor * 100).toFixed(1)}%)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Raw Bullion Material Cost:</span>
                <span>${rawMetalCost.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Wastage Allowance ({wastagePercent}%):</span>
                <span>${wastageCost.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Making Charges:</span>
                <span>${makingCost.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  paddingTop: "6px",
                  borderTop: "1px dashed #cbd5e1",
                  fontWeight: 600,
                }}
              >
                <span>Production Subtotal:</span>
                <span>${baseProductionCost.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#475569" }}>Retail Markup ({markupPercent}%):</span>
                <span>+${markupAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#0f172a",
              color: "#fff",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8 }}>
              Calculated Retail Price
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700, margin: "4px 0" }}>
              ${finalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
              Formula: (Weight &times; Purity &times; Spot + Wastage + Making) &times; Markup
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <strong style={{ display: "block", color: "#166534", fontSize: "0.95rem" }}>
            Automate this calculation across your entire Shopify store
          </strong>
          <span style={{ fontSize: "0.85rem", color: "#15803d" }}>
            MetalRate Sync automatically reprices all variants when spot rates move &mdash; preview every change first.
          </span>
        </div>
        <a
          href="https://apps.shopify.com/metalrate-sync"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "8px 16px",
            background: "#166534",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          Install with 14-Day Free Trial &rarr;
        </a>
      </div>
    </div>
  );
}
