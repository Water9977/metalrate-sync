# MetalRate Sync — TODO

Single source of truth for what's left. Cross-linked with [architecture.md](architecture.md) (full narrative/decisions) — this file is the flat checklist to work off of. Slash items as they're done, don't delete them (keep the record).

Last updated: 2026-07-24 — **app submitted, now under Shopify review.** (Previous pass same day: bug fixes deployed + verified live, stale items reconciled, Prisma-upgrade item logged.)

---

## 🐛 Bugs — found 2026-07-24 on the live dev store, FIXED same day

- [x] **B1 — History "Details" appeared to do nothing. Actually fixed this time, deployed and verified live.** Root cause was two layers: (1) the run-details section rendered *below* the Runs table, so on a run list long enough to fill the screen it was there but off-screen; (2) even after reordering it above the table, React Router doesn't reset scroll position on a same-route search-param navigation, so clicking Details partway down a long list still left the viewport looking at the wrong part of the page. Fixed both in [app.history.tsx](metalrate-sync/app/routes/app.history.tsx): reordered the details section above Runs, added `scrollIntoView` on open, added a "← Back to all runs" control (there was no way to dismiss it before), and an explicit "Run not found" banner for a bad run id (defensive, was previously silent). **First redeploy attempt (2026-07-24) missed this fix entirely** — confirmed live via curl that the old placeholder text was still being served, meaning the redeploy that ran had happened *before* this commit was pushed. Redeployed again for real (`railway up`), confirmed live via curl (placeholder gone, real copy showing). Note: a run where every row was `no_change` will correctly show an *empty* details table — no_change rows never get a `SyncRunItem` row, so there's nothing to display for that specific run. That's expected, not a bug. **Still needs your click-through to fully confirm** — I can't test the embedded admin UI myself.
- [x] **B2 — verified already safe, no code change needed.** `isChangeBelowThreshold` floors the comparison at `Math.max(0.005, minChangeAmount)`, so an exact 0.00% diff is always classified `no_change` regardless of the formula's threshold setting (even 0). Proved with a real script: pure-math check on the exact value from the user's screenshot (139178.99 → 139178.99), a float-noise case, and an end-to-end `applyPreviewedRows` call with a `no_change` row confirming **zero** `admin.graphql` calls happen and `updatedCount` stays 0. The Apply button is also independently disabled client-side (`app.sync.tsx`) when there's nothing actionable. Two independent layers, both confirmed — not a live bug.
- [x] **B3 — leftover template placeholder on the public root route, fixed and confirmed live.** `app/routes/_index/route.tsx` (the bare, non-embedded landing page a reviewer or a merchant typing the raw Railway URL directly would hit) still had the untouched Shopify template copy ("A short heading about [your app]", "Product feature. Some detail...", etc). Replaced with real MetalRate Sync copy (heading, tagline, 3 real feature bullets) — kept the functional shop-domain login form as-is, that part was never placeholder. Confirmed live via curl 2026-07-24 (placeholder string gone, real copy present).

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
- [ ] M-b — `lastPrice` from client hidden field, can be stale — **re-checked 2026-07-24, still accurate, no regression.** Grepped `app.products.tsx`: `lastPrice` is still set straight from `form.get("currentPrice")` on both the update and create branches. Still deliberately deferred — next sync self-corrects it, and fixing it properly means an extra Admin API round-trip on every single variant save just to read back the live Shopify price first. Not worth the cost for a value that's cosmetic (display only) and self-heals.
- [ ] **Prisma major version available (found 2026-07-24 in Railway deploy logs): 6.19.3 → 7.9.0.** Not urgent, not broken — the running app works fine on 6.19.3, this is just Prisma's own update nag printed to the deploy log every boot. Deliberately **not** doing this now: a major-version bump this close to App Store submission is exactly the kind of unforced-error risk to avoid (breaking changes are likely, see [pris.ly/d/major-version-upgrade](https://pris.ly/d/major-version-upgrade)). Do as its own dedicated pass — same treatment as L1 — after submission, not during review prep.

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
- [x] L2 — rate-provider API key in URL/plaintext — **resolved by the Q5 architecture (shipped 2026-07-19)**: this was about the old per-merchant BYO-key model; that field no longer exists. The one remaining key (`METALPRICEAPI_KEY`) lives only in a server-side env var, and the URL it's embedded in is only ever constructed inside a server-to-server `fetch` call — never sent to or visible from the browser, never logged with a specific merchant attached to it. The exact resolution this item's own note predicted.
- [ ] L7 — scheduler is single-instance only — fine at current scale, revisit only if Railway scales to multiple replicas
- [x] L8 — Preview loader triggers rate fetches — resolved in practice by the H1 fix, no action needed (checkbox was just never flipped — the note already said this was done)

