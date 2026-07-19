# Draft email — MetalRate Sync demo, for Chris (Liquid Bullion)

Subject: MetalRate Sync — live demo + would love your take

---

Hi Chris,

Following up on our earlier conversation — MetalRate Sync is live and I wanted to show you where it's at rather than just describe it.

Two short walkthroughs:

1. **[Loom 1 — link]** — creating a pricing formula, assigning it to a product, and running Preview & Sync (the part I know matters most to you: nothing touches your store until you approve it).
2. **[Loom 2 — link]** — dashboard and the live price update landing in Shopify admin.

Screenshot attached of the bulk import screen — this is the one built specifically around what you described with your current app: download your catalog as a CSV, edit weights/formulas in Excel, re-upload, and it matches by SKU and reports anything it couldn't find instead of failing quietly.

A few things worth knowing honestly, not glossing over:
- No billing set up yet — this is a free design-partner build for you, not something I'd charge you for at this stage.
- It's on a real persistent server now (not a demo tunnel), so it's stable to actually try against a few real SKUs whenever you want.
- Still pre-launch — happy to move at whatever pace makes sense for you, no pressure.

On pricing, once this is ready for other stores: thinking **$30/mo for up to 500 SKUs with syncing twice a day**, or **$50/mo unlimited SKUs with up to 5x/day syncing and priority support**. Wanted your gut check on that before it's locked in, since you're the one person who's actually lived with what this problem costs.

And honestly — you're the reason this exists, so I'd rather hear it from you now than guess: what would make this actually better for how Liquid Bullion runs day to day? Anything the demo's missing, anything that'd make you switch off your current app for real?

Appreciate you taking the time either way.

[Your name]

---

## Notes for you (not part of the email)

- Fill in the two Loom links before sending.
- Consider recording a short 3rd clip (or narrating live) that actually runs the bulk import — right now you have a screenshot of the upload screen but no walkthrough of it matching SKUs and reporting results, which is the single feature most directly tied to his stated pain (see architecture.md "Demo readiness note").
- Same for History/audit trail — not shown in either Loom per your description; it's the other core differentiator vs. Gold Feed Inc.'s "silent failures" reputation. Worth at least mentioning by name even if not walked through on camera.
- Pricing numbers above ($30/500 SKU/2x-day, $50/unlimited/5x-day) match what's now in architecture.md as of 2026-07-19 — sanity-checked against Metal Updater's $34.99/$49.99 tiers, the closest real competitor analog.
