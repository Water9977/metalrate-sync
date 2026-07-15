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

## Pricing volatility, rounding, and the "ugly $3 move" question (2026-07-16)

Real question that came up: a $220 22K gold chain, gold ticks a little, does the price now show $217 or $223 and look broken? Researched this properly instead of guessing.

**Real volatility numbers (mid-2026, sourced from Barchart ADR/ATR and CBOE GVZ):** on $200 of gold content, expect roughly **$3-8 of movement on a normal day, $10-15+ on a volatile one**. Silver and platinum move proportionally more (silver's daily range runs ~2x gold's). So the "ugly $3 swap" the question describes isn't a bug or an edge case — it's the realistic, common outcome of tracking spot price honestly. 2026 has been an unusually volatile year for metals generally (gold spiked over $5,100/oz in January, crashed, sits around $4,050 now), so if anything today's swings are a bit above long-run normal, not below it.

**Built the fix — but the research changed which way to point the *default*.** Added three new formula settings: `roundingStep` (round to nearest 0/1/5/10/25/50/100), `endsIn99` (charm pricing), and `minChangeAmount` (skip repricing if the move is smaller than this). See [pricing.server.ts](metalrate-sync/app/services/pricing.server.ts).

Then visited real stores to check the actual assumption. Full findings: [research/pricing-volatility-and-rounding.md](research/pricing-volatility-and-rounding.md).
- **Bullion dealers (13 sites checked: APMEX, JM Bullion, SD Bullion, Kitco, Liquid Bullion, etc.) are unanimous: exact-cent pricing, everywhere, no exceptions.** None round. Most run a live ticker. This confirms the app's default (roundingStep 0, minChangeAmount 0 = exact tracking) is correct for that segment, don't touch it.
- **Real by-weight jewelry sellers (BlueStone, Melorra, PNG Jewellers, CRM Jewelers, Orionz — the actual target segment, not generic DTC brands) mostly do NOT round either.** BlueStone and Melorra show fully arbitrary rupee amounts with no smoothing at all. CRM Jewelers rounds only to the nearest whole dollar, never to a step. They build trust through a visible rate ticker or an itemized price breakup instead of a clean-looking number. Only **fixed-price, non-gold-linked** brands (Mejuri, Catbird, Ana Luisa — prices set by hand, not tied to spot) land on clean $5/$10 steps, and they can do that precisely because their price isn't chasing a moving target.

**So the honest takeaway: rounding/threshold is a real, useful, and differentiated feature (nobody else in the competitive set has it), but it should ship as an opt-in a jeweler reaches for if they want it, not a default the app pushes on everyone.** Default stays exact/always-update to match what real by-weight sellers actually do today. If a merchant explicitly wants clean numbers (a valid ask, just not the market norm), roundingStep 5 or 10 plus minChangeAmount ~5 gets there.

## Is this ready to show Chris? (honest answer)

**Ready to screen-share as a live proof-of-concept — not ready to hand him for real use on his real store yet.** Be clear about that distinction with him. Specifically:

