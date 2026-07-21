# MetalRate Sync — TODO

Single source of truth for what's left. Cross-linked with [architecture.md](architecture.md) (full narrative/decisions) — this file is the flat checklist to work off of. Slash items as they're done, don't delete them (keep the record).

Last updated: 2026-07-19 (night — collapsed to a single launch path, no more separate Chris fast-track).

---

## 🐛 Bugs & loopholes — audit #2 (2026-07-19) — FIXED same day

Fresh audit pass after all audit-#1 fixes shipped. Full detail per finding in [research/code-audit-2026-07-19.md](research/code-audit-2026-07-19.md). Fix pass verified with an 8-assertion snapshot round-trip test against the real DB; typecheck + build clean.

**Quota-burn class (the "preview & sync drains the limit" question):**
- [x] Q1 — single-flight lock added to `getRates`: concurrent page loads now share one in-flight provider call
- [x] Q2 — Settings save only busts the rate cache when provider/key/city/currency actually changed
- [x] Q3 — rate TTL floor raised 1 → 15 minutes (server-side clamp + UI min)
- [x] Q4 — scheduler tick capped at 3 concurrent shop syncs; overflow shops picked up next tick
- [x] Q6 (found 2026-07-19, after Q5 shipped) — `scheduleInterval` was still a free-form merchant field (min 15) even after Q3 locked the rate TTL — nothing stopped a merchant setting automatic syncs to every 15 minutes (96 real Apply cycles/day against their own Shopify Admin API, and later a way to bypass the "2x/day Starter, 5x/day Pro" plan design by self-selecting unlimited). **Fixed**: removed the field entirely, sync frequency is now server-controlled (`SCHEDULE_INTERVAL_MINUTES` env var, default 720 = every 12h), Settings shows it as read-only text.
- [x] Q5 — **shipped 2026-07-19 (evening)**: app-owned key (`METALPRICEAPI_KEY` env var — only the operator can change it, on Railway's dashboard), **global rate cache** keyed (metal, currency, city) shared by all shops, server-controlled TTL (`RATE_TTL_MINUTES` env var, default 480, floor 15 — merchants can't touch it), single-flight per (currency, city). BYO key field + TTL field removed from Settings; `rateApiKey`/`rateTtlMinutes` columns dropped (migration `20260719150000`). No merchant action can trigger provider API calls beyond one fetch per TTL per (currency, city) — the quota class is structurally dead. Remaining piece for later: plan-gated manual refresh counts (needs billing/plans to exist first).

**Product-safety:**
- [x] P1 — demo rates now loudly gated: warning banner on Preview, two-click "Really apply DEMO prices?" confirm on Apply, warning banner when scheduling is on with mock provider. (Hard block deferred to launch when the app-owned live key exists — mock stays the dev/reviewer path for now.)
- [x] P2 — full server-side numeric validation on formula save (empty purity no longer coerces to 0 and zeroes prices; NaN/negative rejected with clear messages) + weight input validation on product save
- [x] P3 — Apply no longer trusts the client: preview stored server-side (`PreviewSnapshot` table, new migration), Apply sends just a snapshot id, staleness checked against server-stored timestamps, snapshot deleted after apply (double-apply becomes a clean error)
- [x] P4 — `shop/redact` now also wipes `PreviewSnapshot`, `BulkCatalogJob`, and `Session` rows

**Scale (10k-SKU pitch):**
- [x] S1 (payload half) — Apply request is now a few bytes regardless of catalog size (same fix as P3)
- [x] S1 (UI half) — preview table shows first 250 rows + "Show all N" button; Apply always covers everything (works off the server snapshot, not the visible rows)
- [x] S2 — bulk catalog JSONL now parsed as a stream instead of buffering the whole file in memory
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

