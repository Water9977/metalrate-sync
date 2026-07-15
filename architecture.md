# Architecture.md — MetalRate Sync

Truth source document for this project. Anyone (human or AI) reading this file should instantly understand what this project is, where it stands, why decisions were made, and what's next. Updated after every substantive prompt.

---

## What this is

**MetalRate Sync** — a Shopify app that automatically updates product prices based on live gold, silver, platinum and palladium rates, so jewelry and bullion sellers never have to manually reprice their catalog when the market moves. Core wedge: bulk update reliability at 10k+ SKU scale plus preview-before-commit.

App name: **MetalRate Sync** (chosen for ASO keyword coverage: metal + rate + sync; doesn't lock us out of jewelry segment the way "Bullion" branding would).

## Current status

**Stage: Working end-to-end on a real dev store.** App code lives in [metalrate-sync/](metalrate-sync/). Partner account exists, dev store created (`metal-rate-sync-testing-store.myshopify.com`), app installed. **First live test succeeded 2026-07-15**: formula created → product assigned a weight → Preview & Sync showed the computed price → Apply pushed it to Shopify → confirmed the real product price changed in the Shopify admin. The core loop works.

## How it works (plain English)

A merchant creates a **formula**: pick a metal (gold/silver/platinum/palladium), a purity (22K, 18K, sterling, etc.), and how they want to add making charges, wastage %, markup, and tax on top of the raw metal value. That formula is just math — it doesn't touch anything by itself.

Then they go to a **product variant** and tell the app two things: how much it weighs in grams, and which formula to use. Now that variant is "tracked."

Every time the merchant opens **Preview & Sync**, the app fetches today's live gold/silver/platinum/palladium rate, runs every tracked variant through its assigned formula, and shows a table: current price → what the new price would be → % change. **Nothing changes in the store yet at this point** — it's a dry run so the merchant can sanity-check before committing (this is the one thing multiple competitors don't do, see competition-analysis.md).

When they click **Apply**, the app pushes the new prices to Shopify in safe batches and writes down exactly what happened to every single variant — updated, skipped, or failed and why — in **History**. That audit trail is the actual product: the wedge against Gold Feed Inc. (Chris's current $40/mo app) isn't cleverer math, it's that this one doesn't quietly break and go silent when something goes wrong.

## First live test results (2026-07-15)

Confirmed working: rate fetch (MetalPriceAPI live), formula math (22K gold, correct purity factor applied), preview diff table, apply → real Shopify price update, all in the actual dev store admin.

One thing to note from that test: the sample product used ("Snowboard," Shopify's default seeded test data) isn't a real gold item, so its price jumped **+1672%** — that's expected and correct given the nonsense input (a snowboard doesn't weigh what a gold formula assumes), not a bug. **Before demoing to Chris, replace test data with realistic products/weights** — do not show him a snowboard repriced to $12,403.

## Known issue found and fixed: React Router server/client split

Hit this live: `METAL_LABELS`/`SUPPORTED_METALS`/`PURITY_PRESETS` were originally defined inside `.server.ts` service files and imported directly into route components for rendering. React Router strips `.server.ts` files down to just `loader`/`action` when bundling for the browser — pulling a plain constant out of one for JSX breaks the split, and the failure mode is nasty: Vite's error overlay is a full-page modal that blocks the *entire* app regardless of which tab is open, so it looked like every page was broken when only one import was wrong.

**Fix**: moved `METAL_LABELS`, `SUPPORTED_METALS`, `PURITY_PRESETS`, and a new `METAL_TONE` color map into [app/constants.ts](metalrate-sync/app/constants.ts) — a plain file with no `.server` suffix, safe to import from both loaders and JSX. Rule going forward: **anything a route renders directly must not live in a `.server.ts` file**, only functions called inside `loader`/`action` can.

## Known constraint: MetalPriceAPI free tier

Free plan = ~100 requests/month, **per merchant's own API key** (each shop brings its own key in Settings — not shared across installs). At the original 15-minute cache default this blows the monthly quota in about a day. Fixed: default `rateTtlMinutes` raised to 480 (8h) for all new installs, and Settings now explains the tradeoff. Existing shops (including the test store) should bump this manually in Settings if they're on the free tier. Roadmap item: bundle a paid rate-provider key for paying customers so nobody has to think about this themselves.

## Design pass (2026-07-15)

Added color coding using Polaris's own tone tokens (no raw hex — stays native to Shopify admin in light/dark mode): Gold = warning (amber), Silver = neutral (grey), Platinum = info (blue), Palladium = success (teal). Applied consistently to the Dashboard rate cards, the Formulas table's Metal column, and the Preview & Sync rate badges, so a merchant scanning any of these screens can recognize a metal by color, not just text.

## Is this ready to show Chris? (honest answer)

**Ready to screen-share as a live proof-of-concept — not ready to hand him for real use on his real store yet.** Be clear about that distinction with him. Specifically:

**Solid:**
- The core loop is proven, not theoretical — formula → preview → sync → real price change, verified in the actual admin.
- Preview-before-commit and full audit trail (his exact complaint about Gold Feed's silent failures) both work today.
- Stop-loss, multiple metals, purity presets all in place.

**Not solid — do not oversell these:**
- **No bulk import yet.** This is the big one. Chris's actual pain is pressing an import button 100+ times across weeks — a bulk CSV/spreadsheet workflow to assign weight+formula to thousands of variants at once. What's built so far is bulk *sync execution* (safely repricing many already-configured variants in one batched, retried operation) — a different thing from bulk *import/configuration*. Don't imply this is solved until it is. Top of the TODO list below.
- Scheduled auto-sync is config-only — turning the toggle on in Settings doesn't actually run anything yet, no job runner wired up.
- Running on a local dev tunnel, not real hosting — the URL dies the moment `npm run dev` stops. Can't hand him a persistent link yet.
- No billing — fine for a private design-partner test, not fine for anyone else.
- Free-tier API quota is fragile under real testing volume (see above).

## Codebase map (metalrate-sync/)

- **Template**: official `shopify-app-template-react-router` (React Router 7, the current Shopify recommendation; Remix template is legacy). Embedded app, App Bridge v4, **Polaris web components** (`s-*` tags, globally registered, no imports — this is the current standard, NOT old @shopify/polaris React).
- **DB**: Prisma + SQLite (dev). Models beyond template's Session:
  - `ShopSettings` — rate provider (mock | metalpriceapi | manual), API key, base currency, cache TTL, schedule config
  - `MetalRateCache` — cached spot rates per shop/metal/currency
  - `ManualRate` — merchant-entered board rates (per gram)
  - `PricingFormula` — metal, purity factor, making charge (flat/perGram/percent), wastage %, markup, tax %, rounding mode, stop-loss floor
  - `VariantConfig` — per-variant: weight grams, purity override, formula assignment, last synced price
  - `SyncRun` / `SyncRunItem` — full per-variant audit trail of every sync (the trust feature)
- **Services** (`app/services/`):
  - `rates.server.ts` — provider abstraction. Mock (works out of box on dev store), MetalPriceAPI (live), Manual. Caches with TTL, falls back to stale cache if provider is down.
  - `pricing.server.ts` — pure formula engine: weight × purity × rate + wastage + making + markup + tax, rounding modes (exact/whole/.99), stop-loss detection. Karat presets (24K/22K/18K/14K/10K/925).
  - `sync.server.ts` — THE wedge. Preview builder (diff of current vs computed price per variant) + sync executor: groups by product, chunks ≤250 variants/call (`productVariantsBulkUpdate` API limit), `allowPartialUpdates: true`, retries with exponential backoff on throttle, records per-variant outcome in SyncRunItem, unconfirmed variants treated as failed (nothing silently disappears).
- **Routes** (`app/routes/`, Polaris web components):
  - `app._index.tsx` — Dashboard: live rate cards, setup guide (4 steps), last sync summary, at-a-glance stats
  - `app.products.tsx` — product/variant list via Admin GraphQL, per-variant weight + formula assignment inline
  - `app.formulas.tsx` — formula list + create modal (karat presets, making charge, wastage, markup, tax, rounding, stop-loss)
  - `app.sync.tsx` — Preview & Sync: full diff table (current/new/% change/status), stop-loss + missing-data banners, apply button
  - `app.history.tsx` — run list + per-variant drill-down with rate snapshot per run
  - `app.settings.tsx` — provider/API key/currency/cache TTL/schedule, manual rate entry
  - `webhooks.compliance.tsx` — mandatory GDPR trio (customers/data_request, customers/redact, shop/redact); app stores no customer data, shop/redact wipes all shop rows
  - Template's `webhooks.app.uninstalled.tsx` + `webhooks.app.scopes_update.tsx` kept as-is
- **Config**: `shopify.app.toml` — scopes `write_products`, webhook API version 2026-10, compliance webhooks registered. App API version: October25 (template default).

## Deliberate design decisions

- **Variant config lives in app DB, not metafields (for now).** Simpler MVP; metafield sync + CSV/Matrixify import comes later (import reliability is Chris's pain — CSV import is a fast follow, not in base).
- **Rate providers behind an interface** — mock provider default so the app fully works on a dev store with zero external accounts. MetalPriceAPI chosen as first real provider (same vendor competitor Metal Updater uses; free tier available). IBJA (India) provider is a later add.
- **Preview-before-commit is default flow, not optional** — closes Metal Updater's admitted "Coming Soon" gap, matches JewelSync/Pricify, builds the trust the category lacks.
- **Scheduler is config-only for now** — `scheduleEnabled/scheduleInterval` stored, but execution needs a host-level job runner (decided at deploy time; in-process cron dies on serverless). Settings page says this explicitly.
- **Every sync writes a full audit trail** — differentiation vs Gold Feed's "pricing inaccuracies" reputation; merchants can see exactly what changed, when, at what rate.

## Key decisions made so far (validation phase)

- **Target segment: bullion / coin / by-weight dealers first, not generic fashion jewelry.** Evidence: bullion sellers treat live repricing as "selling bullion without it isn't viable" (multi-year incumbent retention). Fashion jewelry sellers pushed back on Reddit — many price on acquisition cost and only bump periodically, softer/more skeptical buyer.
- **Core wedge: reliable bulk import/price update at scale, not just live pricing math.** Every incumbent already does the metal-rate math fine. The actual pain (per design partner Chris) is bulk catalog updates breaking/stalling.
- **First design partner: Chris, CEO of Liquid Bullion** (liquidgoldnuggets.com). Currently pays $40/mo to Gold Feed Inc.'s app (2.8★) which has a broken bulk-import feature; dev is dismissive. Confirmed would pay ~$30-35/mo for a better version. Wants eBay sync eventually too.
- **Tech stack**: Shopify CLI + **React Router template** (current official recommendation, Remix is legacy) + Polaris + **GraphQL Admin API only** (REST banned for new public apps since April 1, 2025). Hosting candidate: Fly.io / Railway / Render (not decided). Billing via Shopify App Pricing (no custom Billing API code needed), use the no-charge plan feature (July 2026) to test billing on a dev store for free.
- **Claude Code + Shopify integration already exists and is already installed** in this dev environment — the `shopify-plugin` MCP tools (`learn_shopify_api`, `search_docs_chunks`, `validate_graphql_codeblocks`, etc.) are Shopify's official open-source AI Toolkit. Use these instead of trusting model memory for GraphQL/Polaris specifics — that's exactly where AI hallucination hits hardest on this platform (see [research/shopify-app-dev-setup.md](research/shopify-app-dev-setup.md)).
- **Dev Dashboard, not the old Partner Dashboard**, is the current account/store management surface (cutover Jan 1, 2026). Older tutorials referencing "Partner Dashboard" steps are stale.
- **Avoid PII/protected-customer-data scopes in v1** — skips extra review friction, not needed for this app's core function.

## Validation trail

- **Cold email**: 20 Shopify jewelry/bullion stores emailed. Real replies received, including Mejuri (large DTC brand, canned CX reply, not a real prospect — ignore) and **Chris/Liquid Bullion** (strong signal, see above).
- **Reddit**: posted to r/askjewelers and r/shopify from a throwaway/bait account. Mixed reception — one post downvoted to 0, experienced jewelers pushed back that daily spot-repricing isn't how most fashion jewelry is priced. Useful signal: sharpened segment choice toward bullion/by-weight sellers. Decision: stop using bait/throwaway accounts for future outreach, honest "I'm building this, would it help?" posts and cold email performed better anyway.
- **Competitive research**: 18 apps found in this niche via Shopify App Store. Only 7 have any reviews at all (total ~25 reviews across all 18 apps). None hold the Built for Shopify badge. Full breakdown: [competition-analysis.md](competition-analysis.md).

## Roadmap

- **Phase 0 — Validate** (in progress): confirm 2-3 more Chris-type design partners, especially bullion/by-weight sellers. Nail down MVP feature set from competition-analysis.md gap findings.
- **Phase 1 — Build MVP**: Shopify CLI scaffold, product metafields (metal weight, karat, making charge %), rate source integration, scheduled bulk repricing that doesn't break at scale (the wedge), price floors/stop-loss, one theme extension (rate bar + price breakup).
- **Phase 2 — Submit + beta**: run Shopify's AI self-review tool pre-submission, expect 4-6 week review queue, recruit beta users from design-partner list while waiting.
- **Phase 3 — First revenue**: $25-35/mo pricing (validated by Chris), manual outreach only until 25+ reviews, neutral review asks after support wins (Shopify's review-trust crackdown as of July 6, 2026 makes incentivized reviews high-risk — never do that).
- **Phase 4 — Compound**: chase Built for Shopify badge (unclaimed by any competitor in this niche), start App #2 (customer account extensions, bigger ceiling) once this one is running.

## Open questions / TODO (priority order)

1. [ ] **CSV/XLSX bulk import** — assign weight + formula to many variants at once by upload, matched by SKU or handle. This is Chris's actual pain and the #1 gap before any real demo/handoff.
2. [ ] Swap dev-tunnel test data for realistic gold/silver products with correct gram weights before showing anyone the app live.
3. [ ] Lock Chris in as committed design partner (reply sent, awaiting his answers on SKU count/import frequency) — show him the live proof-of-concept once (1) and (2) are done.
4. [ ] Load-test sync engine at 10k+ variants on a dev store seeded with bulk products.
5. [ ] Pick hosting provider (Fly.io / Railway / Render / Cloud Run) and deploy — dev tunnel URL isn't persistent.
6. [ ] Wire real scheduled sync execution (needs hosting decision above; in-process cron dies on serverless).
7. [ ] Billing setup via Shopify App Pricing + no-charge test plan (once core flow is validated with real users).
8. [ ] Storefront rate ticker / price breakup theme extension (post-MVP).
9. [ ] Bundle a paid rate-provider key for customers instead of BYO free-tier key.
10. [ ] eBay/marketplace sync, POS sync, Built for Shopify badge chase (later roadmap, see competition-analysis.md).

**Done:**
- [x] ~~Create Partner account + dev store~~ (partner account done by user; dev store created; app installed)
- [x] ~~Decide app name~~ → MetalRate Sync
- [x] ~~Prove the core loop works end to end~~ → confirmed 2026-07-15 on the real dev store
- [x] ~~Fix React Router server/client split bug~~ → see "Known issue found and fixed" above
- [x] ~~Design pass: color coding~~ → see "Design pass" above

## Related files

- [research/shopify-app-dev-setup.md](research/shopify-app-dev-setup.md) — full environment setup research (partner account, dev store, CLI, Claude integration)
- [competition-analysis.md](competition-analysis.md) — full feature/pricing/pros-cons breakdown of all 18 competing apps

---

## Changelog

- **2026-07-15**: File created. Project motive, target segment, tech stack, and validation trail logged. Competition analysis kicked off (18 apps, 3 parallel research agents).
- **2026-07-15**: [competition-analysis.md](competition-analysis.md) completed — all 18 apps scraped live (listing pages + developer sites). Key findings: nobody has Built for Shopify, marketplace sync (eBay) and reliable bulk-update-at-scale are the two clearest whitespace gaps and both match Chris's exact ask/pain, Gold Feed Inc. (2.8★, Chris's current $40/mo incumbent) is the clearest displacement target with two public 1-star reviews on unresponsive support. MVP feature set and pricing position ($19-35/mo band, under Gold Feed's $40) drafted from this analysis — see competition-analysis.md's Recommendation section.
- **2026-07-15 (later)**: **App base built.** Name chosen: MetalRate Sync. Scaffolded official React Router template via Shopify CLI (app auto-created in Dev Dashboard). Full data model (7 new Prisma models), 3 core services (rates provider abstraction, pure pricing engine, batch sync executor with retry/audit trail), 6 Polaris web-component UI pages (dashboard w/ setup guide, products, formulas, preview & sync, history, settings), GDPR compliance webhooks. Typecheck clean, production build passes, GraphQL validated against live 2026-04 schema via Shopify Dev MCP. Next: `shopify app dev` walkthrough on dev store (needs user's interactive login).
- **2026-07-15 (evening)**: **Live end-to-end test passed on the real dev store.** Hit and fixed a React Router server/client bundling bug (constants imported from `.server.ts` files into route JSX — moved to new `app/constants.ts`). Connected live MetalPriceAPI, discovered its free tier is ~100 req/month, raised default rate cache TTL from 15min to 8h and documented it in Settings. Added a per-metal color-coding design pass (Polaris tone tokens, no raw hex) across Dashboard/Formulas/Preview. Confirmed formula → preview → apply → real Shopify price change all work. Wrote an honest Chris-readiness assessment: core loop is solid, but bulk CSV import (Chris's actual pain) doesn't exist yet — that's next before any real demo to him.
