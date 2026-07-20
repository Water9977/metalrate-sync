import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "metalratesync@gmail.com";

const TICKS = [
  { metal: "GOLD", price: "4,017.99", dir: "up" as const },
  { metal: "SILVER", price: "55.91", dir: "up" as const },
  { metal: "PLATINUM", price: "1,597.66", dir: "down" as const },
  { metal: "PALLADIUM", price: "1,249.71", dir: "up" as const },
];

const FEATURES = [
  {
    icon: "ƒ",
    title: "Pricing formulas",
    body: (
      <>
        <code>weight × purity × live rate</code>, plus your making charges,
        wastage, markup and tax. Karat presets from 24K to sterling. One
        formula per product line, reused everywhere.
      </>
    ),
  },
  {
    icon: "◎",
    title: "Preview before commit",
    body: (
      <>
        Every sync starts as a dry run: current price, new price, % change for
        every variant. Nothing touches your store until you click Apply — and
        what you approved is exactly what gets applied.
      </>
    ),
  },
  {
    icon: "≡",
    title: "Audit trail on every run",
    body: (
      <>
        Every sync logs every variant: updated, skipped, or failed — and why —
        with the exact rates used. When a price changes, you can always answer
        “what happened, and at what rate?”
      </>
    ),
  },
  {
    icon: "⇪",
    title: "Bulk import by SKU",
    body: (
      <>
        Download your catalog as a CSV, set weights and formulas in Excel,
        upload once. Rows the app can’t match are reported, not silently
        dropped. Built for thousand-SKU catalogs.
      </>
    ),
  },
  {
    icon: "↻",
    title: "Automatic sync",
    body: (
      <>
        Prices reprice on a fixed schedule with no one at the keyboard. A
        stop-loss floor per formula holds prices if the market falls through
        your cost.
      </>
    ),
  },
  {
    icon: "◈",
    title: "Four metals, your units",
    body: (
      <>
        Gold, silver, platinum, palladium. Weights in grams, troy ounces,
        pennyweight, tola or vori. Prefer your own board rate? Manual entry
        mode is built in.
      </>
    ),
  },
];

const SHOTS = [
  {
    src: "/images/shot-dashboard.png",
    kicker: "Dashboard",
    title: "The market, at a glance",
    body: "Live rates for all four metals, your last sync's outcome, and what's tracked — the first screen you see, with nothing buried.",
    alt: "MetalRate Sync dashboard in Shopify admin showing live gold, silver, platinum and palladium rate cards and last sync summary",
  },
  {
    src: "/images/shot-formulas.png",
    kicker: "Formulas",
    title: "Your pricing recipe, spelled out",
    body: "Metal, purity, making charge, wastage, markup, tax, rounding, stop-loss. Every number visible, nothing hidden in an algorithm.",
    alt: "New pricing formula editor with metal, purity, making charge, markup, tax, rounding and stop-loss fields",
  },
  {
    src: "/images/shot-import.png",
    kicker: "Bulk import",
    title: "A whole catalog in one upload",
    body: "Export, edit in your spreadsheet, re-upload. Matched by SKU, with a report of anything that didn't match instead of silence.",
    alt: "Bulk import screen with CSV download and upload steps",
  },
  {
    src: "/images/shot-history.png",
    kicker: "History",
    title: "Every run, on the record",
    body: "Updated, skipped, failed — per variant, per run, with the rate snapshot each price came from.",
    alt: "Sync history table listing runs with updated, skipped and failed counts",
  },
  {
    src: "/images/shot-settings.png",
    kicker: "Settings",
    title: "Set it once, then forget it",
    body: "Pick a rate source, a currency, and whether to sync automatically. That's the whole settings page — on purpose.",
    alt: "Settings page with rate source provider, base currency and automatic sync schedule",
  },
];

