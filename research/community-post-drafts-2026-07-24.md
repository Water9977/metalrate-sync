# Community post drafts — ready to use (2026-07-24)

Pre-written so posting is copy-paste-ready whenever you get to each one. Tone matched to each community's actual norms per [social-distribution-channels-2026-07-24.md](social-distribution-channels-2026-07-24.md) — don't reuse one post verbatim across communities, each is written for that specific audience/rule set.

---

## Shopify Community Forums (community.shopify.com) — Shopify-sanctioned, most direct

Post in the "Building apps with Shopify" or "App Store" board (whichever fits at posting time).

**Title**: Built an app for live gold/silver price sync — feedback welcome

Hey everyone — just submitted my first app, MetalRate Sync (listed as "Ounce: MetalRate Sync"), for App Store review. It keeps Shopify product prices synced with live gold/silver/platinum/palladium rates for bullion dealers and jewelers who price by weight — the core problem is that most of these merchants are still repricing their whole catalog by hand every time the market moves, or using a tool that breaks on bulk updates.

What I focused on: a full preview before anything changes (nothing touches your store until you approve it), a per-variant audit trail on every sync, and reliable bulk CSV import for larger catalogs. Built on the React Router template + Polaris web components.

Demo + docs if anyone wants to see it before it clears review: metalratesync.com

Would genuinely love feedback from anyone who's built in this space or sells in this niche — what would you actually want from something like this?

---

## r/ShopifyApps — App Promo (found by user 2026-07-27, best-fit channel)

Better than anything the earlier research turned up: a subreddit built specifically for this, self-promotion explicitly welcome "in both the main feed and comments, as long as it adds value." One real constraint: **only 1 promo post per developer per month** — this is the one shot for the month, and posts that don't fully answer the required template get removed, so every field below is answered in full rather than left thin.

Being upfront that the app isn't installable yet (still under Shopify review) since that's the honest-tone rule this whole outreach effort has followed everywhere else — "Where can I find it?" and "What are you looking for?" are where that's addressed naturally, not hidden.

**Post Title**: MetalRate Sync, an app that keeps Shopify product prices synced to live gold/silver/platinum/palladium rates for bullion dealers and by-weight jewelry sellers.

**What's the app?**
MetalRate Sync automatically reprices Shopify products based on live precious-metal spot rates. You set a formula per product line (metal, purity, making charge, wastage, markup, tax), and the app keeps every tracked product's price aligned with the market — either on a schedule or on demand, with a full preview before anything actually changes.

**Where can I find it?**
Just submitted for Shopify App Store review (listing name will be "Ounce: MetalRate Sync") — not installable yet. Everything's demoed at metalratesync.com in the meantime: a walkthrough video, two raw unedited test-run recordings, and full docs/FAQ, so it can be evaluated before there's an install link to click.

**What problem are you solving?**
Bullion, coin, and by-weight jewelry sellers have to reprice their whole catalog every time the metal market moves — sometimes daily. Most either do it by hand, or use a tool that's unreliable at bulk updates. That's not hypothetical: it's a documented, current complaint on a competing app's own reviews ("customer service is horrible, never respond to anything," posted this month). The bulk-update-at-scale problem specifically is the one I built this around, not just the pricing math (every competitor already does the math fine).

**How does the app work?**
Set a pricing formula (metal, purity, making charge, wastage %, markup, tax, optional rounding/stop-loss). Assign it to a product with its weight. Preview shows exactly what every tracked product's new price would be, old vs. new vs. % change, before anything touches the store. Apply pushes it in Shopify-API-limit-safe batches with retry-on-throttle, and every run — manual or scheduled — writes a full per-variant audit log (updated/skipped/failed, and why, with the exact rate used).

**Who's your target merchant?**
Shopify stores selling bullion/coins/precious metals, or fine jewelry priced by weight (gold/silver per gram or karat) — segments where live repricing isn't optional, it's how the business works.

**How is it different / better than other existing solutions?**
Preview-before-commit (one direct competitor's own marketing site literally lists this as "Coming Soon" — it's not table stakes in this niche yet). Full per-variant audit trail on every run, not just a success/fail count. Reliable bulk CSV import built for large catalogs specifically, using Shopify's Bulk Operations API once a catalog crosses ~2,000 variants instead of just capping out. Stop-loss protection per formula. India city-rate support (Mumbai/Kolkata/Chennai/Bangalore) on every tier, not gated to a premium plan. Native Shopify billing — no separate invoice or external payment step.

