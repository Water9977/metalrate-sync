/** Minimal RFC4180-ish CSV parser/writer — quoted fields, embedded commas/quotes/newlines. No dependency needed for this scope. */

export interface ImportRow {
  sku: string;
  weightGrams: number | null;
  formulaName: string | null;
}

export interface ImportParseResult {
  rows: ImportRow[];
  error: string | null;
}

export function parseImportCsv(text: string): ImportParseResult {
  const table = parseCsvTable(text);
  const rows = table.filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) {
    return { rows: [], error: "CSV is empty." };
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const skuIdx = header.indexOf("sku");
  if (skuIdx === -1) {
    return { rows: [], error: 'CSV must have a "sku" column.' };
  }
  const weightIdx = header.findIndex(
    (cell) => cell === "weight_grams" || cell === "weight",
  );
  const formulaIdx = header.findIndex(
    (cell) => cell === "formula" || cell === "formula_name",
  );

  const parsed: ImportRow[] = [];
  for (const row of rows.slice(1)) {
    const sku = (row[skuIdx] ?? "").trim();
    if (!sku) continue;
    const weightRaw = weightIdx >= 0 ? (row[weightIdx] ?? "").trim() : "";
    const weight = weightRaw ? Number(weightRaw) : null;
    parsed.push({
      sku,
      weightGrams: weight != null && !Number.isNaN(weight) ? weight : null,
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
  const escape = (value: string | number | null): string => {
    const str = value == null ? "" : String(value);
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
