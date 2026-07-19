# Code audit #2 — 2026-07-19 (fresh pass, all 18 findings from the 2026-07-18 audit are fixed)

Second full audit, done after the first audit's fix pass shipped (commit `c9f497e`). Every service, route, webhook, config, and schema file re-read in its current post-fix state. Focus this round, per the project's stage: **quota-burn loopholes** (the class of bug H1 belonged to), **product-safety for real merchants** (App Store readiness), and **tenant isolation**. "Verified" means the mechanism was confirmed by reading the actual current code, not guessed.

The previous audit (2026-07-18, 4 HIGH / 7 MEDIUM / 8 LOW) is fully closed — summary in the appendix at the bottom. This file replaces it.

---

## Q. Quota-burn loopholes (the "preview & sync drains the limit" class)

These are the direct answer to "how can the app burn out the rate-API quota we provide." Today each merchant brings their own free key (~100 req/month), so the blast radius is per-merchant. **Once the app-owned shared key ships, every one of these becomes everyone's problem** — one merchant's behavior drains the key all merchants share.

### Q1. No single-flight lock on `getRates` — concurrent page loads each fire a provider call
[rates.server.ts](../metalrate-sync/app/services/rates.server.ts): when the cache is stale, every concurrent caller independently sees "stale" and independently calls the provider. Real triggers: Dashboard + Preview open in two tabs at TTL expiry; the scheduler tick landing while the merchant is browsing; even React Router re-running loaders. Each fires a full provider fetch and each upserts. 2–5x duplicate API calls at every single TTL boundary. Verified: there is no lock, no in-flight promise reuse, nothing.

### Q2. Every Settings save nukes the rate cache — even for unrelated changes
[app.settings.tsx](../metalrate-sync/app/routes/app.settings.tsx) `saveSettings` ends with an unconditional `metalRateCache.deleteMany({ where: { shop } })`. Toggling the schedule switch, changing the sync interval — anything — wipes the cache, so the next page load is a guaranteed live API call. Correct behavior only when provider/key/city/currency actually changed. Fix: compare before busting.

### Q3. Merchant-controlled `rateTtlMinutes` floor is 1 minute
Settings accepts any TTL ≥1 min (`Math.max(1, ...)`). A merchant who sets 1 and browses the dashboard burns ~60 calls/hour. Today: their own key, their own funeral (the free tier dies in <2 hours). Post-launch on the shared app key: one merchant's TTL setting drains the quota for every store. The TTL field must be removed from merchant UI (or plan-floored server-side) when the app-owned key ships — cache policy becomes the app's concern, not the merchant's.

### Q4. Scheduler tick launches every due shop simultaneously, unbounded
[scheduler.server.ts](../metalrate-sync/app/services/scheduler.server.ts) `tick()`: fire-and-forget loop, no concurrency cap. 50 shops due on the same minute = 50 concurrent syncs = 50 provider fetches + 50 sets of Shopify mutations + 50 DB write bursts at once. Also structurally wasteful: spot rates are global — 50 shops on the same currency need 1 fetch, not 50.

### Q5. The per-shop rate cache is the wrong shape for launch (architecture, not a bug)
`MetalRateCache` is keyed `shop+metal+currency` — the same global spot price is stored and fetched N times for N shops. This is the root reason Q1–Q4 sting. **The launch fix for the whole quota class, in one move:**

1. **App-owned paid key** (MetalPriceAPI Basic, $12/mo, 10k req) in an env var — merchants never see or enter a key.
2. **Global rate cache** keyed `(metal, currency, city)` — one row set shared by every shop.
3. **Server-controlled fetch cadence**: one background job refreshes the global cache on a fixed schedule (e.g. 2x/day base). Merchant-facing pages **only ever read the cache** — Dashboard, Preview, Apply never call the provider directly, so nothing a merchant does can trigger a live API call.
4. **"Refresh rates" button, plan-gated**: Starter = 2 on-demand refreshes/day, Pro = 5/day. This maps exactly to the $30/$50 tier design and becomes the visible plan difference.
5. Single-flight lock on whatever fetch path remains (fixes Q1 for good).

