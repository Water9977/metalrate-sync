"use client";

import { useState } from "react";

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
  const spotPerOzt = currentRateObj?.pricePerOzt || 4017.99;
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
        background: "var(--coal, #121212)",
        border: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
        borderRadius: "var(--radius, 14px)",
        padding: "28px",
        margin: "28px 0 36px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
        color: "var(--text, #ede9df)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "28px",
        }}
      >
        {/* Controls Column */}
        <div>
          <div
            style={{
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "1.15rem",
              fontWeight: 600,
              color: "var(--text, #ede9df)",
            }}
          >
            1. Select Metal &amp; Purity
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--silver, #c9cdd3)",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Precious Metal:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(["GOLD", "SILVER", "PLATINUM", "PALLADIUM"] as const).map((m) => {
                const isSelected = selectedMetal === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMetal(m);
                      const matchingIdx = PURITY_PRESETS.findIndex((p) => p.metal === m);
                      if (matchingIdx !== -1) setSelectedPurityIdx(matchingIdx);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: isSelected
                        ? "1px solid var(--gold, #e8b54a)"
                        : "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                      background: isSelected ? "var(--gold, #e8b54a)" : "var(--coal-2, #1a1a1a)",
                      color: isSelected ? "var(--ink, #0a0a0a)" : "var(--silver, #c9cdd3)",
                      boxShadow: isSelected ? "0 2px 8px rgba(232, 181, 74, 0.25)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--silver, #c9cdd3)",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Alloy &amp; Purity:
            </label>
            <select
              value={selectedPurityIdx}
              onChange={(e) => setSelectedPurityIdx(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                background: "var(--coal-2, #1a1a1a)",
                color: "var(--text, #ede9df)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            >
              {PURITY_PRESETS.map((p, idx) => (
                <option key={p.label} value={idx} style={{ background: "#1a1a1a", color: "#ede9df" }}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--silver, #c9cdd3)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                }}
              >
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
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-mono-stack)",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--silver, #c9cdd3)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                }}
              >
                Unit:
              </label>
              <select
                value={unitIdx}
                onChange={(e) => setUnitIdx(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              >
                {WEIGHT_UNITS.map((u, idx) => (
                  <option key={u.label} value={idx} style={{ background: "#1a1a1a", color: "#ede9df" }}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              marginBottom: "16px",
              fontSize: "1.15rem",
              fontWeight: 600,
              color: "var(--text, #ede9df)",
            }}
          >
            2. Charges, Wastage &amp; Margins
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--silver, #c9cdd3)",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Making Charges:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={makingChargeType}
                onChange={(e) => setMakingChargeType(e.target.value as "percent" | "per_gram")}
                style={{
                  width: "48%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              >
                <option value="percent" style={{ background: "#1a1a1a", color: "#ede9df" }}>% of Metal</option>
                <option value="per_gram" style={{ background: "#1a1a1a", color: "#ede9df" }}>$ per Gram</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={makingChargeValue}
                onChange={(e) => setMakingChargeValue(parseFloat(e.target.value) || 0)}
                style={{
                  width: "52%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-mono-stack)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--silver, #c9cdd3)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                }}
              >
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
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-mono-stack)",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--silver, #c9cdd3)",
                  marginBottom: "8px",
                  letterSpacing: "0.02em",
                }}
              >
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
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line, rgba(255, 255, 255, 0.14))",
                  background: "var(--coal-2, #1a1a1a)",
                  color: "var(--text, #ede9df)",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-mono-stack)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Calculation Breakdown Column */}
        <div
          style={{
            background: "var(--coal-2, #1a1a1a)",
            border: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
            borderRadius: "12px",
            padding: "24px",
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
                borderBottom: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--muted, #999999)", fontWeight: 500 }}>
                Live {selectedMetal} Spot Rate:
              </span>
              <strong style={{ fontSize: "1.05rem", color: "var(--gold, #e8b54a)", fontFamily: "var(--font-mono-stack)" }}>
                ${spotPerOzt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ozt
              </strong>
            </div>

            <div style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Total Weight (Grams):</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  {totalWeightInGrams.toFixed(2)} g
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Pure Metal Content:</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  {fineGoldWeightGrams.toFixed(2)} g ({(purityFactor * 100).toFixed(1)}%)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Raw Bullion Material Cost:</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  ${rawMetalCost.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Wastage Allowance ({wastagePercent}%):</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  ${wastageCost.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Making Charges:</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  ${makingCost.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  paddingTop: "8px",
                  borderTop: "1px dashed var(--line, rgba(255, 255, 255, 0.16))",
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "var(--text, #ede9df)" }}>Production Subtotal:</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--text, #ede9df)" }}>
                  ${baseProductionCost.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted, #999999)" }}>Retail Markup ({markupPercent}%):</span>
                <span style={{ fontFamily: "var(--font-mono-stack)", color: "var(--gold, #e8b54a)" }}>
                  +${markupAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "18px",
              background: "linear-gradient(135deg, rgba(232, 181, 74, 0.14) 0%, rgba(18, 18, 18, 0.95) 100%)",
              border: "1px solid rgba(232, 181, 74, 0.35)",
              color: "#fff",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--gold, #e8b54a)",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Calculated Retail Price
            </div>
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "var(--gold, #e8b54a)",
                fontFamily: "var(--font-mono-stack)",
                margin: "4px 0",
              }}
            >
              ${finalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--silver, #c9cdd3)", opacity: 0.85 }}>
              Formula: (Weight &times; Purity &times; Spot + Wastage + Making) &times; Markup
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "28px",
          padding: "18px 22px",
          background: "rgba(232, 181, 74, 0.06)",
          border: "1px solid rgba(232, 181, 74, 0.22)",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <strong style={{ display: "block", color: "var(--gold, #e8b54a)", fontSize: "0.95rem", marginBottom: "4px" }}>
            Automate this calculation across your entire Shopify store
          </strong>
          <span style={{ fontSize: "0.85rem", color: "var(--silver, #c9cdd3)" }}>
            MetalRate Sync automatically reprices all variants when spot rates move &mdash; preview every change first.
          </span>
        </div>
        <a
          href="https://apps.shopify.com/metalrate-sync"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "var(--gold, #e8b54a)",
            color: "var(--ink, #0a0a0a)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(232, 181, 74, 0.25)",
            transition: "all 0.15s ease",
          }}
        >
          Install with 14-Day Free Trial &rarr;
        </a>
      </div>
    </div>
  );
}