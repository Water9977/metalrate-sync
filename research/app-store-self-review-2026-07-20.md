# App Store AI self-review — 2026-07-20

Requirements fetched live via `shopify doc fetch` (CLI 4.5.2, upgraded from 3.93.2 specifically to get this command) against [app-store-ai-self-review-requirements.md](app-store-self-review-requirements.md). Evaluated against the actual codebase, not memory — every ✅ below is grounded in a specific grep/read done this pass, not assumed.

### Summary

✅ **Likely passing:** 28
❌ **Likely failing:** 0
⚠️ **Needs review:** 3
⏭️ **Groups skipped:** 10 (see below)

**Note:** This is the subset of requirements Shopify's own tool says are checkable against a local codebase without browser context. Shopify's human/automated review still checks everything else at submission time.

### ⚠️ Requirements that need review

⚠️ **1.2.1 Use Shopify App Pricing or the Shopify Billing API**

**Why this needs attention:** No billing code exists in the app (correct — Shopify App Pricing needs none), and no plans are live yet. Setup is in progress right now via the Partner Dashboard (Distribution → Public already done; Pricing content → Manage is the current step). This must be *completed* — Starter $30/mo and Pro $50/mo plans actually created and saved — before submission, since the app can't be truly free forever per the launch plan.

**What was detected:** Zero Billing API calls anywhere in the codebase (`appSubscriptionCreate` etc. absent) — correct for the Shopify App Pricing model, but confirms plans aren't wired up in code because they don't need to be; the gap is purely on the Dashboard side, not code.

⚠️ **1.2.2 Implement billing correctly (decline/reinstall handling)**

**Why this needs attention:** Shopify App Pricing handles charge approval, decline, and reinstall-resubscribe natively with zero app code required — so this becomes automatically satisfied once the plans from 1.2.1 are actually published. Can't confirm "implemented correctly" when the plans don't exist yet to test against.

**What was detected:** No custom charge-approval or decline-handling code exists — expected and correct for this billing model, contingent on 1.2.1.

⚠️ **1.2.3 Allow pricing plan changes without reinstall**

**Why this needs attention:** Same dependency — Shopify hosts the plan-selection page and handles upgrade/downgrade natively for Shopify App Pricing apps, no in-app code needed. Confirmable only once plans exist.

**What was detected:** No blocking logic anywhere that would prevent a plan change (no reinstall-required flags, no support-ticket gating) — consistent with a pass, pending 1.2.1.

### Skipped groups

- **Group 1.2 partially evaluated, not skipped** (see above — evaluated as Needs review, not skipped)
- **5.1 Online store** — no `shopify.extension.toml` with `type = "theme"` (extensions/ directory is empty, only `.gitkeep`)
- **5.2 Payment** — no payment extension, no `write_payment_gateway` scope (only `write_products` requested)
- **5.3 Payment facilitator** — opt-in, not requested
- **5.4 Purchase option** — no subscription/deferred-payment scopes requested
- **5.5 Product sourcing** — opt-in, not requested
- **5.6 Checkout customization** — no checkout UI extension exists
- **5.7 Sales channel** — no `channel_config` extension exists
- **5.8 Post purchase** — no `checkout_post_purchase` extension exists
- **5.9 Mobile app builders** — opt-in, not requested
- **5.10 Donation** — opt-in, not requested

If you want any of these evaluated anyway (e.g. planning a future theme extension), just ask.

### Notable passes worth knowing why they pass

- **2.2.3 Latest App Bridge** — real ambiguity resolved this pass: `root.tsx` has no literal `app-bridge.js` script tag (grepped, confirmed absent). Traced it instead to `app/routes/app.tsx`, which uses `<AppProvider embedded apiKey={apiKey}>` from `@shopify/shopify-app-react-router/react` — the framework's own component that handles App Bridge injection for this specific template. Matches confirmed live behavior (toasts, modals, `useAppBridge()` hooks all tested working in production earlier this session).
- **2.2.4 GraphQL Admin API only** — grepped for any `/admin/api/*.json` REST-style calls across `app/`: zero hits. Every Shopify API call in the codebase (`sync.server.ts`, `catalog.server.ts`, `app.products.tsx`, etc.) uses `admin.graphql(...)`.
- **Group 3.2 scope-specific requirements** — all pass by not applying: `shopify.app.toml` requests only `write_products`. None of `read_all_orders`, `write_payment_mandate`, `write_checkout_extensions_apis`, `read_advanced_dom_pixel_events`, or `read_checkout_extensions_chat` are present.
- **2.3.2 Authenticate immediately after install** — every single route's loader (`app._index.tsx`, `app.products.tsx`, `app.formulas.tsx`, `app.sync.tsx`, `app.history.tsx`, `app.settings.tsx`) calls `await authenticate.admin(request)` as its first line, before anything else runs.

### Resources
- [App Store requirements documentation](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Best practices for apps](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices)
- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Submitting your app for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)