---

## ✅ Billing, plan enforcement & rate limiting — CODE DONE (2026-07-22)

Full build per explicit instruction ("no loophole and bugs which lets end user misuse anything at all"). Full narrative in architecture.md "Billing, plan enforcement & rate limiting". Flat summary:

- [x] Plan detection off Admin GraphQL (`currentAppInstallation.activeSubscriptions`) — no Partner API, no new credentials. [billing.server.ts](metalrate-sync/app/services/billing.server.ts).
- [x] Loader-side gate on `app.tsx` — no active plan redirects to Shopify's hosted plan-selection page (iframe-safe).
- [x] Action-side gate (defense in depth) on every mutating route: formulas, settings, products, sync, bulk import. A `fetcher.submit` to an already-mounted page doesn't rerun the loader, so this is the real security boundary, not just the loader redirect.
- [x] SKU cap enforced: 800 for Starter, unlimited for Pro. Both the single-variant save and bulk CSV import paths enforce it (import reports which SKUs matched but weren't turned on due to the cap).
- [x] Auto-sync frequency is plan-derived, not merchant-settable: Starter 720min (2x/day), Pro 288min (5x/day). Scheduler re-derives the live interval every tick and immediately disables scheduling if a shop's subscription lapses (not just after the 5-failure circuit breaker — a lapsed sub isn't a transient error).
- [x] Settings UI shows real plan tier, SKU usage, and an upgrade link.
- [x] Verified end-to-end with a mocked-admin script against the real DB (isolated shop key, cleaned up after) — tier parsing, redirect targeting, action gate shapes, and the exact SKU-cap boundary (799 seeded + 3 new → exactly 1 enables, 2 correctly capped). All passed.
- [x] Manual Preview & Sync deliberately left **unlimited** — confirmed decision, it's been cache-only since Q5 and can't drain the rate-provider quota, so a refresh-count cap would add friction with no real protection.

**What's NOT done — Dashboard-only, can't be scripted:**
- [x] ~~Create the Starter ($30) and Pro ($50) plans in the Dev Dashboard~~ — **turned out to already be done**, predates this build. Confirmed 2026-07-22: after fixing the redeploy gotcha below, opening the dev store showed Shopify's real hosted "Select a plan" screen with both Starter and Pro correctly configured (right price, right trial, right feature bullets, "$0/30 days — free to test on this store"). Proves the redirect in [billing.server.ts](metalrate-sync/app/services/billing.server.ts) targets the right place and Shopify's plan data renders correctly — real screenshot, not a mock.
- [x] Click "Test with this plan" once to confirm the return-to-app loop after actually picking a plan — **confirmed done and working by user 2026-07-24.** Full billing flow (redirect-out AND redirect-back-in) is now proven live end to end, not just via mocks.

**Redeploy gotcha hit again 2026-07-22**: billing code was pushed to GitHub but the live Railway app kept running the old (2026-07-19) build for 3 days — this service deploys via direct upload (`railway up` / Railway MCP `deploy`), not from GitHub, the exact same gotcha flagged once before under "Deploy-workflow note" below. Redeployed for real, confirmed `HTTP 200` live, then the plan-selection screenshot above proved the gate actually fires.

