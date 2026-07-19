# MetalRate Sync — TODO

Single source of truth for what's left. Cross-linked with [architecture.md](architecture.md) (full narrative/decisions) — this file is the flat checklist to work off of. Slash items as they're done, don't delete them (keep the record).

Last updated: 2026-07-19 (evening — audit #2 findings added).

---

## 🐛 Bugs & loopholes — audit #2 (2026-07-19) — FIXED same day

Fresh audit pass after all audit-#1 fixes shipped. Full detail per finding in [research/code-audit-2026-07-19.md](research/code-audit-2026-07-19.md). Fix pass verified with an 8-assertion snapshot round-trip test against the real DB; typecheck + build clean.

**Quota-burn class (the "preview & sync drains the limit" question):**
- [x] Q1 — single-flight lock added to `getRates`: concurrent page loads now share one in-flight provider call
- [x] Q2 — Settings save only busts the rate cache when provider/key/city/currency actually changed
- [x] Q3 — rate TTL floor raised 1 → 15 minutes (server-side clamp + UI min)
- [x] Q4 — scheduler tick capped at 3 concurrent shop syncs; overflow shops picked up next tick
- [ ] Q5 — **structural launch fix, deliberately deferred with the App Store prep** (bundles with removing the BYO key field, which stays for now per decision 2026-07-19): app-owned key + global rate cache + server-controlled fetch cadence + plan-gated manual refresh (2/day Starter, 5/day Pro). Kills the quota class permanently and IS the plan-limit mechanism.

**Product-safety:**
- [x] P1 — demo rates now loudly gated: warning banner on Preview, two-click "Really apply DEMO prices?" confirm on Apply, warning banner when scheduling is on with mock provider. (Hard block deferred to launch when the app-owned live key exists — mock stays the dev/reviewer path for now.)
- [x] P2 — full server-side numeric validation on formula save (empty purity no longer coerces to 0 and zeroes prices; NaN/negative rejected with clear messages) + weight input validation on product save
- [x] P3 — Apply no longer trusts the client: preview stored server-side (`PreviewSnapshot` table, new migration), Apply sends just a snapshot id, staleness checked against server-stored timestamps, snapshot deleted after apply (double-apply becomes a clean error)
- [x] P4 — `shop/redact` now also wipes `PreviewSnapshot`, `BulkCatalogJob`, and `Session` rows

**Scale (10k-SKU pitch):**
- [x] S1 (payload half) — Apply request is now a few bytes regardless of catalog size (same fix as P3)
- [ ] S1 (UI half) — preview table still renders all rows unpaginated; virtualize/paginate before the 10k live validation
- [ ] S2 — bulk catalog JSONL fully buffered in memory (fine to ~50k variants, streaming later)
- [x] S3 — History details now show "first 500 of N" when a run exceeds the cap

**Cosmetic:**
- [x] M-a — manual rates now tagged with entry currency; base-currency change surfaces a clear "re-enter rates" error instead of silently relabeling
- [ ] M-b — `lastPrice` from client hidden field, can be stale — accepted (next sync corrects it, fix needs an extra Admin API call per save)

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

## Getting the app to Chris — detailed steps

No App Store review needed for this. Two tracks in parallel: Chris gets a **Custom-distribution second app** now; the main `metalrate-sync` app stays distribution-unset for the future public listing (that choice is irreversible — never set the main app to Custom).

**Step-by-step (needs your Dev Dashboard login, ~15 min):**

1. **Create the second app.** Dev Dashboard ([dev.shopify.com/dashboard](https://dev.shopify.com/dashboard)) → Apps → Create app. Name it something like `MetalRate Sync (Liquid Bullion)`. This gives you a new client_id + client secret — same codebase will serve it.
2. **Point it at the same Railway deployment.** In the new app's configuration set:
   - App URL: `https://metalrate-sync-app-production.up.railway.app`
   - Redirect URL: `https://metalrate-sync-app-production.up.railway.app/auth/callback`
   - Scopes: `write_products`
   - Webhooks: same three subscriptions as the main app (app/uninstalled, app/scopes_update, compliance trio) — mirror what's in `shopify.app.toml`.
   ⚠️ **One Railway service can only hold one SHOPIFY_API_KEY/SECRET pair.** Easiest correct setup: deploy a **second Railway service** from the same repo (Railway → New Service → same GitHub repo), give it the new app's API key + secret + same DATABASE_URL + SHOPIFY_APP_URL pointing at its own generated domain, and use THAT domain in step 2's URLs instead. ~5 extra minutes, zero code changes. (Alternative — swapping the main service's env vars to the new app — breaks your dev-store install; don't.)
   - The `SHOPIFY_API_SECRET` for the new app: enter it directly in Railway's dashboard yourself, same as before. I never touch it.
3. **Set distribution.** New app → Distribution → Choose **Custom distribution**. Enter Chris's store domain (`liquidgoldnuggets.myshopify.com` — confirm the exact .myshopify.com domain with him first; the public domain is liquidgoldnuggets.com but the field wants the myshopify one). Leave "Allow multi-store installs" unchecked.
4. **Generate the install link** (button right there after entering the domain). Copy it.
5. **Email the link to Chris** with one line of instructions: "open this while logged into your Shopify admin, click Install." No review, no waiting — it installs immediately on his real store.
6. **After he installs:** his shop row appears in the shared Postgres. He starts on demo rates (safe — the P1 gate now makes applying demo prices require an explicit double-confirm). Walk him via email through Settings → provider. His own MetalPriceAPI free key or Manual entry both work today.

**Before sending the link (small but real):**
- [ ] Redeploy Railway so the audit-2 fixes (including the demo-rate safety gate) are live before a real store touches it.
- [ ] Confirm with Chris his exact `.myshopify.com` domain.

**Public launch track (runs independently):** the "Launch / App Store submission TODOs" above, on the main app. Billing is the biggest gap. Q5 (app-owned key + global cache) lands with that work.
