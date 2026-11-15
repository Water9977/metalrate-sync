hey all 👋 been heads down on a Shopify app for a few months and it just went live, figured I'd share

it's called **MetalRate Sync** — reprices a whole store's catalog off live gold/silver/platinum/palladium rates. built for bullion dealers and by-weight jewelry sellers who currently reprice by hand every time the market moves (which is... constantly). formula builder (weight × purity × live rate + making charge + wastage + markup), a real preview-before-you-commit diff, full audit trail, bulk CSV import for big catalogs.

also shipped a storefront ticker as a theme app extension — the little scrolling live-price bar you see on bullion sites — customizable colors/style right from the theme editor, works on both old and new Shopify themes.

stack-wise: React Router (Remix-flavored), Prisma/Postgres on Railway, Shopify's app proxy + theme app extensions for the storefront piece.

site: https://metalratesync.com
Shopify listing: https://apps.shopify.com/metalrate-sync

happy to talk through any of the build if anyone's curious, this was a fun one
