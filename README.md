# MetalRate Sync

A Shopify app that automatically repriced product catalogs from live gold, silver, platinum and palladium rates — built for jewelry and bullion sellers who currently do this by hand or on a competitor app that breaks at scale.

This repo is the whole project, not just code: market validation, competitive research, and the running architecture doc all live here alongside the app.

## Why this exists

18 apps already compete in this Shopify App Store niche. Only 7 have any reviews at all, none hold the Built for Shopify badge, and the closest thing to a design partner (a real bullion retailer, Liquid Bullion) is actively trying to leave the market's worst-rated incumbent (2.8★) because its bulk price import has been broken for years. Full findings: [competition-analysis.md](competition-analysis.md).

The product bet: **reliability at scale and preview-before-commit** — nobody else in the niche has proven either.

## Repo layout

```
architecture.md              # living truth-source doc — project state, decisions, changelog
competition-analysis.md      # full teardown of all 18 competing apps
research/
  shopify-app-dev-setup.md   # Partner account, dev store, CLI, and Claude/Shopify AI toolkit research
metalrate-sync/               # the app itself (Shopify CLI, React Router template)
```

Start with [architecture.md](architecture.md) — it's kept current after every meaningful change and is the fastest way for a human or an AI to understand where this project stands.

## The app

**Stack**
- [Shopify CLI](https://shopify.dev/docs/apps/build/scaffold-app) + the official React Router app template (Remix's successor, current Shopify recommendation)
- Embedded admin UI with App Bridge + **Polaris web components** (`s-*` elements)
- **GraphQL Admin API only** — Shopify has required this for all new public apps since April 2025
- Prisma + SQLite for local dev

**What it does**
1. Define a **pricing formula**: metal, purity/karat, making charges, wastage %, markup, tax, rounding, and an optional stop-loss floor.
2. Assign a **weight and formula** to any product variant.
3. **Preview** the exact price change for every tracked variant before anything touches the store — current price, new price, % change, and why any variant was skipped.
4. **Sync**: prices are pushed in Shopify-API-limit-safe batches (≤250 variants/call) with retry-on-throttle and a full per-variant audit trail, so a failed update is never silent.
5. **History**: every run is recorded — what changed, what didn't, and the exact rates used.

### Local development

```bash
cd metalrate-sync
npm install
npm run dev
```

`shopify app dev` will prompt you to log into your Partner account and pick (or create) a development store, then open a tunnel and let you install the app there. First run needs your interactive login — nothing here can be scripted around that.

### Useful commands (run from `metalrate-sync/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server + Shopify tunnel |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run setup` | Apply Prisma migrations (used in deploy) |
| `npx prisma studio` | Browse the local dev database |

## Status

Base app is scaffolded and building clean (typecheck ✅, production build ✅, GraphQL validated against the live Admin schema). Not yet installed on a dev store, not yet submitted. See the Open questions / TODO section in [architecture.md](architecture.md) for what's next.

---

Private repo — contains real conversations with a prospective customer and unpublished competitive research. Do not make public without stripping that out first.
