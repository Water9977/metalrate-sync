# ChatGPT prompt: Shopify listing images for MetalRate Sync

How to use it:
1. Open ChatGPT with image generation. Attach ONE screenshot at a time.
2. Paste the **Main prompt** below, then paste the matching **Per-image brief** at the end.
3. Download the result and check its pixel size. If it is not 1600 x 900, resize or crop to exactly 1600 x 900 (Canva, Figma, or any image editor). Shopify requires 1600 x 900.
4. Zoom in and read every word in the screenshot area. Image models sometimes garble small interface text. If any text is wrong, do not use that image; ask for a fresh one, or build that one in Canva or Figma by placing your real screenshot and adding the callouts yourself.

---

## Main prompt (copy from here)

You are a product designer making listing images for a Shopify App Store page. I have attached one real screenshot of my app. Create ONE polished 16:9 marketing image of exactly 1600 x 900 pixels that shows the screenshot inside a clean frame and highlights the key buttons so a visitor understands what the app does at a glance.

**About the app (context only)**
MetalRate Sync (listed on Shopify as "Ounce: MetalRate Sync") is a Shopify app for bullion dealers and jewelry sellers who price products by weight. It keeps product prices in step with live gold, silver, platinum and palladium rates. The merchant sets up a pricing formula once (metal purity, making charge, wastage, markup, tax, rounding, a stop-loss floor), assigns it to products, then previews every proposed price change (old price, new price, percent change) before anything is applied. Prices can be applied manually or synced automatically on a schedule. Every run is recorded in a history with the exact rate used. A whole catalog can be set up from a spreadsheet import, with no SKUs required. The app also offers a live metal price ticker for the merchant's storefront. Its main promise is trust and control: nothing changes until the merchant has seen it.

**Hard rules (Shopify requirements, do not break)**
- Output size 1600 x 900 pixels, 16:9, landscape.
- Use the attached screenshot exactly as provided. Do NOT redraw, recreate, rewrite, restyle or translate the interface. Do not change any text, numbers or layout inside it. Place the original screenshot unmodified inside the design, scaled to fit, with its edges cropped cleanly (no browser window, address bar or tabs).
- Do not show or invent any pricing for the app, plan prices, dollar savings, percentages of profit, star ratings, reviews, testimonials, badges, or any promise of results.
- No Shopify logo or Shopify brand marks.
- No personal data. If the screenshot shows a store name, email, customer name or any identifying detail, blur or cover just that detail.
- Do not repeat this sentence anywhere in the image: "Keep metal prices current, with every change previewed first".
- Keep it simple: ONE focal point per image.

**Visual style**
- Solid, dark background, no busy gradients or textures. Use near-black `#0a0a0a` with the screenshot sitting on a slightly lighter panel `#121212`.
- Accent color: warm gold `#e8b54a`, used for highlights, callout rings and the headline emphasis. Off-white text `#ede9df`. Optional small green `#4ade80` and red `#f87171` only if the screenshot itself uses them.
- Typography: a refined serif for the headline (like Instrument Serif) and a clean sans for labels (like Inter). Text must have strong contrast against the background (at least 4.5:1) and be large enough to read when the image is shown small.
- Premium, calm, trustworthy. Think precision financial tool, not a flashy ad.

**Callouts (make it feel interactive)**
- Highlight 1 to 3 important elements in the screenshot only, as described in the per-image brief below.
- Style each highlight as a thin gold rounded ring with a soft glow around the real button or field, plus a small numbered gold circle (1, 2, 3) with a short label of 2 to 4 words connected by a thin line or arrow.
- Optionally add a small cursor icon pointing at the main button.
- Do not cover the important parts of the screenshot with the callout labels. Place labels in the empty margin beside the screenshot.

**Layout**
- Headline (max 6 words) at the top-left in the serif font, with one key word in gold.
- Supporting line (max 12 words) under the headline in small off-white sans text.
- The screenshot takes about 65 to 70 percent of the canvas, slightly angled or flat (flat is preferred for legibility), with rounded corners and a subtle shadow.
- Generous margins. Nothing touching the canvas edge.

**Output**
Return one image only, exactly 1600 x 900 pixels. After the image, tell me the pixel dimensions you actually produced and list which parts of the screenshot you highlighted.

---

## Per-image briefs (paste ONE after the main prompt, with the matching screenshot)

**1. Dashboard**
Headline: "Live rates, at a glance". Supporting line: "Gold, silver, platinum and palladium, right inside your Shopify admin."
Highlight: (1) the live rate cards for the four metals, (2) the last sync summary.

**2. Formula editor**
Headline: "Your pricing recipe, spelled out". Supporting line: "Purity, making charge, markup and tax. Every number visible."
Highlight: (1) the purity field, (2) the making charge and markup fields, (3) the stop-loss field.

**3. Preview and Sync** (the most important image, make it the first one in the listing)
Headline: "See every change first". Supporting line: "Old price, new price and percent change, before anything is applied."
Highlight: (1) the table showing old price, new price and change, (2) the Apply button. Put the cursor icon on the Apply button.

**4. Bulk import**
Headline: "A whole catalog in one upload". Supporting line: "Download, set weights in your spreadsheet, upload. No SKUs needed."
Highlight: (1) the "Download current products as CSV" button, (2) the upload area and Import button.

**5. History**
Headline: "Every run on the record". Supporting line: "What changed, and the exact rate used for it."
Highlight: (1) the list of runs with updated, skipped and failed counts, (2) the details view if visible.

**6. Storefront ticker (optional sixth image)**
Use a screenshot of the ticker on a real storefront or theme editor. Headline: "Live prices on your storefront". Supporting line: "A scrolling ticker you add from the theme editor, no code."
Highlight: (1) the ticker strip, (2) the App embeds or Add section control if visible.