**How much does it cost?**
$30/mo Starter (800 SKUs, 2x/day auto-sync) or $50/mo Pro (unlimited SKUs, up to 5x/day), both with a 14-day free trial, billed through Shopify.

**What are you looking for?**
Mainly early feedback and beta interest right now, since it's not installable yet — if this looks useful for your store or a store you know, I'd genuinely value hearing whether the above actually matches a real pain point, and I'm happy to notify anyone interested the moment it clears review.

---

## r/coins — Self-Promotion Thread only (never the main feed)

**Verified live 2026-07-27 against the actual current thread's AutoMod rules** (user pasted them directly). Confirmed this draft is compliant:
- Rule/example #1 explicitly says "promoting/linking your coin-related projects (e.g. apps...)" — self-promoting your own app is the *first listed example* of an appropriate post, not a gray area.
- Rule #8: **max 1-2 top-level comments per day** — post this once, don't repeat it in the same thread or across days.
- Rule #3/#4: no disparaging other tools, no "name and shame" — this draft doesn't reference or compare to any competitor, stays positive.
- Comments may sit pending automod approval for a bit — normal, not a rejection.
- Since these self-promo threads rotate (this one showed as ~25 days old when checked), confirm whichever thread is *currently* pinned/active before posting — don't reply to a stale one.

Post this as a comment/reply inside whatever the current Self-Promotion Thread is when one's live — never as its own post.

Built a Shopify app called MetalRate Sync (App Store listing: "Ounce: MetalRate Sync") for dealers who sell bullion/coins online — syncs your product prices to live spot rates automatically instead of repricing everything by hand. Preview before it applies anything, full audit log of every change, handles big catalogs via bulk CSV import. Just submitted it for Shopify App Store review this week. If you run a Shopify store and this sounds useful, the demo/docs are up at metalratesync.com — happy to answer questions here too.

---

## r/SomebodyMakeThis — Creator Showcase (monthly thread)

Frame as "I made this" in response to the general need, not tied to one specific old post unless you find a real match.

**I made**: a Shopify app that auto-updates product prices from live gold/silver/platinum/palladium rates

Saw a lot of small bullion/jewelry sellers on Shopify manually repricing their whole catalog every time the metal market moves (sometimes daily). Built MetalRate Sync to handle it — set a pricing formula once (metal, purity, your markup), and it keeps every priced-by-weight product in sync automatically, with a full preview before anything changes and an audit log of every run.

Just submitted it for Shopify App Store review. Demo video + walkthroughs at metalratesync.com if anyone wants to see it in action. Open to feedback, especially from anyone who's dealt with this problem themselves.

---

## Indie Hackers — launch/build-in-public post

**Title**: Built a Shopify app for bullion & jewelry sellers who price by weight — just submitted for App Store review

The problem: Shopify stores selling gold/silver bullion, coins, or jewelry priced by weight have to reprice their whole catalog every time the metal market moves — often daily. Most either do it by hand, or use a tool that's flaky at bulk updates (this is a real, documented complaint on competing apps' reviews — one recent one: "customer service is horrible, never respond to anything").

What I built — MetalRate Sync (App Store listing name "Ounce: MetalRate Sync"):
- Set a pricing formula once (metal, purity, making charge, markup, tax)
- Full preview before anything changes — old price, new price, % change, per variant
- Automatic sync on a schedule, or manual — either way every run gets a full audit log
- Bulk CSV import so a large catalog isn't a one-by-one slog
- Handles gram/troy-oz/tola/vori/pennyweight — built with an international niche in mind, not just US units

Status: just submitted for Shopify App Store review this week. Zero installs from marketing yet — this is literally day one of trying to get this in front of the right people. Demo video + 2 raw test-run walkthroughs + docs: metalratesync.com

Would love feedback, especially from anyone who's tried marketing a niche B2B Shopify app before — this is my first one and I'm learning the distribution side as I go.

---

## App Store listing keyword refresh (for you to paste into the Dev Dashboard)

Direct competitor "Precious Metal Product Prices" (nFusion Solutions) ranks on: **Bullion Prices, Precious Metal Price, Spot Price, Wholesalers**. Worth working these phrases naturally into the listing's title/tagline/description so MetalRate Sync competes for the same discovery searches. Suggested tagline variants to consider (pick one, don't force all the keywords into one sentence):

- "Live spot price sync for bullion, coins & precious metal jewelry"
- "Keep your Shopify prices at today's spot price — gold, silver, platinum, palladium"

Work "spot price," "bullion," and "precious metal" naturally into the first paragraph of the long description too — that's typically what App Store search weighs most.
