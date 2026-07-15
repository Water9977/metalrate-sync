# MetalRate Sync — how it works

## The idea in three steps

1. Create a **formula**: pick a metal, a purity, and how you want making charges, wastage, markup and tax added on top of the raw metal value.
2. Tell the app the **weight** of a product and which formula to use. That makes it "tracked."
3. Open **Preview & Sync** any time. It shows exactly what every tracked product's price would become, before anything changes. Click Apply when you're happy with it.

Nothing touches your store until you click Apply. Every Apply is logged in **History** with the exact rate used, so you can always see what changed and why.

## Formulas, in detail

A formula computes: `weight × purity × live rate` (the metal value), then adds:

- **Wastage %** — a percentage of the metal value, standard jewellery-industry practice for cutting/setting loss
- **Making charge** — flat amount, per-gram, or a percentage of the metal value
- **Markup** — flat amount or a percentage of everything so far
- **Tax %** (e.g. GST) — applied last, on top of everything

Then, optionally:

- **Round to nearest** — snap the final price to a clean step (5, 10, 25, 50, 100). Leave at "Exact" if you want to track the market precisely, which is what most bullion and coin sellers want.
- **End in .99** — classic charm pricing on top of whatever rounding you picked.
- **Minimum change to trigger an update** — if the new price is closer to the current price than this amount, the app leaves it alone instead of nudging it a couple of dollars either way. Set to 0 to always track exactly (recommended for bullion). Set to 5 or 10 if you specifically want clean, stable-feeling prices and don't mind the small tracking lag that comes with it.
- **Stop-loss rate per gram** — if the live rate drops below this, the app skips repricing entirely rather than following the market down. Useful if you don't want a sudden crash to instantly gut your margins before you've had a chance to react.

**Which settings should I actually use?** If you're not sure, leave rounding off and the threshold at 0 — that matches what most real gold and silver sellers already do (see the reasoning in the main project's `research/pricing-volatility-and-rounding.md` if you want the full explanation). Rounding and the change threshold are there for you if you specifically want cleaner-looking prices, not because you need them.

## Weight units

Type weights in whatever unit you actually use — the app converts to grams internally:

- Grams (the default)
- Troy ounce
- Pennyweight (dwt)
- Tola
- Vori

## Bulk import (the fast way to configure many products)

1. Go to **Products → Bulk import**.
2. Click "Download current products as CSV." You get a spreadsheet with every product's SKU, current price, and any weight/formula already set.
3. Edit it in Excel or Google Sheets. Fill in `weight_grams` (or `weight_tola`, `weight_vori`, `weight_troy_oz`, `weight_dwt` if that's easier) and `formula` (must match a formula name exactly) for the rows you want tracked.
4. Upload it back.

You'll get a report: how many rows matched and updated, which SKUs the app couldn't find in your store, and which formula names didn't match anything. Nothing fails silently — if a row didn't work, you'll see exactly why.

Leaving a cell blank keeps whatever was already set for that product. You don't have to fill in every column on every row.

## Troubleshooting

**A product isn't showing up in Preview & Sync.** It needs both a weight greater than 0 and a formula assigned. Check the Products page — the badge should say "Tracked."

**A price didn't update even though I applied.** Check its status in the preview table: "Stop-loss hold" means the live rate is below the floor you set on its formula. "No change" means the computed price was too close to the current one to bother (check the formula's minimum-change setting).

**Bulk import says a SKU wasn't found.** The app matches strictly by SKU against your live Shopify catalog. Double check the SKU in your CSV matches exactly what's in Shopify (case and spacing matter).

**Bulk import says a formula name was unrecognized.** Formula names in the CSV must match an existing formula exactly, including capitalization. Check the Formulas page for the exact name, or leave the column blank to keep whatever formula (if any) was already assigned.

**Rates seem stale.** Each fetch is cached for a while (see Settings → Rate cache) to avoid burning through free-tier API request limits. Lower the cache time if you're on a paid rate plan and want fresher numbers.

**I turned on automatic syncing but nothing happens.** Scheduled syncing needs the app to be running continuously on its host. If it's still running on a developer's laptop via `npm run dev`, or on serverless hosting, this won't work reliably — it needs a persistent server.