const FAQS = [
  {
    q: "Do I need my own rate feed or API key?",
    a: "No. Live gold, silver, platinum and palladium rates are included with the app — you pick a currency and you're done. If you price off your own board rate instead (IBJA, in-house), Manual entry mode takes your numbers.",
  },
  {
    q: "Can the app change my prices without me knowing?",
    a: "Only if you turn on automatic sync — and even then, every run is logged per variant in History with the rates used. Manual mode always shows you the full preview first, and applies exactly what you approved, not a recomputed version.",
  },
  {
    q: "What happens if the metal market drops through my cost?",
    a: "Each formula can set a stop-loss floor per gram. If the live rate falls below it, affected products are held at their current price and flagged in the preview instead of being repriced downward.",
  },
  {
    q: "I weigh in tola / vori / pennyweight — supported?",
    a: "Yes. Grams, troy ounces, pennyweight (dwt), tola and vori are supported on the product page and as CSV columns (weight_tola, weight_vori, and so on). Conversion happens once, at entry.",
  },
  {
    q: "Does the app read my customers' data?",
    a: "No. The app requests one permission: writing product prices. It stores your pricing configuration and sync history — no customer names, addresses, orders, or payment data, ever.",
  },
];

function Ticker() {
  return (
    <div className="ticker" aria-label="Metal spot rates">
      <div className="ticker-inner">
        {TICKS.map((t) => (
          <div className="tick" key={t.metal}>
            <span className="tick-metal">{t.metal}</span>
            <span className="tick-price">${t.price}</span>
            <span
              className={`tick-dir ${t.dir}`}
              aria-label={t.dir === "up" ? "rising" : "falling"}
            >
              {t.dir === "up" ? "▲" : "▼"}
            </span>
          </div>
        ))}
      </div>
      <p className="ticker-caption">
        USD / troy oz · sample rates — live inside the app
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <nav className="nav" aria-label="Main">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <Image src="/images/logo.png" alt="" width={30} height={30} />
            MetalRate Sync
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#screens">Inside the app</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="nav-cta" href="#get">
            Get notified
          </a>
        </div>
      </nav>

      <main>
        <header className="hero">
          <div className="wrap">
            <div className="hero-visual">
              <Image
                src="/images/hero-feature.png"
                alt="Gold, silver, platinum and palladium on dark pedestals with price direction markers"
                width={1586}
                height={900}
                sizes="(max-width: 1200px) 100vw, 1040px"
                priority
              />
            </div>
            <div className="hero-copy">
              <p className="eyebrow">
                Shopify app · bullion &amp; by-weight jewelry
              </p>
              <h1>
                Spot moves. Your store <em>follows.</em>
              </h1>
              <p className="hero-sub">
                MetalRate Sync reprices your whole Shopify catalog from live
                gold, silver, platinum and palladium rates —{" "}
                <strong>and shows you every change before it happens.</strong>
              </p>
              <div className="hero-ctas">
                <a className="btn-primary" href="#get">
                  Launching soon on the Shopify App Store
                </a>
                <a className="btn-ghost" href="#features">
                  See how it works
                </a>
              </div>
              <p className="hero-note">
                14-day free trial at launch · no rate-feed subscription needed
              </p>
            </div>
          </div>
          <Ticker />
        </header>

        <section className="section" aria-labelledby="trust-heading">
          <div className="wrap">
            <div className="section-head">
              <h2 id="trust-heading">
                Repricing you can <em>defend</em>
              </h2>
              <p>
                When the metal market moves, your margins move with it — unless
                your prices do. Most rate-sync apps change prices silently and
                hope. This one is built on the opposite premise.
              </p>
            </div>
            <div className="pillars">
              <div className="pillar">
                <span className="pillar-flag">Before</span>
                <h3>You see every change first</h3>
                <p>
                  A full preview — old price, new price, % change, per variant.
                  Apply is a decision, not a surprise.
                </p>
              </div>
              <div className="pillar">
                <span className="pillar-flag">During</span>
                <h3>Applied exactly as approved</h3>
                <p>
                  The prices you approve are the prices that ship. If rates
                  moved meanwhile, the app asks you to look again instead of
                  quietly substituting new numbers.
                </p>
              </div>
              <div className="pillar">
                <span className="pillar-flag">After</span>
                <h3>Every run on the record</h3>
                <p>
                  Per-variant audit trail with the exact rates used. Updated,
                  skipped, failed — and why. No silent failures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section"
          id="features"
          aria-labelledby="features-heading"
        >
          <div className="wrap">
            <div className="section-head">
              <h2 id="features-heading">
                Everything a metal desk needs.
                <br />
                Nothing it doesn&apos;t.
              </h2>
            </div>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div className="feature" key={f.title}>
                  <div className="feature-icon" aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
            <div className="formula-strip" aria-label="Pricing formula">
              <span className="f-dim">price =</span> weight{" "}
              <span className="f-hl">×</span> purity{" "}
              <span className="f-hl">×</span> live&nbsp;rate{" "}
              <span className="f-hl">+</span> making{" "}
              <span className="f-hl">+</span> wastage{" "}
              <span className="f-hl">+</span> markup{" "}
              <span className="f-hl">+</span> tax{" "}
              <span className="f-dim">→ rounded your way</span>
            </div>
          </div>
        </section>

        <section
          className="section"
          id="screens"
          aria-labelledby="screens-heading"
        >
          <div className="wrap">
            <div className="section-head">
              <h2 id="screens-heading">
                Inside the app — <em>native</em> to Shopify admin
              </h2>
              <p>
                No external dashboard, no second login. MetalRate Sync lives
                where your catalog already lives.
              </p>
            </div>
            <div className="shots">
              {SHOTS.map((s) => (
                <div className="shot" key={s.kicker}>
                  <div className="shot-img">
                    <Image
                      src={s.src}
                      alt={s.alt}
                      width={1913}
                      height={911}
                      sizes="(max-width: 1200px) 100vw, 1120px"
                    />
                  </div>
                  <div className="shot-copy">
                    <span className="kicker">{s.kicker}</span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section"
          id="pricing"
          aria-labelledby="pricing-heading"
        >
          <div className="wrap">
            <div className="section-head">
              <h2 id="pricing-heading">
                Costs less than one <em>mispriced</em> chain
              </h2>
              <p>
                Both plans include live rates for all four metals — no separate
                rate-feed subscription, no per-request charges.
              </p>
            </div>
            <div className="pricing-grid">
              <div className="plan">
                <p className="plan-name">Starter</p>
                <p className="plan-price">
                  $30<span> / month</span>
                </p>
                <p className="plan-trial">14-day free trial</p>
                <ul>
                  <li>Up to 500 SKUs</li>
                  <li>Automatic sync twice a day</li>
                  <li>All formula features, incl. stop-loss</li>
                  <li>Bulk CSV import &amp; export</li>
                  <li>Full audit-trail history</li>
                </ul>
                <a className="btn-ghost" href="#get">
                  Get notified
                </a>
              </div>
              <div className="plan featured">
                <p className="plan-name">Pro</p>
                <p className="plan-price">
                  $50<span> / month</span>
                </p>
                <p className="plan-trial">14-day free trial</p>
                <ul>
                  <li>Unlimited SKUs</li>
                  <li>Automatic sync up to 5× a day</li>
                  <li>Everything in Starter</li>
                  <li>India city rates (gold &amp; silver)</li>
                  <li>Priority support</li>
                </ul>
                <a className="btn-primary" href="#get">
                  Get notified
                </a>
              </div>
            </div>
            <p className="pricing-note">
              Billed through Shopify with your existing subscription — no card
              details entered anywhere else. Prices shown are launch pricing
              and may change before general availability.
            </p>
          </div>
        </section>

        <section className="section" id="faq" aria-labelledby="faq-heading">
          <div className="wrap">
            <div className="section-head">
              <h2 id="faq-heading">Questions dealers actually ask</h2>
            </div>
            <div className="faq">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="final" id="get" aria-labelledby="get-heading">
          <div className="wrap">
            <h2 id="get-heading">
              Stop repricing <em>by hand.</em>
            </h2>
            <p>
              MetalRate Sync is launching soon on the Shopify App Store.
              <br />
              Want early access, or first word when it&apos;s live?
            </p>
            <a
              className="btn-primary"
              href={`mailto:${CONTACT_EMAIL}?subject=MetalRate%20Sync%20early%20access`}
            >
              Ask for early access
            </a>
            <p className="final-mail">
              or write to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-brand">
            <Image src="/images/logo.png" alt="" width={22} height={22} />
            MetalRate Sync
          </span>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span className="footer-tag">
            Built for people who sell metal by weight. ©{" "}
            {new Date().getFullYear()} MetalRate Sync
          </span>
        </div>
      </footer>
    </>
  );
}
