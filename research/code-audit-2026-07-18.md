# Code audit — 2026-07-18 (report only, nothing fixed yet)

Full pass over every service, route, webhook, config, and schema file. Findings ranked by severity. "Verified" means I reproduced or confirmed the mechanism, not guessed.

## HIGH

### H1. Rate-cache freshness loop can silently burn the whole API quota
[rates.server.ts](../metalrate-sync/app/services/rates.server.ts) `getRates`: cache counts as fresh only if `cached.length >= 4` (all metals) AND all rows fresh. If the provider ever returns fewer than 4 rates — a city symbol missing from a response, a partial API outage, palladium temporarily absent — only the returned rows get cached, the count check fails forever, and **every page load refetches from the API**. On the free tier (100 req/month) that's the whole quota gone in a day; on paid it's silent hammering. The failure is invisible: the app looks like it works. Verified by reading the flatMap-skip + upsert + length-check interaction.

### H2. Scheduler will likely fail whenever the app sits idle (expired offline tokens)
[shopify.server.ts](../metalrate-sync/app/shopify.server.ts) sets `expiringOfflineAccessTokens: true` — offline tokens expire (verified live: the dev store's token is expired in the DB right now; it only refreshes when a browser request runs `authenticate.admin`). The scheduler calls `unauthenticated.admin(shop)` in the background with nobody browsing. Whether that path auto-refreshes via the stored refresh token is **unverified** — if it doesn't, every scheduled sync fails once a shop has been idle past token lifetime, which is precisely when a scheduler matters. Must be tested before production (enable schedule, wait for token expiry with the app closed, watch whether the scheduled run succeeds).

### H3. Merchant approves prices X, store can get prices Y
[app.sync.tsx](../metalrate-sync/app/routes/app.sync.tsx) Apply action calls `executeSync`, which **recomputes everything at click time**. If the rate cache expired between rendering the preview and clicking Apply (or the rate moved), the applied prices differ from the approved ones — no snapshot is handed from preview to apply, no drift warning. In a product whose entire pitch is "you approve before anything changes," this is the single most brand-damaging latent bug. (History does record what was actually applied, which is how you'd even notice.)

### H4. Deployment blocker: hardcoded SQLite path + ephemeral filesystem
[schema.prisma](../metalrate-sync/prisma/schema.prisma) datasource is `url = "file:dev.sqlite"` — not `env("DATABASE_URL")`. On Railway (or any container host) without a mounted volume and an env-based path, **the entire database (sessions, formulas, configs, history) is erased on every deploy/restart**. Not a code bug locally; a guaranteed data-loss event in production. Fix belongs to the deploy task: env-based URL + Railway volume (or Postgres).

## MEDIUM

### M1. Saving Settings on the wrong provider silently wipes the city choice
[app.settings.tsx](../metalrate-sync/app/routes/app.settings.tsx): the city `<select>` only renders when provider = MetalPriceAPI. Saving while on Manual/Demo submits no `rateCity` field → action parses `""` → stores `null`. Switch to Manual, save, switch back: city selection gone with no warning.

### M2. History run totals don't add up
[sync.server.ts](../metalrate-sync/app/services/sync.server.ts) `executeSync`: `skippedCount` counts only stop_loss + no_change rows, but missing_data rows are written as `skipped_missing_data` items without being counted in any run-level number → `updated + skipped + failed < totalItems` whenever variants lack data. Cosmetic, but it's the audit-trail feature — numbers that don't reconcile undermine the exact trust it exists to build.

### M3. Weight-unit input trap can 11.66x a price
[app.products.tsx](../metalrate-sync/app/routes/app.products.tsx): the weight field always displays the stored value **in grams**, while the unit dropdown is user-set. Select Tola, glance at the prefilled gram number, hit Save → that number is now interpreted as tola (×11.66). The helper text warns; nothing enforces. A merchant in a hurry will do this eventually and sync a wildly wrong price.

### M4. Product search hammers the Admin API
[app.products.tsx](../metalrate-sync/app/routes/app.products.tsx): `onChange` on the search field writes search params → full loader re-run → a Shopify GraphQL products query per change event. No debounce. Depending on how `s-search-field` emits change events, typing can fire many queries; costs Admin API rate budget and feels laggy on slow stores.

### M5. Bulk import: unbounded file read + duplicate-row distortion
[app.products_.import.tsx](../metalrate-sync/app/routes/app.products_.import.tsx) / [import.server.ts](../metalrate-sync/app/services/import.server.ts): `file.text()` loads the whole upload into memory with no size or row cap — a huge file can OOM the server. Separately, duplicate SKU rows each upsert (last one wins) and each increments `updated`, so the summary over-reports; and if a CSV has two weight columns (`weight_grams` + `weight_tola`), the first match silently wins.

### M6. Uninstall leaves the scheduler grinding for 48 hours
`webhooks.app.uninstalled` deletes sessions only. `ShopSettings.scheduleEnabled` stays true, so the scheduler attempts that shop every minute, throws (no session), logs, repeats — until the `shop/redact` webhook (~48h later) wipes settings. No corruption, just noise, wasted cycles, and misleading error logs.

### M7. CSV export has no formula-injection guard
[csv.server.ts](../metalrate-sync/app/services/csv.server.ts) `toCsv` escapes quotes/commas/newlines but not leading `=`, `+`, `-`, `@`. A product title like `=HYPERLINK(...)` executes as a formula when the merchant opens their own export in Excel. Standard hardening: prefix-quote cells starting with those characters.

## LOW

- **L1. Money as Float.** Prices/weights stored as SQLite floats via Prisma `Float`. Compute-side rounding contains it today; migrate to `Decimal` columns when moving to Postgres, before anyone hits accumulating cent drift.
- **L2. API key in URL + plaintext at rest.** MetalPriceAPI requires key as a query param (their design) — keys can land in host/proxy logs; key also stored unencrypted in ShopSettings. Acceptable for dev; the planned single-app-owned-key model should live in an env var instead.
- **L3. Brittle duplicate-name detection.** [app.formulas.tsx](../metalrate-sync/app/routes/app.formulas.tsx) matches `error.message.includes("Unique constraint")` — Prisma message text isn't a stable API. Use `error.code === "P2002"`.
- **L4. Dead code.** `removeVariant` action in app.products.tsx has no UI trigger anywhere.
- **L5. Route-nesting landmine still armed.** `app.products.export-csv.tsx` keeps the dotted (nested) name — works *only because* it's a resource route. Anyone adding a component to it, or adding another dotted route under products, reproduces the invisible bulk-import bug. Rename to the `products_` convention for consistency.
- **L6. Dev-machine scheduler.** `npm run dev` starts the real scheduler on the laptop — if scheduling is enabled, dev machines fire real syncs and real API calls in the background while coding. Guarded per-process, not per-environment.
- **L7. Scheduler is single-instance only.** Two Railway replicas = double syncs. Fine now; documented constraint, becomes real if scaling horizontally.
- **L8. Preview page loader itself triggers rate fetches** — visiting Preview & Sync when cache is cold costs an API call even if the merchant applies nothing. By design, but interacts badly with H1.

## What's genuinely solid (so this doesn't read as all doom)
Route↔layout structure verified clean after the two nav bugs; GraphQL validated against live schema; sync executor's batch/retry/partial-failure accounting is careful; GDPR webhooks correct (no customer data stored, shop/redact wipes everything); no secrets in the repo (checked again this audit); typecheck and production build clean.