## 🔒 Required builds before general launch (not bugs — missing features/gates)

- [x] ~~Billing via Shopify App Pricing~~ → **code-side done 2026-07-22**, see section above. Hard blocker was the missing enforcement code, not the Dashboard plan creation — that's the one remaining step, tracked above.

  **Exact click path (partners.shopify.com — the docs still say "Partner Dashboard" even though Dev Dashboard is primary elsewhere; if your login lands you on dev.shopify.com instead, the Distribution/Pricing screens are the same, just follow whatever the login redirects to):**

  1. Distribution first, irreversible: Partner Dashboard → **App distribution** → select `metalrate-sync` → **Choose distribution** → **Public distribution** → **Select**.
  2. Apps → All Apps → click `metalrate-sync` → **Distribution** → beside "Shopify App Store listing" click **Manage listing** → **Published languages** → **Edit** (your locale) → **Pricing content** → **Manage** (opens the Pricing index page).
  3. If not already on it: click **Settings** → select **Shopify App Pricing** → confirm **Switch**. (New apps get this as the default, so this step may already be done.)
  4. **Add the Starter plan**: under Public plans, click **Add** → Billing: Monthly → Monthly charge: `30` → Free trial duration: `14` → Welcome link: `/app` (relative path — MetalRate Sync has an App Home landing page) → **Save**. Back on the Pricing index page, find the plan → Display name: `Starter` → Top features: list the 800-SKU/2x-day-sync/audit-trail points from the site copy → **Save**.
  5. **Add the Pro plan**: same flow, Monthly charge `50`, trial `14`, Display name `Pro`, features: unlimited SKU/5x-day/priority support. India city rates is a baseline feature on both tiers, not Pro-exclusive — don't list it as a Pro differentiator.
  6. **Testing, no extra setup needed**: Shopify auto-provisions a **$0 private test plan** under Private plans — use it (or any dev store) to test the full billing flow before publishing, never gets charged.
  7. **Chris's private plan comes later, after approval** — same Private plans section, up to 20 authorized store domains per plan. Doesn't skip App Store review (a Public-track app still can't be installed by an external store pre-approval, confirmed earlier) — it's the free-for-life plan he lands on once he installs post-launch, matching the "Path to launch" step 7 below.

  Sources: [shopify.dev/docs/apps/launch/billing/shopify-app-pricing](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing), [.../shopify-app-pricing/plans](https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing/plans), [.../distribution/select-distribution-method](https://shopify.dev/docs/apps/launch/distribution/select-distribution-method).
- [x] ~~Plan-limit enforcement in code~~ → **done 2026-07-22**, see "Billing, plan enforcement & rate limiting" section above. SKU cap + sync-frequency are both live and plan-derived; manual Preview & Sync stays deliberately unlimited (cache-only, no quota risk).

**"How is Preview & Sync frequency limited right now?" — direct answer:** manual Preview & Sync can still be *clicked* unlimited times by a merchant, on both plans, deliberately — decided 2026-07-22 rather than adding a gated manual-refresh-count button. What changed is what clicking it costs: since Q5, repeated previews only ever hit the global rate cache (at most one live MetalPriceAPI call per TTL, system-wide, no matter how many merchants or clicks) — the vendor-quota risk this question originally worried about is gone, so there's no real protection a click-count cap would add, just friction. What's NOT rate-limited: each Preview/Apply still calls Shopify's own Admin API (catalog fetch, price mutations) — that's Shopify's rate limit to enforce, not ours, and the app already retries/backs off on throttling. What **is** now plan-gated (2026-07-22): the SKU cap (800 Starter / unlimited Pro) and the *automatic* scheduled-sync frequency (2x/day Starter, 5x/day Pro) — see the "Billing, plan enforcement & rate limiting" section above.
- [x] ~~Single app-owned MetalPriceAPI key~~ — **shipped 2026-07-19**: `METALPRICEAPI_KEY` env var, BYO field removed, key columns dropped. **User action required: add the premium key as `METALPRICEAPI_KEY` on Railway's dashboard (Variables tab) and in the local `.env`** — until then the Live provider shows a clear "not configured" message and Manual/Demo still work. Only you can change the key, from Railway. L2 fully dead.
- [ ] Split local dev database from the Railway production Postgres — currently sharing one instance, fine pre-launch, not once there are real paying merchants.

## 🧩 Optional / nice-to-have (post-MVP, not blocking anything)

- [ ] Storefront rate ticker / price breakup theme extension.
- [ ] eBay/marketplace sync, POS sync (Chris asked for eBay specifically).
- [ ] Built for Shopify badge — needs 50+ net installs on paid plans, 5+ reviews, minimum rating, and general good standing first (can't chase this until there's real usage — see architecture.md for exact thresholds pulled from Shopify's docs).
- [ ] True 10k+ scale live-validated against a real seeded catalog (code path built and mocked-tested, not yet run against an actual huge real store).
- [ ] L1 (Float → Decimal money fields) — see Bugs section, same item, optional-but-should-do-eventually.

---

## 🌱 Growth & distribution (2026-07-24) — while waiting on review

Full research: [research/outreach-list-and-messages.md](research/outreach-list-and-messages.md) (48 contacts), [research/outreach-round-2-2026-07-24.md](research/outreach-round-2-2026-07-24.md) (honest, un-launched-yet templates), [research/social-distribution-channels-2026-07-24.md](research/social-distribution-channels-2026-07-24.md) (channel-by-channel breakdown).

**Needs you (account/Dashboard access, can't script):**
- [ ] Send round-2 outreach emails — timing is your call, ~1-2 weeks out per the plan. Lead with the 4 stores that already run their own live price ticker (Kzoo Bullion, Shop Global Coin, Redmond Rare Coins, Ta Jewelers) — shortest pitch.
- [ ] Update App Store listing title/description/tags to include "Bullion Prices," "Precious Metal Price," "Spot Price" — the keyword set a direct competitor (nFusion's "Precious Metal Product Prices") already ranks on. Dev Dashboard only.
- [ ] Post to Shopify Community Forums — Shopify's own sanctioned self-promo channel, needs your account.
- [ ] **Post to r/ShopifyApps** (found by user 2026-07-27, not in the original research) — subreddit built specifically for this, self-promo explicitly welcome in-feed and in comments. Full template-answered draft ready. **Only 1 promo post/month per developer allowed — make it count.**
- [ ] Post to r/coins' recurring Self-Promotion Thread (when one's live — confirm it's the current one, they rotate) and r/SomebodyMakeThis's monthly Creator Showcase thread.
- [ ] Request access to the "Jewelry Marketing Tips & Tricks" Facebook group (1.6K members, private) and introduce yourself before posting.
- [ ] Indie Hackers launch post — receptive community, no prior bullion/precious-metals Shopify app launch found there (white space).
- [ ] Instagram — account created 2026-07-27. Full 8-post starter plan with real captions/assets/hashtags ready: [research/instagram-content-plan-2026-07-27.md](research/instagram-content-plan-2026-07-27.md). Only post #5 (before/after demo clip) needs new recording; the rest use existing screenshots.

**Deliberately not doing**: r/shopify, r/ecommerce, r/Gold, r/Silverbugs — all explicitly ban self-promo, engage there only by answering real questions (app in bio, never the post body).

## 🚀 SUBMITTED — under Shopify review as of 2026-07-24

The app has been submitted and is now in Shopify's review queue. Everything below this point in "Path to launch" is now historical record, not a live checklist — Shopify's own submission form wouldn't have accepted the app without the required fields filled, so items previously marked "confirm?" (pricing-details field, demo store) are resolved by that fact alone.

### Review bounce #1 (2026-07-27) — 2 fixes deployed, live confirmation still pending

**Flagged**: 1.2.3 "Allow pricing plan changes" — merchants must be able to upgrade/downgrade without contacting support or reinstalling. Reviewer's screencast showed the Settings page's "Upgrade to Pro" button rendering a blank screen/error instead of navigating to Shopify's plan-selection page.

**Attempt 1 — root cause**: our billing verification (2026-07-24) only ever tested the automatic "no active plan → redirect" flow (`app.tsx`'s layout loader). Changing an *already-active* plan is a genuinely different flow — a merchant clicking a button inside the app — and that button used a raw client-side `window.open(url, "_top")` instead of the framework's proven iframe-safe `redirect()`. Fixed by adding [app.settings_.change-plan.tsx](metalrate-sync/app/routes/app.settings_.change-plan.tsx), a resource route reusing that same proven redirect. Also closed the missing-downgrade gap: one "Change plan" button for every tier now, not an upgrade-only button. Deployed.

**Attempt 2 — user live-tested attempt 1 immediately, hit a NEW bug**: clicking "Change plan" produced `401 Unauthorized`. Root cause: the button used `useNavigate()`, which does a client-side JS *data-fetch* for the route's loader — but that loader's whole job is issuing an iframe-escaping redirect(), and (per the only previously-proven case) that's only ever actually run via a genuine full page navigation, never a nested SPA fetch. Fixed by switching to `window.location.assign()`, forcing a real navigation. Deployed 2026-07-27.

**⚠️ Not yet confirmed working live — this is NOT a closed item.** Two attempts already shipped for this exact button; don't mark it resolved in the Dashboard until you've personally clicked it and confirmed it lands cleanly on Shopify's hosted plan page.

**Also found while re-auditing (user asked directly, not something I'd have caught otherwise)**: a Pro merchant with >800 enabled SKUs downgrading to Starter kept ALL of them syncing forever — the SKU cap was only ever enforced when *enabling new* SKUs, never retroactively after a downgrade. **Fixed and verified with a real DB test** (seeded 801 SKUs on a Starter-tier shop, confirmed exactly 1 gets excluded and it's the correct oldest-first-wins one) — see `sync.server.ts`'s `buildPreview`. Deployed 2026-07-27, confirmed `HTTP 200` live.

**What you need to do:**
- [ ] Click through "Change plan" in the real admin — should land cleanly on Shopify's hosted plan-selection page now, not 401/blank. Test from both a Starter and a Pro state if you can.
- [ ] Record a short screen capture (Loom or similar) of that working — this is your "Proof of resolution" for the Dashboard's response form.
- [ ] In the Partner Dashboard's review-response screen: pick "Show resolved state," paste the recording URL into "Proof of resolution," click **Mark resolved**.
- [ ] Resubmit for review.

**What's actually left now:**
- [ ] **Wait for Shopify's review decision** on the resubmission. No fixed timeline — could be days to a few weeks, possibly more back-and-forth.
- [ ] **If bounced again**: fix whatever's flagged, same loop as above.
- [ ] **Once approved**: Chris (and anyone else) installs via the normal 14-day trial — see "Chris" section below, no private plan.
- [ ] Optional cleanup, not submission-blocking: split dev/prod DB, credential rotation follow-through if anything new gets exposed, the deferred Prisma major-version bump, L1 (Float→Decimal).

## 🚀 Path to launch — ONE track now (2026-07-19, simplified)

**Decision reversed from earlier the same day:** dropped the "second app + Custom distribution to fast-track Chris" plan entirely — too much overhead for what it bought. There is no platform shortcut that gets any external merchant, including Chris, into a Public-track app before it clears review — that's a Shopify rule, not something worth engineering around. So: **one app, one path, straight to real submission.** `metalrate-sync`'s distribution gets set to **Public** (not Custom) — do this as the first irreversible step, since it locks the app onto the App Store track for good, which is what's actually wanted now.

**Chris's access is simply: he installs like any merchant, once this is live.** Real 14-day trial via the normal App Store flow, no waiting on a separate app or Railway service. Afterward, hand him a **private plan** (Dev Dashboard → Pricing → add a private plan, up to 15 allowed per app) so he's free-for-life as design partner #1 — zero extra infrastructure, no billing code needed since nothing charges yet anyway. He gets full unrestricted access automatically today because there are no plan gates in the code (by design, see "Required builds" above) — that's not a workaround, that's just the current state.

Fact-checked against live shopify.dev docs 2026-07-19 (not memory — this stuff changes). Full detail in architecture.md "App Store submission checklist" — below is the flat version to work through, in order.

**1. Distribution (do first, irreversible):**
- [x] Partner Dashboard → `metalrate-sync` → Distribution → **Public distribution** — **done 2026-07-20**. Also registered the Partner account for App Store access ($19 one-time fee, Individual, no other associated accounts). This app is now locked onto the Public/App Store track — no second app needed.

**2. Configuration:**
- [x] App icon — 1200×1200px set in the Dev Dashboard (done 2026-07-19).
- [x] Emergency developer contact — email + phone number. **Confirmed done by user 2026-07-24.**
- [x] Double-check all app URLs avoid "Shopify"/"Example" — **re-verified 2026-07-24**: `metalrate-sync-app-production.up.railway.app` contains neither word.
- [x] Compliance webhooks (customers/data_request, customers/redact, shop/redact) — already built correctly.

**3. Billing + plan limits** — **fully done, code + Dashboard + live click-through, confirmed 2026-07-24.** Nothing left here.

**4. Listing content:**
- [x] Confirm "MetalRate Sync" doesn't collide with an existing app name — **verified clear via web search 2026-07-19**: no app by that name; closest are "Metal Updater" and two unrelated "GoldSync" apps. Note: MetalpriceAPI (the rate vendor) ships its own competing Shopify app — no naming conflict, just competitive awareness.
- [x] **App renamed to "Ounce: MetalRate Sync" — 2026-07-20**, per Shopify's own AI listing-review flag: app names can't be a pure functional descriptor, must lead with a distinctive brand word ("QTeck - Announcement Bar" not "Announcement Bar - QTeck"). "MetalRate Sync" alone is just metal+rate+sync — no brand. Picked "Ounce" (troy-ounce reference, checked clear on the App Store via web search). Only the formal listing/TOML name changed — domain (metalratesync.com), logo, and marketing-site copy all stay "MetalRate Sync" as the product's common name. `shopify.app.toml`'s `name` field updated and deployed live (`shopify app deploy`, version `ounce-metalrate-sync-4`).
- [x] 5 screenshots, exact 1600×900 — cropped from real captures (right-side empty admin whitespace trimmed, nothing meaningful lost): `asset/listing-screenshots/shot-{dashboard,formulas,import,history,settings}.png`.
- [x] Feature media — **fixed 2026-07-20** after Shopify's own AI listing review flagged the original pedestal illustration as "not informative... only includes a logo, icon, or illustration." Swapped to `asset/listing-screenshots/shot-dashboard.png` (real UI, live rates + last sync). The pedestal render stays on the marketing site hero instead, where illustration is fine.
- [x] Demo store URL — real products, submitted successfully as part of the listing.
- [x] Support email address → `metalratesync@gmail.com` (decided 2026-07-19, same address used everywhere).
- [x] Privacy policy URL → `https://metalratesync.com/privacy`, live.
- [x] Pricing entered only in the designated Pricing Details section of the form — **confirmed by submission itself 2026-07-24** (Shopify's form wouldn't accept it otherwise).
- [x] Sales-channel requirements → "My app doesn't require the Shopify Online Store or Shopify POS."
- [x] Protected customer data → opted out via "My app won't use customer data" + Request.

**5. Review prep:**
- [x] Full setup screencast for the reviewer — **confirmed done by user 2026-07-24.**
- [x] Review path for the live-rate feature: **corrected 2026-07-24 — no credential question at all.** `METALPRICEAPI_KEY` is one global env var on Railway shared by every shop (confirmed in `rates.server.ts`), not per-merchant — there's no separate key to hand the reviewer in the first place. Either mode works: **Live market rates** shows genuinely real prices with zero setup and proves the actual feature works, not just the mechanics; **Demo rates** works too if preferred. Recommend Live rates for the screencast/instructions since it's the stronger proof and costs nothing.
- [x] Run the Dev Dashboard's automated pre-submission checks, clear every flag — **AI self-review run twice**: [2026-07-20](research/app-store-self-review-2026-07-20.md) and [2026-07-21](research/app-store-self-review-2026-07-21.md). Both: 28 passing, 0 failing, only the same 3 billing items (1.2.1/1.2.2/1.2.3) flagged "needs review" because the tool can't check Dashboard-only state from source code. **Those 3 resolved 2026-07-22**: billing code live-deployed and enforcing, Starter/Pro plans confirmed live. The live "Automated checks for common errors" button in the Dashboard was also cleared — submission wouldn't have gone through otherwise.
- [x] Zero web errors and zero known UI bugs — B1/B2/B3 fixed and deployed live before submission.

**6. Submit for review — DONE 2026-07-24. App is now under Shopify review.**

**7. Once approved:** Chris (and anyone else) installs via the normal App Store trial. **Decided 2026-07-22: no private/free plan for Chris** — he hasn't replied to outreach, so there's no active relationship to justify special-casing him. He gets the same 14-day trial as any other merchant if/when he installs. Revisit a private plan only if he actually re-engages.

**Domain / SEO:**
- [x] Domain chosen: **metalratesync.com** (purchased 2026-07-19).
- [x] Marketing site built (2026-07-19 night) — Next.js in [website/](website/), dark premium design matching brand assets: hero with feature render, 4-metal ticker signature, trust pillars, 6 features, 5 real app screenshots, $30/$50 pricing, dealer FAQ, contact (metalratesync@gmail.com), /privacy + /terms, full SEO (per-route metadata + canonicals, OG/Twitter cards, SoftwareApplication JSON-LD, sitemap.xml, robots.txt). Static build clean, visually verified in browser.
- [x] **Deploy to Vercel + connect domain** — done. `https://metalratesync.com/` verified live all through this session (HTTP 200, real content, live ticker, /docs page, everything). Auto-deploys on every push to `master` now.
- [x] Privacy policy URL for the App Store form = `https://metalratesync.com/privacy` — verified live, HTTP 200, 2026-07-24.

**Credential hygiene (do before real merchants, not urgent today):**
- [x] Rotate all four credentials exposed in chat/screenshots during setup: MetalPriceAPI key, `SHOPIFY_API_SECRET`, the Railway Postgres password (visible in a 2026-07-19 dashboard screenshot), and treat `SHOPIFY_API_KEY` as public (it is by design). **Confirmed done by user 2026-07-24.**

**Deploy-workflow note (bit us 2026-07-19):** the Railway service deploys via `railway up` (CLI upload), NOT from GitHub — pushing to GitHub does nothing to production, and Railway's "Redeploy" button just restarts the old image. Either run `railway up` after every change that should ship, or (better) connect the service to the GitHub repo in Railway → Settings → Source so pushes auto-deploy.

---

## Chris — no separate plan needed anymore

Superseded 2026-07-19: no more second app, no second Railway service, no Custom distribution. Chris installs the one real app once it's Public and live, same flow as any merchant.

**Updated 2026-07-22**: also no private/free plan anymore — he never replied to the outreach emails, so there's no design-partner relationship active right now to build special-case infrastructure for. Normal 14-day trial like every other merchant if he ever installs. See "Path to launch" step 7 above.