- [ ] **Billing via Shopify App Pricing.** Hard blocker — apps using off-platform billing can't be submitted to the App Store at all. **Confirmed 2026-07-19 (full page scrape of shopify.dev, not memory): this is Partner Dashboard UI only — no `shopify.app.toml` field, no CLI command, nothing code-side.** Pricing decided: $30/mo Starter (800 SKU, 2x/day sync) / $50/mo Pro (unlimited, 5x/day, priority support), 14-day trial, no permanent free tier. **For now everything is free everywhere (2026-07-19 decision) — billing comes with the App Store submission push.**

  **Exact click path (partners.shopify.com — the docs still say "Partner Dashboard" even though Dev Dashboard is primary elsewhere; if your login lands you on dev.shopify.com instead, the Distribution/Pricing screens are the same, just follow whatever the login redirects to):**

  1. Distribution first, irreversible: Partner Dashboard → **App distribution** → select `metalrate-sync` → **Choose distribution** → **Public distribution** → **Select**.
  2. Apps → All Apps → click `metalrate-sync` → **Distribution** → beside "Shopify App Store listing" click **Manage listing** → **Published languages** → **Edit** (your locale) → **Pricing content** → **Manage** (opens the Pricing index page).
  3. If not already on it: click **Settings** → select **Shopify App Pricing** → confirm **Switch**. (New apps get this as the default, so this step may already be done.)
  4. **Add the Starter plan**: under Public plans, click **Add** → Billing: Monthly → Monthly charge: `30` → Free trial duration: `14` → Welcome link: `/app` (relative path — MetalRate Sync has an App Home landing page) → **Save**. Back on the Pricing index page, find the plan → Display name: `Starter` → Top features: list the 800-SKU/2x-day-sync/audit-trail points from the site copy → **Save**.
  5. **Add the Pro plan**: same flow, Monthly charge `50`, trial `14`, Display name `Pro`, features: unlimited SKU/5x-day/priority support. India city rates is a baseline feature on both tiers, not Pro-exclusive — don't list it as a Pro differentiator.
  6. **Testing, no extra setup needed**: Shopify auto-provisions a **$0 private test plan** under Private plans — use it (or any dev store) to test the full billing flow before publishing, never gets charged.
  7. **Chris's private plan comes later, after approval** — same Private plans section, up to 20 authorized store domains per plan. Doesn't skip App Store review (a Public-track app still can't be installed by an external store pre-approval, confirmed earlier) — it's the free-for-life plan he lands on once he installs post-launch, matching the "Path to launch" step 7 below.

  Sources: [shopify.dev/docs/apps/launch/billing/shopify-app-pricing](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing), [.../shopify-app-pricing/plans](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing/plans), [.../distribution/select-distribution-method](https://shopify.dev/docs/apps/launch/distribution/select-distribution-method).
- [ ] **Plan-limit enforcement in code.** SKU-count cap + manual-Preview&Sync-frequency cap per plan. Provider-quota risk is dead (Q5) and schedule-interval abuse is dead (Q6, everyone gets the same server-fixed interval for now) — what's left is purely tier differentiation once real plans exist: right now every shop effectively gets the Pro-tier behavior for free. Build together with billing.

**"How is Preview & Sync frequency limited right now?" — direct answer:** manual Preview & Sync can still be *clicked* unlimited times by a merchant — that's unchanged. What changed is what clicking it costs: since Q5, repeated previews only ever hit the global rate cache (at most one live MetalPriceAPI call per TTL, system-wide, no matter how many merchants or clicks) — the vendor-quota risk this question originally worried about is gone. What's NOT rate-limited: each Preview/Apply still calls Shopify's own Admin API (catalog fetch, price mutations) — that's Shopify's rate limit to enforce, not ours, and the app already retries/backs off on throttling. A plan-based cap on manual-refresh *count* (2/day Starter, 5/day Pro, per the pricing design) is the one piece still not built — tracked above, needs billing first.
- [x] ~~Single app-owned MetalPriceAPI key~~ — **shipped 2026-07-19**: `METALPRICEAPI_KEY` env var, BYO field removed, key columns dropped. **User action required: add the premium key as `METALPRICEAPI_KEY` on Railway's dashboard (Variables tab) and in the local `.env`** — until then the Live provider shows a clear "not configured" message and Manual/Demo still work. Only you can change the key, from Railway. L2 fully dead.
- [ ] Split local dev database from the Railway production Postgres — currently sharing one instance, fine pre-launch, not once there are real paying merchants.

## 🧩 Optional / nice-to-have (post-MVP, not blocking anything)

- [ ] Storefront rate ticker / price breakup theme extension.
- [ ] eBay/marketplace sync, POS sync (Chris asked for eBay specifically).
- [ ] Built for Shopify badge — needs 50+ net installs on paid plans, 5+ reviews, minimum rating, and general good standing first (can't chase this until there's real usage — see architecture.md for exact thresholds pulled from Shopify's docs).
- [ ] True 10k+ scale live-validated against a real seeded catalog (code path built and mocked-tested, not yet run against an actual huge real store).
- [ ] L1 (Float → Decimal money fields) — see Bugs section, same item, optional-but-should-do-eventually.

---

## 🚀 Path to launch — ONE track now (2026-07-19, simplified)

**Decision reversed from earlier the same day:** dropped the "second app + Custom distribution to fast-track Chris" plan entirely — too much overhead for what it bought. There is no platform shortcut that gets any external merchant, including Chris, into a Public-track app before it clears review — that's a Shopify rule, not something worth engineering around. So: **one app, one path, straight to real submission.** `metalrate-sync`'s distribution gets set to **Public** (not Custom) — do this as the first irreversible step, since it locks the app onto the App Store track for good, which is what's actually wanted now.

**Chris's access is simply: he installs like any merchant, once this is live.** Real 14-day trial via the normal App Store flow, no waiting on a separate app or Railway service. Afterward, hand him a **private plan** (Dev Dashboard → Pricing → add a private plan, up to 15 allowed per app) so he's free-for-life as design partner #1 — zero extra infrastructure, no billing code needed since nothing charges yet anyway. He gets full unrestricted access automatically today because there are no plan gates in the code (by design, see "Required builds" above) — that's not a workaround, that's just the current state.

Fact-checked against live shopify.dev docs 2026-07-19 (not memory — this stuff changes). Full detail in architecture.md "App Store submission checklist" — below is the flat version to work through, in order.

**1. Distribution (do first, irreversible):**
- [x] Partner Dashboard → `metalrate-sync` → Distribution → **Public distribution** — **done 2026-07-20**. Also registered the Partner account for App Store access ($19 one-time fee, Individual, no other associated accounts). This app is now locked onto the Public/App Store track — no second app needed.

**2. Configuration:**
- [x] App icon — 1200×1200px set in the Dev Dashboard (done 2026-07-19).
- [ ] Emergency developer contact — email + phone number.
- [ ] Double-check all app URLs avoid "Shopify"/"Example" (Railway domain already clean).
- [x] Compliance webhooks (customers/data_request, customers/redact, shop/redact) — already built correctly.

**3. Billing + plan limits** (already tracked above under "Required builds" — the hard blocker, do this before the listing content below is worth finishing).

**4. Listing content:**
- [x] Confirm "MetalRate Sync" doesn't collide with an existing app name — **verified clear via web search 2026-07-19**: no app by that name; closest are "Metal Updater" and two unrelated "GoldSync" apps. Note: MetalpriceAPI (the rate vendor) ships its own competing Shopify app — no naming conflict, just competitive awareness.
- [x] **App renamed to "Ounce: MetalRate Sync" — 2026-07-20**, per Shopify's own AI listing-review flag: app names can't be a pure functional descriptor, must lead with a distinctive brand word ("QTeck - Announcement Bar" not "Announcement Bar - QTeck"). "MetalRate Sync" alone is just metal+rate+sync — no brand. Picked "Ounce" (troy-ounce reference, checked clear on the App Store via web search). Only the formal listing/TOML name changed — domain (metalratesync.com), logo, and marketing-site copy all stay "MetalRate Sync" as the product's common name. `shopify.app.toml`'s `name` field updated and deployed live (`shopify app deploy`, version `ounce-metalrate-sync-4`).
- [x] 5 screenshots, exact 1600×900 — cropped from real captures (right-side empty admin whitespace trimmed, nothing meaningful lost): `asset/listing-screenshots/shot-{dashboard,formulas,import,history,settings}.png`.
- [x] Feature media — **fixed 2026-07-20** after Shopify's own AI listing review flagged the original pedestal illustration as "not informative... only includes a logo, icon, or illustration." Swapped to `asset/listing-screenshots/shot-dashboard.png` (real UI, live rates + last sync). The pedestal render stays on the marketing site hero instead, where illustration is fine.
- [ ] Demo store URL — a clean dev store showing the app live (fixing the Snowboard test data does double duty here).
- [x] Support email address → `metalratesync@gmail.com` (decided 2026-07-19, same address used everywhere).
- [x] Privacy policy URL → `https://metalratesync.com/privacy`, live.
- [ ] Pricing entered only in the designated Pricing Details section of the form.
- [x] Sales-channel requirements → "My app doesn't require the Shopify Online Store or Shopify POS."
- [x] Protected customer data → opted out via "My app won't use customer data" + Request.

**5. Review prep:**
- [ ] Full setup screencast for the reviewer (broader than the Chris Looms — cover everything, not just highlights).
- [ ] Decide review path for the live-rate feature: either hand over working MetalPriceAPI test credentials, or make sure the built-in **mock** provider mode is enough for the reviewer to verify functionality (safer — no real key handed to Shopify).
- [x] Run the Dev Dashboard's automated pre-submission checks, clear every flag — **AI self-review done 2026-07-20**: [research/app-store-self-review-2026-07-20.md](research/app-store-self-review-2026-07-20.md). 28 passing, 0 failing, only the 3 billing items flagged as "in progress" (correctly — plans aren't created yet). Still need to click **Run** on the live "Automated checks for common errors" in the Partner Dashboard itself (a separate, Shopify-side check I can't trigger remotely) once the primary listing language is chosen.
- [ ] Zero web errors (404/500) and zero UI bugs anywhere reachable during review.

**6. Submit for review.**

**7. Once approved:** Chris (and anyone else) installs via the normal App Store trial. Give Chris a private free plan right after (Dev Dashboard → Pricing) — done, no further steps.

**Domain / SEO:**
- [x] Domain chosen: **metalratesync.com** (purchased 2026-07-19).
- [x] Marketing site built (2026-07-19 night) — Next.js in [website/](website/), dark premium design matching brand assets: hero with feature render, 4-metal ticker signature, trust pillars, 6 features, 5 real app screenshots, $30/$50 pricing, dealer FAQ, contact (metalratesync@gmail.com), /privacy + /terms, full SEO (per-route metadata + canonicals, OG/Twitter cards, SoftwareApplication JSON-LD, sitemap.xml, robots.txt). Static build clean, visually verified in browser.
- [ ] **Deploy to Vercel + connect domain (needs your Vercel login, ~10 min):** vercel.com → New Project → import the GitHub repo → set Root Directory to `website` → Deploy → Project Settings → Domains → add metalratesync.com (Vercel shows the exact DNS records to add at your registrar).
- [ ] Privacy policy URL for the App Store form = `https://metalratesync.com/privacy` once deployed — page content already written and live in the site.

**Credential hygiene (do before real merchants, not urgent today):**
- [ ] Rotate all four credentials exposed in chat/screenshots during setup: MetalPriceAPI key, `SHOPIFY_API_SECRET`, the Railway Postgres password (visible in a 2026-07-19 dashboard screenshot), and treat `SHOPIFY_API_KEY` as public (it is by design). Rotate → update Railway variables + local `.env` → redeploy.

**Deploy-workflow note (bit us 2026-07-19):** the Railway service deploys via `railway up` (CLI upload), NOT from GitHub — pushing to GitHub does nothing to production, and Railway's "Redeploy" button just restarts the old image. Either run `railway up` after every change that should ship, or (better) connect the service to the GitHub repo in Railway → Settings → Source so pushes auto-deploy.

---

## Chris — no separate plan needed anymore

Superseded 2026-07-19: no more second app, no second Railway service, no Custom distribution. Chris installs the one real app once it's Public and live, same flow as any merchant, then gets a private free plan. See "Path to launch" above — his access is just step 7 of that single list.
