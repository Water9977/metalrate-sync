/** Minimal RFC4180-ish CSV parser/writer — quoted fields, embedded commas/quotes/newlines. No dependency needed for this scope. */

import { gramsPerUnit } from "../constants";

export interface ImportRow {
  sku: string;
  variantId: string | null;
  weightGrams: number | null;
  formulaName: string | null;
}

export interface ImportParseResult {
  rows: ImportRow[];
  error: string | null;
}

/**
 * Accepts a weight column in whatever unit the merchant already has in
 * their spreadsheet — "weight_grams"/"weight" (grams, the default),
 * "weight_tola", "weight_vori", "weight_troy_oz"/"weight_oz_t", or
 * "weight_dwt"/"weight_pennyweight". Converts to grams at parse time so
 * everything downstream only ever deals with grams.
 */
const WEIGHT_COLUMN_UNITS: Record<string, string> = {
  weight_grams: "g",
  weight_g: "g",
  weight: "g",
  weight_tola: "tola",
  weight_vori: "vori",
  weight_troy_oz: "oz_t",
  weight_oz_t: "oz_t",
  weight_ozt: "oz_t",
  weight_dwt: "dwt",
  weight_pennyweight: "dwt",
};

export function parseImportCsv(text: string): ImportParseResult {
  const table = parseCsvTable(text);
  const rows = table.filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) {
    return { rows: [], error: "CSV is empty." };
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const skuIdx = header.indexOf("sku");
  // variant_id is the identifier our own CSV export always fills in, since
  // SKU is optional in Shopify -- plenty of real stores never set one (a
  // 1,340-product design-partner catalog with zero SKUs is what surfaced
  // this). A row needs at least one of the two to be matchable.
  const variantIdIdx = header.findIndex(
    (cell) => cell === "variant_id" || cell === "variantid",
  );
  if (skuIdx === -1 && variantIdIdx === -1) {
    return {
      rows: [],
      error: 'CSV must have a "sku" or "variant_id" column.',
    };
  }
  const weightIdx = header.findIndex((cell) => cell in WEIGHT_COLUMN_UNITS);
  const weightUnit = weightIdx >= 0 ? WEIGHT_COLUMN_UNITS[header[weightIdx]] : "g";
  const formulaIdx = header.findIndex(
    (cell) => cell === "formula" || cell === "formula_name",
  );

  const parsed: ImportRow[] = [];
  for (const row of rows.slice(1)) {
    const sku = skuIdx >= 0 ? (row[skuIdx] ?? "").trim() : "";
    const variantId =
      variantIdIdx >= 0 ? (row[variantIdIdx] ?? "").trim() || null : null;
    if (!sku && !variantId) continue;
    const weightRaw = weightIdx >= 0 ? (row[weightIdx] ?? "").trim() : "";
    const weight = weightRaw ? Number(weightRaw) : null;
    parsed.push({
      sku,
      variantId,
      weightGrams:
        weight != null && !Number.isNaN(weight)
          ? weight * gramsPerUnit(weightUnit)
          : null,
      formulaName:
        formulaIdx >= 0 ? (row[formulaIdx] ?? "").trim() || null : null,
    });
  }
  return { rows: parsed, error: null };
}

export function toCsv(
  rows: Array<Record<string, string | number | null>>,
  columns: string[],
): string {
  // M7 fix: a cell starting with =, +, -, or @ is read as a formula by
  // Excel/Sheets when the CSV is opened — e.g. a product title of
  // `=HYPERLINK(...)` would execute. Prefix a leading apostrophe (the
  // standard CSV-injection guard) so it's always read back as plain text.
  const escape = (value: string | number | null): string => {
    let str = value == null ? "" : String(value);
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(","));
  }
  return lines.join("\n");
}

function parseCsvTable(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore, \n handles the line break
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
