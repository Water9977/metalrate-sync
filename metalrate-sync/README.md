# MetalRate Sync

Shopify app that reprices product variants from live gold/silver/platinum/palladium rates. Full product context, market validation, and the running project log live one level up in [../architecture.md](../architecture.md) — read that first if you're new here.

## What's actually in this codebase

- **Formulas** (`app/services/pricing.server.ts`) — pure function turning weight × purity × a live rate into a final price, with making charges, wastage, markup, tax, optional step rounding, charm pricing, and a minimum-change threshold.
- **Rates** (`app/services/rates.server.ts`) — provider abstraction: `mock` (works with zero setup), `metalpriceapi` (live), `manual` (merchant types in their own board rate). Cached per shop with a configurable TTL.
- **Catalog matching** (`app/services/catalog.server.ts`) — fetches the store's variants keyed by SKU. Small/medium catalogs use plain paginated GraphQL (instant); catalogs bigger than 2,000 variants automatically escalate to Shopify's Bulk Operations API, polled with a bounded budget so it still fits inside one request, with the job state persisted so a retry doesn't restart it.
- **Bulk import** (`app/services/import.server.ts`, `app/services/csv.server.ts`) — the actual wedge feature. Download the catalog as a CSV, edit weight/formula for many products in Excel, re-upload, get a report of exactly what matched and what didn't.
- **Sync** (`app/services/sync.server.ts`) — builds a preview (dry run diff) and, on apply, pushes prices to Shopify in ≤250-variant batches with retry-on-throttle and a full per-variant audit trail in `SyncRun`/`SyncRunItem`. Nothing is ever silently dropped.
- **Scheduler** (`app/services/scheduler.server.ts`, `app/services/scheduling.server.ts`) — in-process interval scheduler, ticks every minute, runs a shop's sync once its configured interval has elapsed. Needs a persistent host (Fly.io/Railway/Render) to actually keep running — it does nothing on serverless hosting, where a real job queue would be needed instead.

Routes under `app/routes/app.*` are thin — they call the services above and render Polaris web components (`s-*` tags). See [../architecture.md](../architecture.md)'s "Codebase map" for the full route list.

## Testing approach used in this repo

There's no permanent test suite yet (small app, moving fast) — instead, every non-trivial service has been verified with a throwaway `tsx` script during development: a mocked Shopify admin client (`{ graphql: async (query, vars) => new Response(...) }`) exercising the real service function against the real (isolated, cleaned-up) local database, asserting real outcomes. This proves the logic without ever needing a live Shopify session or touching any secret. If you're adding a new service function, follow the same pattern:

```
npx tsx some-throwaway-script.ts
```

Node's native TypeScript support handles this directly (Node 22.6+), but `tsx` resolves the project's extensionless relative imports correctly where Node's raw type-stripping doesn't — use `npx --yes tsx`, not `node`, for anything that imports more than one local file.

Never write a script that imports `shopify.server.ts` directly outside the running app — it initializes `shopifyApp()` at import time, which needs `SHOPIFY_API_SECRET` from the environment, and there's no safe way to obtain that value outside the app's own process (`shopify app env show` prints it in plaintext, don't run that and paste the output anywhere). If a service needs a live Shopify session, test it inside the running dev server instead.

## Local development

```shell
npm install
npm run dev
```

Prompts for your Partner org and dev store, opens a Cloudflare tunnel, installs the app. Press `p` to open it.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server + Shopify tunnel |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run setup` | Apply Prisma migrations (used in deploy) |
| `npx prisma studio` | Browse the local dev database |
| `npx prisma migrate dev --name x` | New migration (may need `--create-only` + manual `migrate deploy` if it prompts for confirmation non-interactively) |

## Hosting note

Two features need a persistent (non-serverless) host to actually work: the **scheduler** (an in-process `setInterval`, needs a long-running process) and **Bulk Operations polling** (a synchronous wait inside one request, bounded to 45s — fine on Fly/Railway/Render's default timeouts, risky on a host with a shorter request limit). See [../architecture.md](../architecture.md) for the hosting decision status.

## User-facing documentation

See [docs/user-guide.md](docs/user-guide.md) for how formulas/CSV import work from a merchant's point of view — this is what a beta tester or Chris should read, not this file.

---

## Template gotchas (inherited, still relevant)

This app started from Shopify's official `shopify-app-template-react-router`. These are template-level issues that can still bite you:

### Database tables don't exist

```
The table `main.Session` does not exist in the current database.
```

Run `npm run setup` (applies Prisma migrations).

### Navigating/redirecting breaks an embedded app

1. Use `Link` from `react-router`, not `<a>`, for in-app navigation.
2. Use `redirect` returned from `authenticate.admin`, not `redirect` from `react-router`.
3. Use `useSubmit` from `react-router`.

### Webhooks: Admin object undefined when triggered by the CLI

`shopify app webhook trigger` uses a fake, non-installed shop, so `admin` is `undefined` in the handler. Fine for checking route/HMAC wiring, not for testing real business logic — trigger real store events instead (e.g. edit a product title for `PRODUCTS_UPDATE`).

### "nbf" claim timestamp check failed

Your machine's clock is out of sync. Enable "Set time and date automatically."

### `query_engine-windows.dll.node is not a valid Win32 application` (Windows)

```shell
PRISMA_CLIENT_ENGINE_TYPE=binary
```

### `EPERM: operation not permitted, rename ...query_engine-windows.dll.node` (Windows, while `npm run dev` is already running)

`prisma generate` can't replace the native binary while another process (your running dev server) has it loaded. Harmless — the TypeScript types still update even when this specific step fails; the binary itself refreshes next time you restart `npm run dev`. Don't run two `npm run dev`/`prisma generate` processes against the same project at once on Windows, they'll fight over this file.

### Cloudflare tunnels and streaming responses

The CLI's default Cloudflare tunnel buffers the whole response before sending it, so `defer`/streaming responses won't show incremental updates locally (production is unaffected). Use `--use-localhost` networking mode if you need to test that specifically.

## Resources

- [Shopify App React Router docs](https://shopify.dev/docs/api/shopify-app-react-router)
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)
- [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Bulk Operations](https://shopify.dev/docs/api/usage/bulk-operations/queries)
