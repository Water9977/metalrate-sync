# App Store AI self-review — 2026-07-21 (re-run via /shopify-app-store-review skill)

Fetched live requirements fresh (not reused from the 2026-07-20 pass) and re-verified every codebase signal directly — nothing here relies on memory of the earlier report. App has been renamed to "Ounce: MetalRate Sync" and Starter/Pro billing plans are being configured in the Partner Dashboard since that report; re-checked all local signals against the current code.

### Summary

✅ **Likely passing:** 28
❌ **Likely failing:** 0
⚠️ **Needs review:** 3
⏭️ **Groups skipped:** 10 _(see below)_

**Note:** The agent has reviewed a subset of requirements that have been selected by Shopify as checkable against a local codebase without browser context. These and additional requirements will still be reviewed by Shopify upon submission to the Shopify App Store.

### ⚠️ Requirements that need review

⚠️ **1.2.1 Use Shopify App Pricing or the Shopify Billing API**

**Why this needs attention:** This is a Partner Dashboard-configured setting (plan name, price, trial, redirect URL), not something that exists in the app's own source code — a local codebase check structurally cannot confirm whether live plans exist or are correctly saved. You've been actively creating Starter ($30/mo) and Pro ($50/mo) plans in the Dashboard this session, but that state isn't verifiable from here.

**What was detected:** Zero Billing API calls anywhere in the codebase (`appSubscriptionCreate` etc. absent) — correct and expected for Shopify App Pricing, which needs no app-side billing code. Confirm directly in the Partner Dashboard's Pricing page that both plans are saved with billing model, trial, and display name/features all filled in before submitting.

⚠️ **1.2.2 Implement billing correctly (decline/reinstall handling)**

**Why this needs attention:** Shopify App Pricing handles charge approval, decline, and reinstall-resubscribe natively with zero app code — satisfied automatically once the plans from 1.2.1 are live and correctly configured. Not independently verifiable from source.

**What was detected:** No custom charge-approval/decline code exists — correct for this billing model, contingent on 1.2.1 actually being complete.

⚠️ **1.2.3 Allow pricing plan changes without reinstall**

**Why this needs attention:** Same dependency as above — Shopify hosts the plan-selection page and handles upgrade/downgrade natively; nothing to check in code.

**What was detected:** No blocking logic anywhere that would prevent a plan change (no reinstall-required flags, no support-ticket gating).

### Skipped groups

- **5.1 Online store** — no `shopify.extension.toml` with `type = "theme"` (extensions/ directory is empty, only `.gitkeep`)
- **5.2 Payment** — no payment extension, no `write_payment_gateway` scope (only `write_products`)
- **5.3 Payment facilitator** — opt-in, not requested
- **5.4 Purchase option** — no subscription/deferred-payment scopes requested
- **5.5 Product sourcing** — opt-in, not requested
- **5.6 Checkout customization** — no checkout UI extension exists
- **5.7 Sales channel** — no `channel_config` extension exists
- **5.8 Post purchase** — no `checkout_post_purchase` extension exists
- **5.9 Mobile app builders** — opt-in, not requested
- **5.10 Donation** — opt-in, not requested

### Re-verified this pass (not assumed from the earlier report)

- **Scopes**: `write_products` only — confirmed in `shopify.app.toml` right now.
- **App name**: `Ounce: MetalRate Sync` — confirmed updated and matches the deployed Dashboard name.
- **Extensions**: none — `extensions/` still has only `.gitkeep`.
- **REST usage**: zero hits for `/admin/api/*.json` or REST client patterns anywhere in `app/` — GraphQL only, confirmed fresh.
- **App Bridge**: `app/routes/app.tsx` still uses `<AppProvider embedded apiKey={apiKey}>` from `@shopify/shopify-app-react-router/react` — correct injection pattern, re-confirmed.
- **Auth-before-anything**: all 6 route loaders (`app._index`, `app.products`, `app.formulas`, `app.sync`, `app.history`, `app.settings`) call `authenticate.admin(request)` as their first statement — re-confirmed by direct grep, not memory.
- **TLS**: `application_url` is `https://...railway.app` — HTTPS confirmed live via direct `curl` earlier this session.

### Resources
- [App Store requirements documentation](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Best practices for apps](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices)
- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Submitting your app for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)