**Solid:**
- The core loop is proven, not theoretical — formula → preview → sync → real price change, verified in the actual admin.
- Preview-before-commit and full audit trail (his exact complaint about Gold Feed's silent failures) both work today.
- Stop-loss, multiple metals, purity presets all in place.

**Solid, added 2026-07-15/16:**
- **Bulk CSV import is built and verified.** [app.products.import.tsx](metalrate-sync/app/routes/app.products.import.tsx) + [import.server.ts](metalrate-sync/app/services/import.server.ts). Download catalog → edit in Excel → upload → matched by SKU → weight/formula set for every matched row in one pass. Reports SKUs it couldn't find and unrecognized formula names instead of silently skipping them. Verified with a 9-assertion mocked-admin integration test against the real local database (real SKU matching, real formula lookup, real "not found"/"invalid formula" reporting) — see the Changelog entry below for what was actually checked. **One thing still not done: a real click-through in the live browser UI** — the logic is proven, the UI wiring around it (file upload, toast, results table) hasn't been watched running by a human yet.
- **True 10k+ scale is handled properly now**, not just capped. [catalog.server.ts](metalrate-sync/app/services/catalog.server.ts) uses fast pagination for catalogs under 2,000 variants (instant) and automatically escalates to Shopify's own Bulk Operations API beyond that — the officially recommended mechanism for exactly this. Verified with a 2,500-item mocked catalog test proving the full start → poll → download → parse cycle, plus a fallback test proving it degrades gracefully instead of crashing if the bulk mutation errors.
- **Weight units**: grams, troy ounce, pennyweight, tola, vori — both on the Products page and as alternate CSV column names (`weight_tola`, `weight_troy_oz`, etc.). Verified the tola conversion factor against the real formula.
- **Scheduled auto-sync is real, not config-only anymore.** [scheduler.server.ts](metalrate-sync/app/services/scheduler.server.ts) ticks every minute and runs a shop's sync once its interval has elapsed, using Shopify's official `unauthenticated.admin()` background-job pattern. Verified the due/not-due timing logic with 5 boundary-condition tests. Caveat, and it's a real one: this needs a persistent host to keep ticking — it does nothing useful on serverless hosting or once a dev laptop goes to sleep.
- Proper documentation exists now: [metalrate-sync/README.md](metalrate-sync/README.md) (developer) and [metalrate-sync/docs/user-guide.md](metalrate-sync/docs/user-guide.md) (merchant-facing — this is what to point Chris at).

**Not solid — do not oversell these:**
- Nobody has clicked through bulk import in an actual browser yet. Logic is proven, the human-facing flow isn't.
- Running on a local dev tunnel, not real hosting — the URL dies the moment `npm run dev` stops, and the scheduler needs a persistent host to mean anything. Can't hand Chris a persistent link yet.
- No billing — fine for a private design-partner test, not fine for anyone else.
- Free-tier API quota is fragile under real testing volume (see above) — bump the cache TTL in Settings before heavy testing.
- Test data is still the joke Snowboard — that's a 2-minute manual fix inside the Shopify admin, genuinely needs a human's hands (see TODO).

## Codebase map (metalrate-sync/)

- **Template**: official `shopify-app-template-react-router` (React Router 7, the current Shopify recommendation; Remix template is legacy). Embedded app, App Bridge v4, **Polaris web components** (`s-*` tags, globally registered, no imports — this is the current standard, NOT old @shopify/polaris React).
- **DB**: Prisma + SQLite (dev). Models beyond template's Session:
  - `ShopSettings` — rate provider (mock | metalpriceapi | manual), API key, base currency, cache TTL, schedule config, `lastScheduledSyncAt` (set by the scheduler, not the user)
  - `MetalRateCache` — cached spot rates per shop/metal/currency
  - `ManualRate` — merchant-entered board rates (per gram)
  - `PricingFormula` — metal, purity factor, making charge (flat/perGram/percent), wastage %, markup, tax %, `roundingStep` + `endsIn99` + `minChangeAmount` (replaced the old 3-mode `rounding` string, see the "ugly $3 move" section above), stop-loss floor
  - `VariantConfig` — per-variant: weight grams, purity override, formula assignment, last synced price
  - `SyncRun` / `SyncRunItem` — full per-variant audit trail of every sync (the trust feature)
  - `BulkCatalogJob` — tracks one in-flight/last Bulk Operations catalog fetch per shop, so a retry within the polling window reuses the running job instead of restarting it on Shopify's side
- **Services** (`app/services/`):
  - `rates.server.ts` — provider abstraction. Mock (works out of box on dev store), MetalPriceAPI (live), Manual. Caches with TTL, falls back to stale cache if provider is down.
  - `pricing.server.ts` — pure formula engine: weight × purity × rate + wastage + making + markup + tax, step rounding + charm pricing, stop-loss detection, and `isChangeBelowThreshold` (the min-change guard). Karat presets (24K/22K/18K/14K/10K/925).
  - `sync.server.ts` — THE wedge. Preview builder (diff of current vs computed price per variant) + sync executor: groups by product, chunks ≤250 variants/call (`productVariantsBulkUpdate` API limit), `allowPartialUpdates: true`, retries with exponential backoff on throttle, records per-variant outcome in SyncRunItem, unconfirmed variants treated as failed (nothing silently disappears).
  - `catalog.server.ts` — SKU-keyed catalog fetch. Fast paginated GraphQL under 2,000 variants; automatically escalates to Shopify's **Bulk Operations API** beyond that (start → poll with a bounded 45s budget → download/parse JSONL), with job state persisted so a retry doesn't restart it. Falls back to a partial fast-path result (marked truncated) if the bulk mutation itself fails, rather than throwing.
  - `csv.server.ts` — hand-rolled CSV parse/write (no dependency; handles quoted fields, embedded commas/newlines). Import expects a `sku` column, optional weight column in grams/tola/vori/troy oz/pennyweight, and `formula`.
  - `import.server.ts` — the actual bulk-import logic (extracted from the route so it's directly testable): parse → match by SKU → look up formula by name → upsert config → report what didn't match.
  - `scheduler.server.ts` — in-process scheduler, ticks every minute via `setInterval`, guarded against duplicate starts (HMR-safe) and overlapping runs per shop. Uses Shopify's official `unauthenticated.admin(shop)` background-job pattern.
  - `scheduling.server.ts` — the pure "is a sync due yet" timing decision, deliberately dependency-free so it's testable without pulling in the live Shopify app context.
- **Routes** (`app/routes/`, Polaris web components):
  - `app._index.tsx` — Dashboard: live rate cards, setup guide (4 steps), last sync summary, at-a-glance stats
  - `app.products.tsx` — product/variant list via Admin GraphQL, per-variant weight (with unit picker) + formula assignment inline, "Bulk import" button
  - `app.products.import.tsx` — **the wedge feature.** Download current catalog as CSV → edit in Excel/Sheets → upload → matches by SKU, sets weight/formula for every matched row in one pass, reports SKUs not found and unknown formula names instead of failing silently. Reuses the existing Preview & Sync flow for the actual pricing — import only writes config, it doesn't touch prices itself.
  - `app.products.export-csv.tsx` — resource route (no UI), streams the current catalog + existing config as a downloadable CSV template
  - `app.formulas.tsx` — formula list + create modal (karat presets, making charge, wastage, markup, tax, step rounding, charm pricing, minimum-change threshold, stop-loss)
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
- **Scheduler is real (in-process `setInterval`), but only works on a persistent host** — chosen deliberately over building a full job-queue system before there's a hosting decision or real usage to justify one. Settings page says this explicitly. If/when the app moves to serverless hosting, this needs replacing with a real queue.
- **Every sync writes a full audit trail** — differentiation vs Gold Feed's "pricing inaccuracies" reputation; merchants can see exactly what changed, when, at what rate.
- **No permanent automated test suite (yet)** — instead, every new service this session was verified with a throwaway `tsx` script using a mocked Shopify admin client against the real (isolated, cleaned-up) local database, then deleted. Proves real logic without ever needing a live session or touching a secret. Documented as the pattern to follow in [metalrate-sync/README.md](metalrate-sync/README.md).

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

Split by who actually has to act — most of the code/research-only backlog got cleared 2026-07-16. What's left mostly needs a human's hands: a login, a purchase, a conversation, or eyes on a live UI.

**Needs the user specifically:**

1. [ ] Click through bulk import once in the live browser UI (create a formula, upload a small real CSV, confirm the results table looks right). The logic is proven by mocked tests, the human-facing flow isn't.
2. [ ] Replace the joke Snowboard test data with 2-3 real gold/silver products (weight, SKU) directly in the Shopify admin — needs your login, not something to script blind against real store data.
3. [ ] Lock Chris in as committed design partner (reply sent, awaiting his answers on SKU count/import frequency) — show him the live proof-of-concept once (1) and (2) are done. Outreach list + messages for other prospects: [research/outreach-list-and-messages.md](research/outreach-list-and-messages.md).
4. [ ] Pick a hosting provider (Fly.io / Railway / Render) and create an account there — needs your credentials/payment method, not something done on your behalf. Deploy once decided.
5. [ ] Billing setup via Shopify App Pricing — configured through the Dev Dashboard UI, needs your login.
6. [ ] Bundle a paid rate-provider key for customers instead of BYO free-tier key — needs a purchase decision.
7. [ ] Buy a domain before App Store submission (not needed to keep building — cheap insurance for a support email + privacy policy page that doesn't look like the sketchier competitors' placeholder sites).

**Still open, buildable without the user (not yet started):**

8. [ ] Storefront rate ticker / price breakup theme extension (post-MVP, deliberately deferred this session — it's a genuinely separate component, lower priority than everything above per the original ranking).
9. [ ] eBay/marketplace sync, POS sync, Built for Shopify badge chase (later roadmap, see competition-analysis.md).
10. [ ] True 10k+ scale live-validated against a real seeded catalog (the Bulk Operations code path is built and passes mocked tests, but hasn't been run against an actual 10k-variant store yet — needs either Chris's real catalog or a dedicated seeding run, both of which are bigger asks than this session's scope).

**Done (2026-07-15/16):**
- [x] ~~Create Partner account + dev store~~ (partner account done by user; dev store created; app installed)
- [x] ~~Decide app name~~ → MetalRate Sync
- [x] ~~Prove the core loop works end to end~~ → confirmed 2026-07-15 on the real dev store
- [x] ~~Fix React Router server/client split bug~~ → see "Known issue found and fixed" above
- [x] ~~Design pass: color coding~~ → see "Design pass" above
- [x] ~~Build bulk CSV import~~ → verified with mocked integration tests, see Changelog
- [x] ~~Switch catalog fetch to Bulk Operations API for true 10k+ scale~~ → built and verified with mocked tests (live seeded-scale validation still open, see item 10)
- [x] ~~Currency + measuring-unit switching~~ → weight units (grams/troy oz/pennyweight/tola/vori) shipped; true multi-currency/Markets pricing intentionally scoped out as a distinct bigger feature, not attempted half-done
- [x] ~~Proper documentation~~ → [metalrate-sync/README.md](metalrate-sync/README.md) + [metalrate-sync/docs/user-guide.md](metalrate-sync/docs/user-guide.md)
- [x] ~~Wire real scheduled sync execution~~ → built and verified, see "Deliberate design decisions" above for the serverless caveat

## Related files

- [research/shopify-app-dev-setup.md](research/shopify-app-dev-setup.md) — full environment setup research (partner account, dev store, CLI, Claude integration)
- [competition-analysis.md](competition-analysis.md) — full feature/pricing/pros-cons breakdown of all 18 competing apps
- [research/pricing-volatility-and-rounding.md](research/pricing-volatility-and-rounding.md) — real gold/silver/platinum volatility numbers, real store pricing pattern research (bullion vs jewelry), why rounding defaults to off
- [research/outreach-list-and-messages.md](research/outreach-list-and-messages.md) — 20 real Shopify jewelry/bullion stores for design-partner outreach, with contact info and message templates

---

## Changelog

- **2026-07-15**: File created. Project motive, target segment, tech stack, and validation trail logged. Competition analysis kicked off (18 apps, 3 parallel research agents).
- **2026-07-15**: [competition-analysis.md](competition-analysis.md) completed — all 18 apps scraped live (listing pages + developer sites). Key findings: nobody has Built for Shopify, marketplace sync (eBay) and reliable bulk-update-at-scale are the two clearest whitespace gaps and both match Chris's exact ask/pain, Gold Feed Inc. (2.8★, Chris's current $40/mo incumbent) is the clearest displacement target with two public 1-star reviews on unresponsive support. MVP feature set and pricing position ($19-35/mo band, under Gold Feed's $40) drafted from this analysis — see competition-analysis.md's Recommendation section.
- **2026-07-15 (later)**: **App base built.** Name chosen: MetalRate Sync. Scaffolded official React Router template via Shopify CLI (app auto-created in Dev Dashboard). Full data model (7 new Prisma models), 3 core services (rates provider abstraction, pure pricing engine, batch sync executor with retry/audit trail), 6 Polaris web-component UI pages (dashboard w/ setup guide, products, formulas, preview & sync, history, settings), GDPR compliance webhooks. Typecheck clean, production build passes, GraphQL validated against live 2026-04 schema via Shopify Dev MCP. Next: `shopify app dev` walkthrough on dev store (needs user's interactive login).
- **2026-07-15 (evening)**: **Live end-to-end test passed on the real dev store.** Hit and fixed a React Router server/client bundling bug (constants imported from `.server.ts` files into route JSX — moved to new `app/constants.ts`). Connected live MetalPriceAPI, discovered its free tier is ~100 req/month, raised default rate cache TTL from 15min to 8h and documented it in Settings. Added a per-metal color-coding design pass (Polaris tone tokens, no raw hex) across Dashboard/Formulas/Preview. Confirmed formula → preview → apply → real Shopify price change all work. Wrote an honest Chris-readiness assessment: core loop is solid, but bulk CSV import (Chris's actual pain) doesn't exist yet — that's next before any real demo to him.
- **2026-07-15 (night)**: **Bulk CSV import built** — new `catalog.server.ts` (paginated SKU-keyed catalog fetch, capped 5k for v1), `csv.server.ts` (dependency-free parser/writer), `app.products.export-csv.tsx` (download current catalog as a template) and `app.products.import.tsx` (upload → match by SKU → bulk-set weight/formula → report what didn't match). GraphQL and all new Polaris components validated against live schema/docs via Shopify Dev MCP; typecheck and build clean. Not yet exercised against a real file — that's the top TODO item now. Added currency/measuring-unit switching (grams/troy oz/tola/vori + display currency picker) and proper user+developer documentation to the roadmap.
- **2026-07-16**: Researched the "ugly $3 price swing" question properly instead of guessing. Real numbers: $200 of gold content moves $3-8/day normally, $10-15+ on a volatile day (2026 has been a high-vol year, gold hit $5,100 in January then crashed). Built `roundingStep`/`endsIn99`/`minChangeAmount` on `PricingFormula`. Then visited 13 real bullion sites and 9 real jewelry sites and found real by-weight sellers (BlueStone, Melorra, CRM Jewelers) mostly don't round at all — only fixed-price non-gold-linked brands do. **Corrected the plan**: rounding/threshold ships as opt-in, default stays exact to match the real market. Full writeup: [research/pricing-volatility-and-rounding.md](research/pricing-volatility-and-rounding.md). Also built a 20-store outreach list (jewelry + bullion, all Shopify-confirmed) with message templates: [research/outreach-list-and-messages.md](research/outreach-list-and-messages.md).
- **2026-07-16 (later)**: **Cleared the entire code/research backlog that didn't need the user's hands.** Six things, in order:
  1. **Verified bulk CSV import end to end** — not against the live dev store (that would've needed printing a live API secret to the transcript to obtain a session outside the running app; the auto-mode classifier correctly blocked that attempt). Instead extracted the import logic into [import.server.ts](metalrate-sync/app/services/import.server.ts) and wrote a mocked-Shopify-admin integration test against the real local database (isolated by a throwaway shop key, cleaned up after): 9/9 assertions passed — correct SKU matching, correct formula lookup, correct "not found"/"invalid formula" reporting, correct DB writes.
  2. **Replaced the 5,000-variant in-memory cap with Shopify's real Bulk Operations API** in [catalog.server.ts](metalrate-sync/app/services/catalog.server.ts) — fast pagination under 2,000 variants, automatic escalation to a polled bulk query beyond that, job state persisted so retries don't restart it, graceful fallback if the bulk mutation errors. Verified with a 2,500-item mocked catalog test (proves the full start/poll/download/parse cycle) plus a failover test. 4/4 passed.
  3. **Weight unit switching** — grams, troy ounce, pennyweight, tola, vori, on both the Products page and as CSV column variants. Verified tola's conversion factor for real.
  4. **Real scheduled sync** — [scheduler.server.ts](metalrate-sync/app/services/scheduler.server.ts), ticks every minute, uses Shopify's official `unauthenticated.admin()` background-job pattern, guarded against duplicate starts and overlapping per-shop runs. Timing logic extracted to dependency-free [scheduling.server.ts](metalrate-sync/app/services/scheduling.server.ts) and verified with 5 boundary tests.
  5. **Proper documentation** — rewrote [metalrate-sync/README.md](metalrate-sync/README.md) to actually describe this app (was still 100% template boilerplate) including the testing pattern used throughout this session; added [metalrate-sync/docs/user-guide.md](metalrate-sync/docs/user-guide.md) for Chris/beta testers.
  6. Updated this file throughout.

  Everything above: typecheck clean, production build clean, checked at every step, not just at the end. What's left in the TODO now is almost entirely things that need the user directly (a login, a purchase, a conversation, or eyes on a live screen) — see the reorganized TODO list above.
