# App Store listing update, 2026-10-24

Every field below is checked against Shopify's limits (app name 30, intro 100, details 500, each feature 80). Keywords go in the five search terms, not the subtitle: Shopify's requirement 4.4 says not to add keywords to the subtitle to improve search, and the feature list should avoid keyword stuffing.

## Keep as is
- App name: `Ounce: MetalRate Sync` (21 characters, leads with the brand, matches the TOML name).

## Replace these

**App card subtitle** (60 characters, benefit-led; check the counter in the form, I could not confirm its limit):
```
Keep metal prices current, with every change previewed first
```

**App introduction** (81 / 100):
```
Reprice jewelry and bullion from live gold, silver, platinum and palladium rates.
```

**App details** (436 / 500):
```
MetalRate Sync keeps your product prices in step with live gold, silver, platinum and palladium rates. Set a formula once (purity, making charge, wastage, markup, tax), preview every change, then apply it or let the app sync automatically. Every run is logged with the exact rate used. Set up a whole catalog from a spreadsheet, no SKUs needed. Add a live rate ticker to your storefront from the theme editor, on newer and older themes.
```

**Feature list** (each under 80). If the form only takes five, drop the stop-loss line:
1. `Reprice automatically from live gold, silver, platinum and palladium rates`
2. `Preview every price change before anything is applied to your store`
3. `Full audit trail of every sync, with the exact rate used for each price`
4. `Bulk import weights and formulas from a spreadsheet, no SKUs needed`
5. `Stop-loss floor holds prices steady if the market falls below your cost`
6. `Live metal price ticker for your storefront, with your own colors`

**Search terms** (up to five, one idea each, complete words):
1. `gold price`
2. `spot price`
3. `metal price`
4. `jewelry pricing`
5. `bullion`

Alternates if you want to swap one: `silver price`, `price sync`, `bulk price update`. Searches I measured on 2026-10-24 where the top results used these exact words: "gold price", "spot price", "metal price", "jewelry pricing".

## What changed and why
- The old feature bullet said bulk import was "matched by SKU". It matches by variant ID now, so SKUs are optional. This was the exact blocker Chris described.
- The ticker was not mentioned anywhere on the listing.
- The old subtitle/intro never used the words a buyer types (gold, silver, jewelry, bullion).

## Where to edit
1. Go to **dev.shopify.com/dashboard** (the Dev Dashboard) and open the app. Shopify's docs also describe the same path from the Partner Dashboard: **Apps, then your app, then Distribution, then Manage listing**.
2. In the Dev Dashboard, the distribution card links to **Manage Shopify App Store listing**.
3. Edit the fields above and replace the screenshots (below), then save.
4. I could not confirm whether edits to an already-live listing go through review again, or how long that takes. Shopify says it reviews listing content, so expect the form to tell you.

## Replace the screenshots
Shopify's rules for screenshots:
- **1600 x 900 pixels, 16:9.** Include 3 to 6 desktop screenshots, at least one showing the app UI.
- Crop out browser chrome and anything sensitive. No personal data.
- **Do not include pricing, reviews, or outcome guarantees** in the images.
- Add alt text to each one.
- Feature images: one focal point, solid background with good contrast (4.5:1 recommended), no Shopify logos, and do not repeat the app card subtitle in the image.

Suggested alt text:
1. `MetalRate Sync dashboard showing live gold, silver, platinum and palladium rates`
2. `Pricing formula editor with metal, purity, making charge, markup and stop-loss`
3. `Preview and Sync screen listing old price, new price and percent change per product`
4. `Bulk import screen with CSV download and upload`
5. `Sync history showing every run with the exact rate used`

## Measured baseline (re-check in 2-4 weeks)
App Store search position on 2026-10-24: #1 for "metalrate"; not in the top 24 for "gold price sync", "gold price", "spot price", "metal price", "jewelry pricing". Reviews: 0.
