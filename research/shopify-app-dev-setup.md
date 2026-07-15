# Shopify App Dev Environment Setup — Research (compiled 2026-07-15)

Scope: everything needed to go from zero to a working Partner account + dev store + local app scaffold + Claude Code wired into the Shopify dev workflow. Compiled from 4 parallel research passes (WebSearch + Firecrawl), all facts cited.

---

## 1. Partner account setup

- **Signup**: partners.shopify.com, Join Now, email/name/password, email verification link (~24h valid), fill partner profile (business name, location, categories, portfolio links), accept Partner Program Agreement. [Lucent Innovation guide](https://www.lucentinnovation.com/resources/it-insights/a-complete-guide-on-shopify-partners)
- **Cost**: free at entry ("Registered") tier, no revenue minimum, no portfolio review.
- **Approval**: instant, no wait. Immediately get unlimited free dev stores + Shopify Academy access.
- **Banking/tax info**: not needed upfront. Only configured once you actually earn (Hyperwallet payout, $25 minimum payout, twice monthly, 30 day hold on first merchant payment before payout accrues). [Shopify Help — Getting paid](https://help.shopify.com/en/partners/partner-program/getting-paid)
- **Individuals allowed**: yes, explicitly. Partner Program Agreement only requires 18+ age, no business registration needed. [Partner Terms](https://www.shopify.com/partners/terms)
- **India-specific**: no GST/company registration required to join as Partner or build/test apps. GST only becomes relevant around actual merchant-side selling, not app development.
- **2025-2026 changes**:
  - **July 9, 2026**: new identity verification (govt ID + Stripe selfie/liveness check) — but only required when requesting collaborator access to someone else's *live merchant store*. Does not apply to solo dev building own app on own dev store. [Shopify changelog](https://shopify.dev/changelog/identity-verification-for-partners)
  - **March 30, 2026**: Partner accounts restructured into "Organizations" (Owner/Admins/roles), all store types consolidated into the new Dev Dashboard. Automatic migration, no action needed. [Shopify Partners Blog](https://www.shopify.com/partners/blog/improved-building-for-partners)
  - **July 9, 2026**: app pricing limits raised (public plans 4→8, private 10→15), plus **no-charge plan testing** — mark a plan free so billing flow can be tested end-to-end in a dev store without real charges. Useful for solo dev billing tests.
- **Realistic time**: ~15-30 min signup + a few min to create dev store + a few min CLI install. **Total ~30-60 minutes, zero to ready.**

## 2. Development stores

- **Created via the new Dev Dashboard** (dev.shopify.com/dashboard), not the old Partner Dashboard — replaced Jan 1, 2026 for custom apps. Flow: Stores → Create store → name → pick plan (Basic/Grow/Advanced/Plus) → Create. [Shopify Dev Docs](https://shopify.dev/docs/apps/build/dev-dashboard/stores/development-stores)
- **Unlimited, free**, per partner.
- **Limits**: can't process real transactions (test orders only via Bogus Gateway or a payment provider's test mode); real Store Credit/Gift Cards unsupported; storefront password page can't be removed, only customized; can't be transferred to a client (use a separate client-transfer store for that).
- **No official product/order cap** for dev stores specifically (the commonly-cited 50k/24h upload throttle is a production-store limit).
- **Domain**: default myshopify.com subdomain is fine, no custom domain needed for dev/testing.
- **Dev store vs Plus Sandbox vs live trial store**:
  - Dev store: free, unlimited, **can use all Shopify Plus APIs** by selecting the Plus plan at creation — only real difference from a live Plus store is API rate limit ceiling (Plus gets up to 10x higher limits on select APIs).
  - Plus Sandbox: tied to an *existing live Plus merchant*, not something a solo partner can spin up standalone.
  - Live/trial store: not recommended for building, real billing implications, not meant for breaking things.
  - **Recommendation: one regular dev store, Plus plan selected if you need Plus-only APIs. Covers checkout, installs, and billing testing (with the new no-charge plan feature).**

## 3. Shopify CLI local scaffolding

- **Prerequisites**: Node.js 22.12+ LTS (avoid Node 20, CLI 4.0 breaks on it; some reports of hangs even on 22.18, so stay on a stable 22.x LTS point release, not bleeding edge). npm/Yarn/pnpm all fine. Git 2.28+. [shopify.dev/docs/api/shopify-cli](https://shopify.dev/docs/api/shopify-cli)
- **Windows**: works natively, WSL not required or recommended for app dev (only occasionally used for theme dev, and has its own bugs there). Known Windows gotchas:
  - Prisma native binary crash (`query_engine-windows.dll.node ... not a valid Win32 application`), especially ARM64 — fix: set `PRISMA_CLIENT_ENGINE_TYPE=binary`. Documented directly in the official template README.
  - Global npm install PATH issues (`'shopify' is not recognized`) — fix via `npm config set script-shell` to cmd, or make sure PowerShell (not legacy CMD) is used.
- **Scaffold**: `npm install -g @shopify/cli @shopify/app` then `shopify app init` (or `npm create @shopify/app@latest`). Prompts for app name + template.
- **Template: React Router is the current official recommendation** ("the recommended path for most apps" per shopify.dev) — Remix was folded into React Router, old Remix template is legacy but still exists. PHP/Ruby templates effectively deprecated, no first-class 2026 support found. [github.com/Shopify/shopify-app-template-react-router](https://github.com/Shopify/shopify-app-template-react-router)
- **Dev Dashboard replaces Partner Dashboard for app workflows** as of Jan 1, 2026 — expect `shopify app dev` login flow to hit the new dashboard. Older tutorials referencing "Partner Dashboard" steps may be stale.
- **Local dev loop**: `shopify app dev` logs you in, connects/creates the app in Dev Dashboard, sets up local Prisma/SQLite, and opens a **Cloudflare tunnel** (built into CLI, no separate ngrok needed) between your machine and the dev store. Press `p` to open preview and install on your dev store.
  - Known tunnel issue: "Could not start Cloudflare tunnel: max retries reached" — sometimes VPN-related or a stale `.cloudflared/config.yaml`. Alternative: `--use-localhost` networking mode instead of the Cloudflare tunnel.
- **Webhook testing**: `shopify app webhook trigger` sends a sample payload to your local endpoint, but the `admin` object is `undefined` in CLI-triggered webhooks (fake, non-installed shop) — good for checking route/HMAC wiring only, not full business logic. For real testing, trigger actual store events (e.g. edit a product to fire PRODUCTS_UPDATE).
- **Billing testing**: no dedicated CLI test-billing command; the new **no-charge plan** feature (July 2026) is the practical way to test a full billing flow end-to-end on a dev store without real charges.
- **Deployment**: `shopify app deploy` bundles config (`shopify.app.toml`) + extensions and releases an app version — it does **not** deploy your actual web app code, that's on you to host. `shopify app config push` is deprecated, migrate to `shopify app deploy --allow-updates`/`--allow-deletes`.
  - Officially documented hosting options: Google Cloud Run (most detailed official tutorial), Fly.io (has first-class Shopify CLI support), Render. Railway is common via community tutorials, not in Shopify's own doc list.
  - Default storage is SQLite via Prisma — fine for single instance, but watch for hosts that sleep/wipe idle containers (attach a persistent volume).
- **Realistic time to Hello World**: best case ~10-20 min if nothing breaks. Realistic first-time-on-Windows estimate accounting for likely friction (Node mismatch, Prisma binary error, PATH issue, or a flaky tunnel retry): **30-90 minutes.**
- **Known 2026 CLI bugs to watch for**: `shopify app init` hanging on "Installing dependencies," npm install permission errors on scaffold, port conflicts with other local dev servers after CLI 3.85+, `xdg-open ENOENT` on headless environments.

## 4. Claude Code + Shopify integration (this is the important one)

**Shopify officially ships and maintains AI-assistant tooling built specifically to work with Claude.**

- **March 31, 2025**: original Shopify.dev MCP Server released, explicitly calling out Cursor and Claude Desktop support. [changelog](https://shopify.dev/changelog/mcp-server-for-the-shopify-dev-assistant)
- **Dec 10, 2025 (Winter '26 Edition)**: expanded to cover the entire dev platform (Admin, UI extensions, Liquid, Hydrogen), explicitly named Cursor and Claude as first-class clients. [Winter '26 announcement](https://www.shopify.com/news/winter-26-edition-dev)
- **April 9, 2026**: Shopify open-sourced the **Shopify AI Toolkit** (MIT license) at [github.com/Shopify/Shopify-AI-Toolkit](https://github.com/Shopify/Shopify-AI-Toolkit) — packages the MCP server + agent skills + native plugins for Claude Code, Cursor, Codex, Antigravity CLI, Hermes, VS Code into one install.
  - Install: `claude plugin install shopify-ai-toolkit@claude-plugins-official`, or raw: `claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest`
  - **This exact toolkit is already installed in this environment** — the `shopify-plugin` MCP tools (`learn_shopify_api`, `search_docs_chunks`, `validate_component_codeblocks`, `validate_graphql_codeblocks`, `validate_theme`) and the `1.4.1:shopify-*` skills are a live instance of it. Nothing to set up, it is already wired in.
  - Seven core tools total per the toolkit: `learn_shopify_api`, `search_docs_chunks` + `fetch_full_docs`, `introspect_graphql_schema`, `validate_graphql_codeblocks`, `validate_component_codeblocks`, `validate_theme_codeblocks`. These let the agent search live docs, introspect the actual GraphQL schema (Admin API has ~2,796 types), and validate generated code against real schemas before use, specifically to kill hallucination.
  - **Privacy note**: the toolkit has built-in telemetry (tool name, model, client, search/validation payloads sent to shopify.dev/mcp/usage), opt-out via `OPT_OUT_INSTRUMENTATION=true` env var.
- **April 20, 2026 — AI self-review tool for App Store submission**: run before submitting, checks GraphQL API/query compliance, webhook subscriptions incl. GDPR webhooks, OAuth flow correctness, Liquid/UI extension validation, Polaris compliance, listing completeness. Copy a pre-built prompt from the Partner/Dev Dashboard submission page and run it against your codebase in Claude Code (or Cursor/Codex). Takes ~2 minutes. **Passing it does not guarantee approval** — it only catches static/mechanical issues, not live behavior or listing content quality. [changelog](https://shopify.dev/changelog/new-app-submission-experience-in-the-partner-dashboard)
- **Shopify Sidekick** (separate, merchant-facing, not a coding assistant) runs on Claude Sonnet 4.5 via Vertex AI, can generate custom admin apps from natural language for merchants — different product from the dev-facing MCP toolkit.

### What AI assistants get wrong on Shopify (and how to avoid it)

- **REST API hallucination**: since April 1, 2025 all new public/custom apps must use GraphQL Admin API only, REST is legacy. AI trained on older tutorials still suggests REST by default unless grounded in current docs via the MCP tools.
- **GraphQL schema hallucination**: queries against deprecated/renamed fields when the agent isn't grounded in live schema introspection rather than training-time snapshot. Fix: use `introspect_graphql_schema` / `validate_graphql_codeblocks`, don't trust memory.
- **Polaris component API drift**: AI suggesting outdated component props. Mitigated by pulling Polaris docs live at generation time via the toolkit rather than relying on frozen training data.
- **Hardest failure modes reported by real builders** (Weaverse's Cursor+Claude Code experiment on a Hydrogen storefront): Storefront API cursor-based pagination (forgetting `endCursor`), compound filters (wrong input assembly, silently empty results), cart mutation merge semantics, custom session handling, and **especially OAuth flows** — "small errors in token handling or validation produce silent failures that are hard to debug."
- **Shopify's own stance** (Field CTO, May 2026): scaffolding a storefront in a weekend with AI is real, but payments/PCI/fraud/tax/peak infra are not realistically vibe-codable. "Build for differentiation, buy for operations." Cites a March 2026 Forrester paper concluding vibe-coded commerce code "may function but falls far short of production-ready."
- **Recommended safeguards from practitioners**: keep a `CLAUDE.md` populated with tech stack, naming conventions, and target API version so the agent doesn't drift. Commit early and often to roll back subtle AI regressions. Treat AI output as a first draft, especially for cart/checkout/auth. Run the toolkit's `validate_*` tools as a pre-deploy gate, not just at submission time. Shopify's own VP of Engineering warns of "comprehension debt" — leaning on AI code you don't understand becomes undebuggable when OAuth/session logic breaks.

---

## Net takeaways for this project

1. Environment setup is genuinely fast: **~30-60 min for Partner account + dev store**, **~30-90 min for first Hello World app running in that dev store**, assuming normal Windows CLI friction and not a disaster run. Under a day total, realistically an afternoon.
2. No business registration, no GST, no KYC needed to start building. Only future item: identity verification if ever requesting access to someone else's live merchant store (not needed for building your own app on your own dev store).
3. The Claude Code + Shopify integration is not something to build, **it already exists officially and is already installed here**. Use `learn_shopify_api` and `search_docs_chunks` while building instead of trusting model memory on GraphQL/Polaris specifics, since those are exactly where AI hallucination hits hardest on this platform.
4. Before submitting to the App Store, run the AI self-review tool (prompt lives in Dev Dashboard submission page) through Claude Code as a first pass, it will not replace the ~4-6 week human review queue but it does cut the "bounced back for something mechanical" risk.
5. Watch for OAuth/session code specifically, that is the one place every source (Weaverse, Shopify's own VP Eng) flags as the spot where AI-generated Shopify code silently breaks. Review it by hand, do not just trust it because it runs.