Cost math: 10 currency/city combos × 5 fetches/day ≈ 1,500 req/month against a 10k budget — headroom for hundreds of merchants. Q1–Q4 all stop mattering because merchants can no longer cause provider calls at all.

---

## P. Product-safety (things that hurt a real merchant, App Store blockers in spirit)

### P1. HIGH — Mock rates are the default provider on a fresh install, and nothing stops a real sync with them
`ShopSettings.rateProvider` defaults to `"mock"`. The dashboard shows a polite "Demo rates active" banner and the setup guide suggests switching — but **nothing blocks Preview → Apply or enabling the schedule while on demo rates**. A real merchant who skims setup can push fake-rate prices onto a live store with real customers. On a dev store this default is a feature; on the App Store it's a lawsuit-shaped footgun. Fix: hard-gate Apply and `scheduleEnabled` while provider is `mock` (a loud inline confirm at minimum; a hard block once the app-owned live key exists and there's no reason to ever sync demo rates). Keep the mock provider itself — it's exactly what the Shopify app reviewer needs to exercise the app without credentials.

### P2. MEDIUM-HIGH — Formula fields accept empty/NaN/negative numbers, and empty purity zeroes prices
[app.formulas.tsx](../metalrate-sync/app/routes/app.formulas.tsx) `save` action: every numeric field is `Number(form.get(...) ?? fallback)` with **no validation**. Concretely: an empty `purityFactor` string coerces to `0`, not the fallback (`?? 1` only fires on `null`, and an empty form field is `""`, not null). purity 0 → metal value 0 → the formula happily computes near-zero prices → Preview shows them → one hurried Apply later a store's gold chains cost $3.99. Negative and `NaN` inputs are also accepted (Postgres stores NaN floats fine); NaN flows to `toFixed(2)` → `"NaN"` → Shopify userError → failed rows. Fix: server-side clamp/validate every numeric field (purity 0<x≤1, non-negative charges, finite numbers), reject the save with a clear message otherwise.

