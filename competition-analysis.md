# Competition Analysis — Shopify Precious Metal Pricing Apps

Compiled 2026-07-15. Every listing below was scraped live from apps.shopify.com plus each developer's own site where one existed. 18 apps total, every one built to solve the same core problem: keeping Shopify product prices in sync with moving gold/silver/platinum rates.

**Headline numbers**

| Stat | Value |
|---|---|
| Total apps in niche | 18 |
| Apps with any reviews | 7 |
| Apps with zero reviews | 11 |
| Total reviews across all 18 apps | ~25 |
| Apps holding Built for Shopify badge | 0 (one falsely implies it) |
| Monthly price range | $2.99 → $249 |
| Highest rating | 5.0★ (7 apps tied) |
| Lowest rating | 2.8★ (Gold Feed Inc.) |
| Oldest app | Gold Feed Inc., Oct 2014 |
| Newest app | JewelyEcom, Jun 2026 |

This is a **young, unreviewed, low-moat market**. Nobody has built a defensible reputation yet. That's the opportunity.

---

## Master comparison table

| App | Developer | Launched | Rating/Reviews | Price range | Live rate sync | Stop-loss | Diamond/stone | Buyback | Storefront widget | POS sync | Multi-currency | Bulk import/export |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GPE: Live Gold Price Editor | Droid Infinity | Oct 2020 | 5.0★ / 5-7 | $15.99–39.99/mo | Yes (10-60min) | Yes | Yes (slabs) | No | Yes (price bar) | **Yes** | Yes | Yes (Excel) |
| Precious Metal Product Prices | nFusion Solutions | Jan 2021 | 5.0★ / 6 | Free + quote (opaque) | Yes (enterprise) | Guardrails | No | **Yes** | Yes (companion) | No | Yes (~30) | Yes + API |
| Metal Updater | Chosen6 Agency | Jun 2025 | 5.0★ / 4* | $34.99–49.99/mo | Yes | No | No | No | No | No | No | No |
| Precious Metals Price Updater | Gold Feed Inc. | Oct 2014 | **2.8★ / 3** | $40/mo, $400/yr | Yes (20sec) | No | No | No | Yes (extensive) | No | Unclear | No |
| JewelSync (Live Metal Bulk Price Updater) | KLYX | May 2026 | 5.0★ / 2 | $9.99–14.99/mo | Yes | Yes | Yes (carat) | No | No | No | Yes | Bulk sync only |
| Jewellery Price Breakup | SpiderWares | May 2026 | 5.0★ / 2 | Free–$28.32/mo | Top tier only | No | Yes (carat) | No | Yes (3 modes) | No | No | Yes (XLSX, gated) |
| HASH-COM Precious Metals | HASH-COM GmbH | Oct 2023 | 5.0★ / 1 | $24.90–249/mo+usage | Yes (1min) | No | No | No | No | No | Yes | No |
| Q: Live Gold Price Calculator | Qressy | Dec 2025 | 0 reviews | Free–49.99/mo | Yes (daily+) | No | No | No | Yes (breakup) | No | Yes | Yes (Excel) |
| Gold Prices & Exchange | Nodus Works | Apr 2026 | 0 reviews | Free–14.99/mo | Yes | No | No | No | No | No | No | No |
| GoldSync (Anil Kumar) | Solo indie | Jul 2026 | 0 reviews | $9–29/mo | Top tier only | Yes | Yes (stones) | No | No | No | No | No |
| HW Gold Price Sync | Huptech Web | Sep 2025 | 0 reviews | $2.99/mo flat | Yes | No | No | No | No | No | No | No |
| GoldSync (Quest For Tech) | Quest For Tech | Sep 2025 | 0 reviews | Free | Yes | No | Yes (type: natural/lab/moissanite) | No | Yes (theme inject) | No | No | No |
| Spotmetal | Qbytesoft | May 2026 | 0 reviews | Free–49/mo | Yes (1min top) | Yes (floor) | No | **Yes** | Yes (ticker) | No | Unclear | No |
| Keep Up With Metals | GMAppify | Nov 2024 | 0 reviews | Metered $0–300+/load | **No (display only)** | No | No | No | Yes (ticker) | No | Claimed | No |
| Live Gold Rate Updater | Thinkersteps | Jul 2025 | 0 reviews | Free–49/mo | Yes | Yes | No | No | No | Claimed, unverified | Claimed | No |
| Gold & Silver Live Rate | Thriftizer | May 2026 | 0 reviews | Free (10 SKU cap)–49.99/mo | Yes (hourly) | No | No | No | Yes (claimed) | No | Yes | No |
| Pricify | Alldaybargain | Apr 2026 | 0 reviews | Free only | **No (manual entry)** | No | No | No | No | No | No | Yes (bulk calc) |
| JewelyEcom | Niva Ventures | Jun 2026 | 0 reviews | $20/mo flat | **No (manual trigger)** | No | Yes (4 types + GST) | No | Yes (breakdown) | No | No | No |

