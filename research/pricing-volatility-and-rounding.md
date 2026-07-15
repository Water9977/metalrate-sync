# Pricing volatility and rounding research (2026-07-16)

Question this answers: a jewelry store owner sets a 22K gold chain at $220. Gold ticks up or down a little. Does the price now show $217 or $223, and does that look broken? How should the app handle jewelry stores (want clean numbers) versus bullion stores (want exact tracking)?

## Real volatility numbers

Source: Barchart ADR/ATR for gold, silver, platinum futures, and CBOE GVZ (gold volatility index), pulled mid July 2026.

| Metal | Spot (mid Jul 2026) | Typical daily range | Volatile day |
|---|---|---|---|
| Gold | ~$4,050/oz | 2.3% to 2.5% | 3% to 4%, spikes 6%+ |
| Silver | ~$58.5/oz | 4.7% to 6.5% | can exceed 12% in extreme sessions |
| Platinum | ~$1,660/oz | 3.5% to 5.0% | 5% to 12% |

On $200 of gold content specifically: expect roughly **$3 to $8 of movement on a normal day, $10 to $15 or more on a volatile one**. Silver and platinum swing proportionally more than gold.

Context: 2026 has been an unusually volatile year for metals. Gold spiked past $5,100/oz in January 2026, then crashed in what forex.com called the largest single day loss on record for XAU/USD, settling around $4,050 by mid July. So current swings are somewhat elevated versus long run history, not unusually calm.

Bullion dealers update prices continuously during market hours. APMEX and JM Bullion both describe spot prices changing every few seconds to minutes, essentially in real time, not batched hourly or daily. JM Bullion locks a price for about 10 minutes at checkout specifically to protect against mid transaction moves. Different dealers commonly show slightly different spot quotes (1 to 2 percent apart) due to feed timing differences, there is no single universally agreed number at any instant.

Jewelry industry practice (found in retailer interviews, not a formal published standard): most jewelers do not reprice tagged floor inventory daily. They wait for a cumulative move, described qualitatively as "a couple hundred dollar moves" or "20 percent plus," and absorb day to day noise into margin. Generic by weight items like plain chains are the main category where a live spot linked price actually gets quoted, usually at the point of sale rather than on a printed tag.

## Real store pricing patterns

### Bullion and coin dealers (13 sites checked)

APMEX, JM Bullion, SD Bullion, Kitco, Money Metals Exchange, BGASC, AmFed Coin and Bullion, Great Lakes Coin, Metalstacks, Great American Coin Company, Sprott Money, Provident Metals, The Scoin Shop, and Liquid Bullion (design partner Chris's own store).

Every single one shows exact cent pricing, no exceptions, including on items under $100. Most run a persistent live ticker (gold/silver/platinum/palladium bid and change) on every page. Nearly all explicitly disclose a dollar premium over spot ("$196.99 per oz over spot"), which by nature requires cent level precision.

### Jewelry stores (9 sites checked)

Two very different groups showed up.

Fixed price demi fine brands that do not track spot at all: Ana Luisa, Mejuri, Catbird, Vrai. These land on clean numbers, often multiples of $5 or $10, because the price is hand set by a merchandiser, not computed from a live rate. No price update messaging exists because there is nothing to update.

Real by weight gold sellers, the actual target segment for this app: BlueStone, Melorra, PNG Jewellers (all India), CRM Jewelers (US, a real Shopify store, GPE app reviewer), Orionz (also a real Shopify store). These show fully arbitrary, uncleaned prices straight out of the weight times rate plus making charge formula. BlueStone and Melorra show arbitrary rupee amounts with no rounding at all. CRM Jewelers rounds only to the nearest whole dollar, never to a clean step like 5 or 10 or 25. None of them hide the fact that the price is rate driven, instead they build trust through a visible "today's gold rate" ticker (PNG Jewellers) or an explicit making charge discount badge (Melorra) rather than through a tidy looking number.

## What this means for the app

The instinct that "$217 versus $223 looks broken" is reasonable but not what the actual target market (real by weight sellers) does today. They accept the arbitrary number and use visible rate transparency to justify it instead of smoothing the price. Bullion dealers definitely want exact tracking with no rounding at all.

Decision: default the app to exact pricing with no minimum change threshold, matching what real competitors and real by weight sellers already do. Offer rounding to a clean step (5, 10, 25, and so on) and a minimum change threshold as an **opt in** setting per formula, for merchants who specifically want clean numbers. This is still a real differentiator since no competitor app offers configurable step rounding or a change threshold at all, it just should not be forced on by default since that would be an out of category choice for the segment being targeted first.

Implemented in `PricingFormula.roundingStep`, `PricingFormula.endsIn99`, and `PricingFormula.minChangeAmount`, see [pricing.server.ts](../metalrate-sync/app/services/pricing.server.ts).