### P3. LOW-MEDIUM — Apply payload is client-trusted; forged payloads can poison the audit trail
The H3 fix (correctly) applies exactly the rows/rates the client previewed — but the server never re-verifies that payload. Cross-shop damage is impossible (the admin token only reaches the merchant's own store, and DB writes are shop-scoped — verified). But a tampered client can: (a) write arbitrary `rateSnapshot` values into SyncRun history — forging the audit trail that is the product's trust feature; (b) fake `fetchedAt` to bypass the staleness check. Same trust domain as the merchant editing their own prices, so not urgent — but the clean fix is storing the preview server-side (keyed by a token returned to the client) and applying from that, so the client only ever sends "apply preview #X".

### P4. LOW-MEDIUM — `shop/redact` GDPR wipe misses `BulkCatalogJob`
[webhooks.compliance.tsx](../metalrate-sync/app/routes/webhooks.compliance.tsx) deletes syncRun/variantConfig/pricingFormula/manualRate/metalRateCache/shopSettings — but not `BulkCatalogJob`, which holds the shop domain and a Shopify operation ID. One line to add to the transaction. (Session rows are handled by the uninstall webhook, but adding them here too is free belt-and-suspenders.)

---

## S. Scale findings (the 10k-SKU pitch vs. the current code)

### S1. MEDIUM — Apply round-trips the entire preview through the browser
The H3 design POSTs all rows + rates back as JSON. At 10k tracked variants that's a multi-MB request body (and before that, a 10k-row `<s-table>` rendered with no pagination/virtualization — the preview page itself will crawl). Works fine at Chris-demo scale; will embarrass at the scale the marketing claims. Fix bundles nicely with P3: server-side preview storage means Apply sends a token, not megabytes, and the preview UI can paginate.

### S2. LOW — Bulk catalog JSONL is buffered fully in memory
[catalog.server.ts](../metalrate-sync/app/services/catalog.server.ts) `downloadAndParseJsonl` does `await response.text()` on the whole file. ~50k variants ≈ tens of MB — survivable on Railway's default memory, but a streaming line parser is the right shape eventually.

### S3. LOW — History run details silently cap at 500 items
[app.history.tsx](../metalrate-sync/app/routes/app.history.tsx) `take: 500` with no "showing 500 of N" indicator — a 10k-variant run's audit trail looks complete but isn't. Cheap fix: show the count, add pagination later.

---

## M. Misc / cosmetic

- **M-a.** Changing `baseCurrency` after entering manual rates silently relabels those values in the new currency without conversion (a ₹6,800/g manual gold rate becomes "$6,800/g"). Low, but a confused-merchant magnet.
- **M-b.** `lastPrice` on variant save comes from a client hidden field (`currentPrice`) rather than being re-read from Shopify — stale if the price changed in another tab. Cosmetic; next sync corrects it.

---

## What should be REMOVED or simplified before App Store handoff

The end-user product should be simpler than the dev build. Confirmed direction + new items from this audit:

| Item | Action | Why |
|---|---|---|
| **BYO API key field** | Remove (already decided) | App-owned key in env var; merchants never touch keys. Kills L2 from audit #1 too. |
| **Rate cache TTL field** | Remove from Settings | Cache policy becomes server-controlled (Q3/Q5). Merchant sees a "rates as of X" timestamp instead. |
| **Mock/demo provider as default** | Keep the provider, gate the danger (P1) | Reviewer + trials need it; real stores must not sync with it silently. |
| **India city picker** | Hide at launch | Needs a paid MetalPriceAPI city plan nobody has yet; re-add as a Pro perk when the app-owned key covers it. |
| **Manual provider** | **Keep** | Genuine feature (IBJA board-rate jewelers price off their own daily rate). One of the few real differentiators — don't simplify it away. |
| Settings page after all this | Provider (Live/Manual) · currency · schedule toggle + interval (plan-capped) | That's the whole page. Simple enough for the end user, nothing left to misconfigure. |

Plus the two structural pre-launch builds already tracked in [TODO.md](../TODO.md): **billing** (Shopify App Pricing — hard submission blocker) and **plan-limit enforcement** (SKU cap + sync-frequency cap, which Q5's design gives you nearly for free).

## What's genuinely solid (verified this pass, so this doesn't read as all doom)

- **Tenant isolation is clean.** Deliberately hunted for cross-shop holes: formula assignment validates ownership (`app.products.tsx` checks the formula belongs to the shop before saving), formula save/delete are `{id, shop}`-scoped, History lookups are `{shop, id}`-scoped, variant removal is shop-scoped, Apply can't reach other shops (token + scoped writes). Nothing found.
- **Migrations self-apply on deploy** — `docker-start` runs `prisma migrate deploy` before serve; no drift risk between code and schema on Railway.
- The audit #1 fixes all held up under re-read — no regressions spotted; the H1 merge logic and H3 snapshot path are correct as written.
- GDPR webhooks correct except the one missing table (P4); no customer data stored anywhere.
- No secrets in the repo (re-checked).

---

## Appendix — the 2026-07-18 audit (all closed)

First audit found 4 HIGH / 7 MEDIUM / 8 LOW; all were fixed in commit `c9f497e` (2026-07-19) except four deliberate deferrals documented in [architecture.md](../architecture.md) ("Code audit fix pass" section): L1 (Float→Decimal, its own future pass), L2 (BYO-key plaintext — dies with the BYO field), L7 (single-instance scheduler — documented constraint), L8 (preview-triggers-fetch — defanged by the H1 fix, fully dies with Q5). Closed items, for the record: H1 rate-cache freshness loop, H2 scheduler token refresh + circuit breaker, H3 preview/apply price drift, H4 SQLite-on-ephemeral-disk, M1 city-wipe on save, M2 history totals, M3 weight-unit trap, M4 search debounce, M5 import size/dupes, M6 uninstall scheduler grind, M7 CSV injection, L3 error-code matching, L4 dead removeVariant, L5 route-nesting rename, L6 dev-machine scheduler guard.