*Metal Updater's own site's schema markup claims 4.9★/127 reviews — doesn't match the real 4-review Shopify listing. Flag as inflated marketing.

---

## Feature gap analysis — what's actually open

### Whitespace (0-1 apps have this)

- **Reliable bulk update at scale.** This is the one that matters most. Multiple apps *claim* bulk sync, but Chris (Liquid Bullion, our design partner) is paying $40/mo for exactly this category and it's been broken for years — dev blames his store, refuses to fix. Nobody has proven reliability at 10k+ SKU scale. This is an execution gap, not a checkbox gap — can't out-market it, have to out-build it.
- **Marketplace sync (eBay, etc).** Zero of 18 apps sync prices to eBay or any external marketplace from inside Shopify. Chris asked for this directly. Wide open.
- **Checkout price-lock window.** Only Gold Feed Inc. has this (lock price for a window at checkout so volatile markets don't surprise a customer mid-purchase). Nobody else touches it.
- **Buyback workflow.** Only nFusion (enterprise/opaque pricing) and Spotmetal have buyback calculators. If targeting bullion/coin dealers, this matters a lot and is mostly unclaimed.
- **POS sync.** Only GPE explicitly ships this; Thinkersteps claims it but it's unverified. 16 of 18 apps ignore physical/POS retail entirely.
- **Price alerts (threshold-based).** Only Gold Feed Inc.
- **Built for Shopify badge.** Literally zero apps in the niche hold it. One-time move on a Shopify-wide credibility lever.

### Contested but shallow (2-5 apps, none clearly winning)

- **Price preview before committing to a sync.** JewelSync and Pricify have it. Metal Updater's own marketing site lists it as "Coming Soon" — a named, dated gap for a live competitor. Ship this on day one, it's cheap and closes a real trust gap ("don't let the bot reprice my store wrong").
- **Diamond/gemstone-specific pricing.** GPE (most granular — slabs by clarity/color/shape/carat), JewelSync, Jewellery Price Breakup, GoldSync (Anil), Quest GoldSync (natural/lab-grown/moissanite differentiation), JewelyEcom (4 diamond types + GST). Fragmented, no single app owns it well.
- **Multi-currency.** About a third of apps have it. Relevant if targeting international bullion sellers.
- **Stop-loss / floor protection.** GPE, JewelSync, GoldSync(Anil), Spotmetal, Thinkersteps have it in some form. Roughly table stakes for the segment that cares (bullion/by-weight), not universal.

### Fake it / claimed but unverifiable

- GMAppify's "Built for Shopify" bullet appears in every pricing tier but no actual badge shows on the listing — looks like leftover template copy, not earned.
- Thriftizer claims AI jewelry chat, EMI/savings calculator, hallmark check — loosely formatted, unclear if actually shipped or aspirational marketing.
- Thinkersteps claims Shopify POS compatibility in its description but it's absent from the "Works with" integrations list — unconfirmed.
- Two apps (Pricify, JewelyEcom) market themselves in the "live pricing" category but actually require **manual** rate entry, not real external API polling. Worth knowing which competitors are all bark.

### Real reputational vulnerability to exploit

Gold Feed Inc. (2.8★, the incumbent Chris currently pays $40/mo to) has two public 1-star reviews citing years of pricing inaccuracy and completely unresponsive support, including a public spat where the developer disputed a reviewer even being a customer. This is the single clearest "beat this specific competitor" opening in the whole dataset — not hypothetical, an actual paying customer (Chris) is already looking to leave it.

---

## What "table stakes" looks like (must-match, not differentiators)

Every credible app in this set has some version of:

1. Live external rate polling for gold (most also silver/platinum, some palladium)
2. Customizable formula: weight × purity/karat + making charges + markup (+ tax/GST for the India-facing ones)
3. Manual one-click reprice, and/or scheduled automatic reprice
4. Some tier of variant/SKU limit gating (2k → 25k → 50k+ typical ladder)
5. A free trial (3-7 days typical) or a capped free tier
6. Fast, hands-on support — **every single 5-star review across all 18 apps credits support responsiveness and custom formula help by name**, not the self-serve product alone. This is the review flywheel mechanism, not a feature checkbox — matches what's already known about the KaChing playbook and Shopify's own review-ranking docs.

---

## Recommendation — what our app should ship

**MVP (must have, matches table stakes + closes named gaps):**
- Live gold/silver/platinum/palladium rate polling (multiple source APIs, IBJA for India)
- Formula builder: weight, karat/purity, making charges, wastage, markup, GST/tax
- Manual one-click reprice AND scheduled auto-reprice
- **Price preview before committing** (closes Metal Updater's admitted gap, matches JewelSync/Pricify)
- Stop-loss / floor protection
- Bulk variant sync **built and load-tested for 10k+ SKUs specifically** — this is the actual product, not a feature, since it's Chris's exact pain and nobody else has proven it works
- Update/audit history log

**Differentiators (whitespace, roadmap items post-MVP):**
- eBay/marketplace price sync — zero competitors offer this, and it's an explicit ask from design partner #1
- POS sync — only 1 of 18 competitors has it
- Buyback calculator — only 2 of 18 have it, strong fit if leaning into bullion/coin segment
- Multi-currency — roughly half the market has it, needed for international reach

**Positioning:**
- Price between JewelSync ($9.99-14.99) and GPE ($15.99-39.99). Chris already confirmed willingness to pay $30-35/mo — that's a validated ceiling, and it sits just under Gold Feed Inc.'s $40/mo, which he's already paying for something worse.
- Marketing angle directly targets Gold Feed Inc.'s exact weakness: "reliable bulk updates, support that answers." Not hypothetical — a real switching customer is already unhappy with precisely this.
- Skip diamond/gemstone granularity in v1 (fragmented, low differentiation, not needed for the bullion/by-weight segment being targeted first per [architecture.md](architecture.md)). Add later if expanding into fine jewelry.

---

## Full per-app profiles

### GPE: Live Gold Price Editor — Droid Infinity (Chennai, India)
**Launched** Oct 8, 2020 · **Rating** 5.0★, 5-7 reviews · **Pricing** Starter $15.99/mo (2k variants) → Basic $24.99/mo (25k variants, Excel import/export) → Advanced $39.99/mo (50k variants, diamond/gemstone slabs, stop-loss, advanced breakup)

**Pros:** Most mature/complete feature set of the whole set. Syncs to Shopify POS (only app that does). Diamond/gemstone pricing by clarity/color/shape/carat slabs — most granular in the market. Metal Price Bar storefront widget. Multi-currency. Refresh as fast as 10min for bullion traders. Dev's own site claims 1,200+ jewellers served, 50M+ price updates/day, named client logos (Frost NYC, PNG Jewellers, etc).

**Cons:** White-glove/manual setup model — price breakup and Metal Price Bar are described as done *by their support team*, not fully self-serve. No public multi-review detail beyond 3 shown despite listing 5-7. No storefront ticker beyond the price bar.

### Precious Metal Product Prices — nFusion Solutions (Blaine, MN)
**Launched** Jan 25, 2021 · **Rating** 5.0★, 6 reviews · **Pricing** Free to install, external quote-based billing via sales@nfusionsolutions.com

**Pros:** The strongest infrastructure play in the set — 200+ connected dealers, 300M+ requests/month, real clients (JM Bullion, Kitco, Sprott Money). Retail AND wholesale price books. Buy/sell (buyback) pricing on every item. ~30 currency delivery. Volume/quantity price tiers. Bulk import/export + full pricing API. Customer tenures of 2-4+ years, genuinely sticky.

**Cons:** No self-serve pricing at all — entirely sales-assisted, opaque cost. Built for bullion/coin dealers specifically, not fashion jewelry (no diamond/gemstone handling). Higher barrier to entry for a small merchant just wanting to self-serve install and go.

### Metal Updater — Chosen6 Digital Agency (Miami, FL)
**Launched** Jun 18, 2025 · **Rating** 5.0★, 4 reviews (site claims inflated 4.9★/127) · **Pricing** Professional $34.99/mo (5 formulas, 250 SKUs) → Unlimited $49.99/mo (unlimited formulas/SKUs)

**Pros:** Named third-party data source (MetalPriceAPI) for transparency. Granular purity naming (10k/14k/18k/22k/24k gold, 925/950 silver). Targeting by tag/SKU/variant.

**Cons:** **No stop-loss feature at all.** No diamond/gemstone pricing. No POS sync. Reviews are thin and low-effort (one submitted after ~1 hour of use). Own marketing site explicitly labels its price-preview/margin-visualization dashboard "Coming Soon" — a real, named, dated feature gap. Highest entry price of any reviewed app ($34.99) for the least complete feature set among Tier 1 apps.

### Precious Metals Price Updater — Gold Feed Inc. (Sherwood Park, Canada)
**Launched** Oct 27, 2014 (oldest in the set) · **Rating 2.8★, 3 reviews** (worst rated) · **Pricing** $40/mo or $400/yr flat (own site shows a conflicting $50/mo — verify before quoting)

**Pros:** Fastest claimed refresh (20 seconds). Broadest storefront widget catalog in the set (charts, tickers, tables, quote cards, calculators, gold-to-silver ratio widget). Unique checkout price-lock window feature. Price alerts (threshold-based email/browser). Multi-platform beyond Shopify (WooCommerce, BigCommerce, eBay, Volusion).

**Cons: This is the incumbent Chris/Liquid Bullion is currently paying $40/mo to and trying to leave.** Two public 1-star reviews citing years of pricing inaccuracy and completely unresponsive support. Public dispute where the developer denied a reviewer was even a customer. No diamond/gemstone pricing at all — most basic calculation model in the set (spot + purity + weight + markup only). No stop-loss. Pricing inconsistent between listing and own site. **This is the single clearest target to displace.**

### JewelSync (Live Metal Bulk Price Updater) — KLYX (Uttarakhand, India)
**Launched** May 11, 2026 · **Rating** 5.0★, 2 reviews · **Pricing** Standard $9.99/mo (3k variants) → Premium $14.99/mo (unlimited variants) — cheapest paid entry among reviewed apps

**Pros:** Cheapest reviewed app. Preview formula prices before committing (directly closes the gap Metal Updater admits it doesn't have). Stop-loss floor protection. Diamond carat + workshop % variable. High-touch support with named staff credited by reviewers. Explicitly markets "bulk variant sync in seconds" — same territory as our core wedge.

**Cons:** Very new (2 reviews only). Changelog link on the listing 404s — visible polish issue. No POS sync, no storefront ticker/price bar.

### Jewellery Price Breakup — SpiderWares (Surat, India)
**Launched** May 8, 2026 · **Rating** 5.0★, 2 reviews · **Pricing** Free (10 products, manual entry only) → Premier $19.23/mo (unlimited products, still manual) → Advanced $28.32/mo (only tier with actual live metal price API sync)

**Pros:** Only app with 3 display modes (popup/drawer/inline) for the price breakup table. GST as an explicit line item — strong India orientation. Developer (SpiderWares) has genuine jewelry-vertical Shopify credentials from prior agency work.

**Cons:** **This is a display/transparency tool, not a repricing engine** — it shows customers how a price is composed, it doesn't actually change the Shopify product price itself except on the top tier. Live sync gated behind the most expensive plan; free/mid tier is manual entry only, a real functional gap versus apps offering live sync from the base paid tier.

### HASH-COM Precious Metals — HASH-COM GmbH (Aschaffenburg, Germany)
**Launched** Oct 24, 2023 · **Rating** 5.0★, 1 review · **Pricing** Basic $24.90/mo + $0.03/calculation → Premium $99/mo + $0.01/calc → Unlimited $249/mo or $2,490/yr

**Pros:** Unlimited custom metals/alloys/cost factors — very flexible data model. Fast refresh (1x/minute). Handles currency fluctuation against shop currency.

**Cons:** **Support not offered in English** — real barrier for a global product. Complex/expensive pricing model (monthly base + per-calculation usage fee stacked on top) that could surprise merchants at scale. No stop-loss, no storefront widget. Developer's current homepage has pivoted entirely to unrelated German AI-consulting — the one review is from late 2023, unclear if actively maintained.

### Q: Live Gold Price Calculator — Qressy (Hyderabad, India)
**Launched** Dec 12, 2025 · **Rating** 0 reviews · **Pricing** Free (50 products, 24h sync) → Basic $25/mo (25k variants) → Advanced $49.99/mo (unlimited variants)

**Pros:** Backed by a real, credentialed Shopify Plus agency (Qressy, founded 2011, 4 global studios, real jewelry clients: Kairasi Jewels, Emmadi Silver Jewellery, etc). Excel import/export. Price breakup widget. Multi-currency. Live public demo store link on the listing — unusual transparency. Product dashboard with filters/search/price history/upload logs — direct overlap with our bulk-reliability wedge.

**Cons:** Only gold 8-24K and silver mentioned — no platinum/palladium. No stop-loss. Daily-only sync on free tier (not truly real-time). Not marketed on the agency's own homepage — a side product, not their core focus.

### Gold Prices & Exchange — Nodus Works (Istanbul, Turkey)
**Launched** Apr 27, 2026 · **Rating** 0 reviews · **Pricing** Free → Basic $4.99/mo → Standard $9.99/mo → Advanced $14.99/mo — cheapest tiered pricing in the whole set

**Pros:** Backed by a prolific app portfolio (Nodus Works: 11+ published Shopify apps, 5 SaaS platforms, 200+ active brands claimed) — real cross-sell distribution risk if they push it through existing installs.

**Cons:** Vaguest feature description of any app in the set. No jewelry-specific vocabulary at all (no making charges, wastage, purity, stones). No per-tier feature differentiation shown — just price points with no bullet breakdown. Reads as one of many templated, boilerplate apps from a high-volume app factory, not a specialized build.

### GoldSync — Anil Kumar, solo indie developer (Manali, India)
**Launched** Jul 1, 2026 (2 weeks before this research) · **Rating** 0 reviews · **Pricing** Starter $9/mo (2k variants, manual reprice only) → Basic $19/mo (25k variants, tax-inclusive, price floor) → Advanced $29/mo (50k variants, **automated updates only unlock here**, stop-loss, spot markup)

**Pros:** Richest jewelry-specific formula vocabulary in the entire zero-review tier (purity, making charges, wastage, stones, taxes, stop-loss floor, spot markup). Only app disclosing metaobject read/write access — suggests a more structured data model under the hood.

**Cons:** Automated (non-manual) repricing is **gated to the top tier only** — Starter and Basic require manually clicking to reprice, a real limitation. Developer's own site is an unconfigured template placeholder (literal "A short heading about [your app]" boilerplate) — signals a brand-new solo build with no real support infrastructure yet.

### HW Gold Price Sync — Huptech Web Private Limited (Ahmedabad, India)
**Launched** Sep 26, 2025 · **Rating** 0 reviews · **Pricing** $2.99/mo flat, single tier — cheapest app in the entire set

**Pros:** Backed by a large, credentialed Shopify Plus agency (9+ years, 420+ projects, $200M+ client revenue impact) with named jewelry case studies (Liali Jewellery, La Marquise) — real warm distribution channel via existing agency-client relationships. Rules at collection, product, or variant level. Cron run logs for transparency.

**Cons:** No stated variant/product limits at all (single undifferentiated tier — could mean unlimited, could mean an undisclosed cap merchants discover later). Not marketed on the agency's core homepage — a minor side-app relative to their real business.

### GoldSync — Quest For Tech (Surat, India)
**Launched** Sep 30, 2025 · **Rating** 0 reviews · **Pricing** Entirely free, no paid tiers

**Pros:** Only app explicitly differentiating diamond type (Natural / Lab-Grown / Moissanite) — a real, unclaimed differentiator. Historical data/audit tracking. Injects directly into the storefront theme (only app disclosing Online Store/theme edit access).

**Cons:** Developer (Quest For Tech) is a generic digital marketing agency with zero mention of this app anywhere on their own site — reads as an unmonetized, possibly unmaintained side project. No paid tiers means no committed support SLA to expect.

### Spotmetal — Qbytesoft (Dhaka, Bangladesh)
**Launched** May 8, 2026 · **Rating** 0 reviews · **Pricing** Free (hourly sync) → Professional $19/mo or $199/yr (15min sync, buyback calculator, 1k variants) → Advanced $49/mo or $499/yr (1min real-time, unlimited variants, weight-bracket pricing, buyback dashboard)

**Pros:** **One of only two apps in the entire set with a buyback workflow** (forms, calculator, real-time buyback dashboard). Named data sources (Gold.de, KITCO, metalpriceapi). Widest reach among the newer apps (8 languages: EN/FR/DE/ES/AR/TR/PL/NL). Tiered weight-bracket pricing on top tier.

**Cons:** Free tier has no buyback tools and only hourly (not real-time) sync — real capability is gated behind paid tiers. Backed by a 4-product agency (Qbytesoft) where this is one of several unrelated SaaS products (a garage/workshop app, a form builder, a design studio), not a dedicated jewelry/bullion focus.

### Keep Up With Metals — GMAppify (Delray Beach, FL)
**Launched** Nov 7, 2024 · **Rating** 0 reviews · **Pricing** Metered by widget "loads": Free + $0.85/load → Starter $15/mo + $0.25/load → Pro $75/mo + $0.17/load → Enterprise $300/mo + $0.05/load

**Pros:** Widest language support in the entire set (20 languages). Built-in analytics dashboard tracking impressions/clicks/revenue attribution from the widget — unique.

**Cons: This app does not appear to actually reprice Shopify products at all** — it's a display/ticker + markup-display tool only, not a repricing engine, despite sharing a category with 15 apps that do reprice. Every pricing tier's feature list contains the literal bullet "Built for Shopify" with no actual badge shown on the listing — looks like leftover template copy, treat as unearned/likely false. Metered-per-load pricing is an unusual model for this niche, suggesting a repurposed generic banner-app template. Developer's own domain now serves an unrelated WordPress blog — likely lapsed.

### Live Gold Rate Updater — Thinkersteps Technologies (Nagpur, India / listed Sharjah, UAE)
**Launched** Jul 10, 2025 · **Rating** 0 reviews · **Pricing** Free (1 variant) → Starter $5/mo, 100 variants → Pro $19/mo, 1000 variants → Enterprise $49/mo, unlimited — 4 tiers, most granular ladder in the set

**Pros:** Stop-loss limits. Full activity/audit log. Labour cost + profit margin custom formulas. Claims Shopify POS compatibility (though unverified elsewhere on the listing).

**Cons:** Tier gating uses vague "Limited/Less/More/Full Access" language rather than concrete numbers for its two headline features (automated updates, stop-loss) — genuinely ambiguous what you get at each price point. Location inconsistency between the Shopify listing (Sharjah, UAE) and the developer's own site (Nagpur, India) — a credibility flag worth independently verifying. POS claim not reflected in the app's own "Works with" integrations list.

### Gold & Silver Live Rate — Thriftizer (Bangalore, India)
**Launched** May 14, 2026 · **Rating** 0 reviews · **Pricing** Free Forever (10 products cap, tightest free tier in the set) → Starter $9.99/mo → Professional $19.99/mo → Enterprise $49.99/mo

**Pros:** On paper, the most feature-rich listing in the entire set — claims EMI/installment calculator, gold savings plan, hallmark check, and an AI jewelry chat assistant, none of which any competitor offers.

**Cons:** These standout claims appear only in loosely-formatted, concatenated bullet text rather than clean standalone feature descriptions — unclear how much is actually shipped versus aspirational marketing. Pricing page link on the listing is broken (points to an unrelated privacy-policy URL). Developer's own site ("India's #1 Shopify Premier Partner" claim) is essentially a single near-empty page. Treat every unique claim here as unverified until tested directly.

### Pricify — Alldaybargain (New Delhi, India)
**Launched** Apr 2, 2026 · **Rating** 0 reviews · **Pricing** Entirely free, single tier, no paid plans at all

**Pros:** Genuinely simple, no-cost bulk price calculator. Collection-based filtering to target gold or silver inventory separately. Preview table before syncing live.

**Cons: Does not fetch live rates at all** — despite sharing a category with true live-sync apps, this requires the merchant to manually type in "today's market rate per gram" every time. No stop-loss, no diamond/gemstone handling, no multi-currency, no POS, no scheduling of the input step itself. Developer's own site (a generic Delhi digital marketing agency) has zero mention of this app — likely an unmonetized side project with no committed support.

### JewelyEcom — Niva Ventures LLP (Surat, India)
**Launched** Jun 25, 2026 (newest app in the entire set) · **Rating** 0 reviews · **Pricing** Single "Gold Plan" — $20/mo flat, no free tier, no trial

**Pros:** **Only app in the set with genuine diamond-type differentiation and GST breakdown** (natural vs lab-grown diamonds, up to 4 diamond types per product, full customer-facing gold weight + making charges + diamond details + GST breakdown). Backed by a real jewelry CAD/rendering production studio (Niva Ventures) with an existing base of jewelry-brand clients across India/UAE/Canada — a genuine warm-distribution advantage if they choose to push it.

**Cons:** Appears to require merchant-triggered rate updates rather than true automatic external live-rate polling ("When you update the gold rate, the app recalculates..." implies a manual trigger, similar to Pricify). No free tier or trial at all — high-friction first purchase. No stop-loss, no buyback, no AI chat, no multi-currency, no POS.

---

*Sources: all data scraped live from apps.shopify.com listing pages and linked developer websites on 2026-07-15. See [architecture.md](architecture.md) for how this feeds into product decisions.*
