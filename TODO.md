# MetalRate Sync — TODO

Single source of truth for what's left. Cross-linked with [architecture.md](architecture.md) (full narrative/decisions) — this file is the flat checklist to work off of. Slash items as they're done, don't delete them (keep the record).

Last updated: 2026-07-19 (evening — audit #2 findings added).

---

## 🐛 Bugs & loopholes — OPEN (from audit #2, 2026-07-19)

Fresh audit pass after all audit-#1 fixes shipped. Full detail per finding in [research/code-audit-2026-07-19.md](research/code-audit-2026-07-19.md). Ordered by priority.

**Quota-burn class (the "preview & sync drains the limit" question):**
- [ ] Q1 — no single-flight lock on `getRates`: concurrent page loads each fire a provider API call at every TTL expiry (2–5x duplicate calls)
- [ ] Q2 — every Settings save wipes the rate cache unconditionally → guaranteed API refetch even when nothing rate-related changed
- [ ] Q3 — merchant can set rate TTL as low as 1 minute → quota gone in <2h; lethal once the shared app-owned key ships
- [ ] Q4 — scheduler tick launches all due shops simultaneously, unbounded concurrency, N shops = N provider fetches for the same global rates
- [ ] Q5 — **the structural fix for the whole class**: app-owned key + global (not per-shop) rate cache + server-controlled fetch cadence + plan-gated manual refresh (2/day Starter, 5/day Pro). Kills Q1–Q4 and IS the plan-limit mechanism. Do this as one build.

**Product-safety:**
- [ ] P1 (HIGH) — mock/demo rates are the default provider and nothing blocks Apply or scheduling with them → real store can sync fake prices. Gate it.
- [ ] P2 (MED-HIGH) — formula form accepts empty/NaN/negative numbers; empty purity coerces to 0 and zeroes prices. Server-side validation needed.
- [ ] P3 — Apply payload is client-trusted; forged payload can poison the audit-trail rateSnapshot / bypass staleness. Fix = server-side preview storage (bundles with S1).
- [ ] P4 — `shop/redact` GDPR wipe misses the `BulkCatalogJob` table (one line).

**Scale (10k-SKU pitch):**
- [ ] S1 — Apply round-trips the whole preview through the browser (multi-MB at 10k variants) + preview table has no pagination. Same fix as P3.
- [ ] S2 — bulk catalog JSONL fully buffered in memory (fine to ~50k variants, streaming later)
- [ ] S3 — History details silently cap at 500 items, no indicator

**Cosmetic:**
- [ ] M-a — baseCurrency change relabels manual rates without conversion
- [ ] M-b — `lastPrice` from client hidden field, can be stale

## 🐛 Bugs — CLOSED (audit #1, 2026-07-18)

All 18 findings resolved 2026-07-18/19 (commit `c9f497e`) — see architecture.md "Code audit fix pass" for exact detail on each.

- [x] H1 — rate-cache freshness loop could burn the whole API quota
- [x] H2 — scheduler + expired offline tokens (circuit breaker added)
- [x] H3 — preview/apply price drift (approved price is now guaranteed on Apply)
- [x] H4 — hardcoded SQLite path (fixed during Railway deploy)
- [x] M1 — city choice wiped on wrong-provider save
- [x] M2 — History run totals didn't reconcile
- [x] M3 — weight-unit input trap (11.66x price risk)
- [x] M4 — product search hammered Admin API (debounced now)
- [x] M5 — bulk import unbounded file read + duplicate-row distortion
- [x] M6 — uninstalled shop kept scheduler grinding for 48h
- [x] M7 — CSV export formula-injection guard
- [x] L3 — brittle duplicate-name detection (now uses Prisma error code)
- [x] L4 — dead remove-variant action (wired up to a real button)
- [x] L5 — route-nesting landmine on export-csv (renamed)
- [x] L6 — dev-machine scheduler fired real syncs while coding (guarded)
- [ ] L1 — money stored as Float, not Decimal — **deliberately deferred**, see architecture.md, do as its own dedicated pass before real transaction volume, not urgent
- [ ] L2 — rate-provider API key in URL/plaintext — accepted for current BYO-key dev model, resolves itself once the single app-owned key ships (see Billing/Launch section)
- [ ] L7 — scheduler is single-instance only — fine at current scale, revisit only if Railway scales to multiple replicas
- [ ] L8 — Preview loader triggers rate fetches — resolved in practice by the H1 fix, no action needed

---

## 🔒 Required builds before general launch (not bugs — missing features/gates)

- [ ] **Billing via Shopify App Pricing.** Hard blocker — apps using off-platform billing can't be submitted to the App Store at all. Configured through the Dev Dashboard (no custom Billing API code needed for standard subscription tiers). Pricing decided: $30/mo Starter (500 SKU, 2x/day sync) / $50/mo Pro (unlimited, 5x/day, priority support), 14-day trial, no permanent free tier.
- [ ] **Plan-limit enforcement in code.** Nothing currently stops a Starter merchant from syncing unlimited times a day or tracking unlimited SKUs — `scheduleInterval` accepts any value ≥15min regardless of plan, no SKU-count gate exists anywhere. Needs: (a) a SKU/variant-count cap check before allowing more `VariantConfig` rows to be enabled, (b) a sync-frequency cap tied to the shop's plan (both scheduled interval and a rate-limit on manual Preview & Sync calls). Fine for Chris's free/private access in the meantime — not fine once real billing is live.
- [ ] Single app-owned MetalPriceAPI key (replace per-merchant BYO key field) — decided direction, not built. Removes L2 as a live concern too.
- [ ] Split local dev database from the Railway production Postgres — currently sharing one instance, fine pre-launch, not once there are real paying merchants.

## 🧩 Optional / nice-to-have (post-MVP, not blocking anything)

- [ ] Storefront rate ticker / price breakup theme extension.
- [ ] eBay/marketplace sync, POS sync (Chris asked for eBay specifically).
- [ ] Built for Shopify badge — needs 50+ net installs on paid plans, 5+ reviews, minimum rating, and general good standing first (can't chase this until there's real usage — see architecture.md for exact thresholds pulled from Shopify's docs).
- [ ] True 10k+ scale live-validated against a real seeded catalog (code path built and mocked-tested, not yet run against an actual huge real store).
- [ ] L1 (Float → Decimal money fields) — see Bugs section, same item, optional-but-should-do-eventually.

---

## 🚀 Launch / App Store submission TODOs

Fact-checked against live shopify.dev docs 2026-07-19 (not memory — this stuff changes). Full detail in architecture.md "App Store submission checklist" — this is the flat version to work through.

**Irreversible decision first:**
- [ ] Confirm current distribution status for `metalrate-sync` in the Dev Dashboard (should be undecided/unset still). **Do not select Custom for this app** if the plan is a public App Store listing later — that choice can never be undone. See "Getting the app to Chris" below for the actual access plan.

**Configuration:**
- [ ] App icon — 1200×1200px, JPEG or PNG.
- [ ] Emergency developer contact — email + phone number.
- [ ] Double-check all app URLs avoid "Shopify"/"Example" (Railway domain already clean).
- [x] Compliance webhooks (customers/data_request, customers/redact, shop/redact) — already built correctly.

**Listing content:**
- [ ] Confirm "MetalRate Sync" doesn't collide with an existing app name.
- [ ] 3+ screenshots, 1600×900, each a genuinely different feature/view, no desktop chrome, no near-duplicates (actively enforced since March 2026).
- [ ] Feature image (1600×900) or a 2-3 min *promotional* video — not the same as the Chris walkthrough Looms, which are instructional. A separate short promo cut is needed for the actual listing.
- [ ] Demo store URL — a clean dev store showing the app live (fixing the Snowboard test data does double duty here).
- [ ] Support email address (required) — recommend a domain-backed address once the domain's bought.
- [ ] Privacy policy URL — needs real hosting; this is the one place the domain purchase matters for submission itself, not just marketing.
- [ ] Pricing entered only in the designated Pricing Details section of the form.
- [ ] Sales-channel/geography install-eligibility flags set.
- [ ] Protected customer data — opt out (app needs no PII/customer scopes).

**Review prep:**
- [ ] Full setup screencast for the reviewer (broader than the Chris Looms — cover everything, not just highlights).
- [ ] Decide review path for the live-rate feature: either hand over working MetalPriceAPI test credentials, or make sure the built-in **mock** provider mode is enough for the reviewer to verify functionality (safer — no real key handed to Shopify).
- [ ] Run the Dev Dashboard's automated pre-submission checks, clear every flag.
- [ ] Zero web errors (404/500) and zero UI bugs anywhere reachable during review.

**Domain / SEO (see below for name ideas):**
- [ ] Buy domain (user doing this — browsing now).
- [ ] Build the marketing/pricing site on it (later, not urgent for Chris).
- [ ] Point the privacy policy + support page at it before drafting the App Store listing form.

---

## Getting the app to Chris — the actual plan

No App Store review needed for this. Two things happen in parallel, not sequentially:

1. **Chris access (do this soon):** create a second app in the Dev Dashboard (same codebase, new client_id), set **Custom distribution** on *that* one, generate its install link, send to Chris. Installs directly on his real live store, no review, no waiting. Keep the main `metalrate-sync` app's distribution unset so it stays eligible for a future Public App Store listing.
2. **Public launch track (do this over time):** work the "Launch / App Store submission TODOs" list above on the main app. Billing is the biggest gap. No rush — this runs independently of Chris.

Chris never needs to touch the App Store, review, or wait on anything — his path is entirely the Custom-distribution link once that second app exists.
