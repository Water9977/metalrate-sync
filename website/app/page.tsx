import Image from "next/image";
import Link from "next/link";
import { getLiveRates, type LiveTick } from "./lib/rates";

const CONTACT_EMAIL = "metalratesync@gmail.com";
const APP_STORE_URL = "https://apps.shopify.com/metalrate-sync";

// Shown only if the live fetch fails or the key isn't configured — never
// silently blank, never presented as live when it isn't.
const FALLBACK_TICKS: LiveTick[] = [
  { metal: "GOLD", price: "4,017.99" },
  { metal: "SILVER", price: "55.91" },
  { metal: "PLATINUM", price: "1,597.66" },
  { metal: "PALLADIUM", price: "1,249.71" },
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
    title: "Bulk import, no SKUs needed",
    body: (
      <>
        Download your catalog as a CSV, set weights and formulas in Excel,
        upload once. Products are matched automatically, so you never have to
        create SKUs. Rows the app can’t match are reported, not silently
        dropped. Built for thousand-product catalogs.
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
    body: "Export, edit in your spreadsheet, re-upload. Products match automatically, no SKUs required, with a report of anything that didn't match instead of silence.",
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

const WALKTHROUGH_YOUTUBE_ID = "IgCd8v6jm5k";
const WALKTHROUGH_LOOMS = [
  { id: "bcb859e66b9e4b7aa8ed44bf4591608b", label: "Live test, part 1 — formulas & product setup" },
  { id: "d41444a3f9734e62b91e0a6bc041f80a", label: "Live test, part 2 — preview, sync & history" },
];

const FAQS = [
  {
    q: "Do I need my own rate feed or API key?",
    a: "No. Live gold, silver, platinum and palladium rates are included with the app — you pick a currency and you're done. If you price off your own board rate instead (IBJA, in-house), Manual entry mode takes your numbers.",
  },
  {
    q: "How often do prices update, and is it automatic?",
    a: "Two ways: open Preview & Sync any time and apply changes yourself, or turn on automatic sync and the app reprices in the background — twice a day on Starter, up to five times a day on Pro. Either way, every run is logged.",
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
    q: "How big a catalog can it handle?",
    a: "Starter tracks up to 800 products (variants), Pro is unlimited. Bulk import automatically switches to Shopify's Bulk Operations API for large catalogs, so a store with thousands of products is read reliably instead of timing out.",
  },
  {
    q: "Do I need SKUs on my products?",
    a: "No. Bulk import matches your products by their Shopify ID, which every product already has, so a store with no SKUs at all can export its catalog, fill in weights and formulas, and re-upload. SKUs are optional.",
  },
  {
    q: "Can I show live gold and silver prices on my storefront?",
    a: "Yes. The app includes a storefront ticker you add from your theme editor, with no code. Choose a scrolling strip or static cards, which metals to show, and your own colors. It works on older themes too, through the theme editor's App embeds panel. It's included on both plans.",
  },
  {
    q: "Can I price in Indian rupees?",
    a: "Yes. Set your base currency to INR in Settings and live rates are converted for you, so a store selling in rupees prices in rupees. Same for any other currency your store already sells in.",
  },
  {
    q: "Does the app read my customers' data?",
    a: "No. The app requests one permission: writing product prices. It stores your pricing configuration and sync history — no customer names, addresses, orders, or payment data, ever.",
  },
];

function Ticker({ ticks, isLive, fetchedAt }: TickerProps) {
  // Duplicated once for a seamless translateX(-50%) loop — same technique
  // as the actual in-app storefront ticker. Server-rendered, so both copies
  // are present in the initial HTML; no hydration mismatch.
  const loop = [...ticks, ...ticks];
  return (
    <div className="ticker" aria-label="Metal spot rates — live gold, silver, platinum and palladium prices">
      <div className="ticker-viewport">
        <div className="ticker-track">
          {loop.map((t, i) => (
            <div className="tick" key={`${t.metal}-${i}`}>
              <span className="tick-metal">{t.metal}</span>
              <span className="tick-price">${t.price}</span>
              {isLive && (
                <span className="tick-live" aria-label="live" title="Live rate">
                  ●
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="ticker-caption">
        {isLive
          ? `USD / troy oz · live rate, refreshed a few times daily${
              fetchedAt
                ? ` · as of ${fetchedAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}`
                : ""
            }`
          : "USD / troy oz · sample rates — live inside the app"}
      </p>
      <p className="ticker-app-note">
        You can also have this ticker installed on your own store with{" "}
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          our app
        </a>
        .
      </p>
    </div>
  );
}

interface TickerProps {
  ticks: LiveTick[];
  isLive: boolean;
  fetchedAt: Date | null;
}

// Real oEmbed metadata (title, thumbnail, provider) fetched directly from
// YouTube/Loom for the three videos below — nothing here is invented, so if
// a video is ever swapped out this schema will silently go stale until
// someone re-fetches it. Deliberately no uploadDate: Google's oEmbed
// responses don't include it and we don't have a paid Data API key to look
// it up for real, so we omit the field rather than fabricate a date.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const videoJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Showcasing Metal Rate Sync",
    description:
      "From formula to a live price change: set a pricing formula, assign it to a product, preview the diff against a live rate, then apply it and watch the price actually update in the store.",
    thumbnailUrl: "https://i.ytimg.com/vi/IgCd8v6jm5k/hqdefault.jpg",
    embedUrl: `https://www.youtube-nocookie.com/embed/${WALKTHROUGH_YOUTUBE_ID}`,
    publisher: { "@type": "Organization", name: "MetalRate Sync" },
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Metal Rate Sync Testing 1",
    description: "Live test, part 1 — formulas & product setup.",
    thumbnailUrl:
      "https://cdn.loom.com/sessions/thumbnails/bcb859e66b9e4b7aa8ed44bf4591608b-50122224de6ee74e.gif",
    embedUrl: "https://www.loom.com/embed/bcb859e66b9e4b7aa8ed44bf4591608b",
    duration: "PT2M6S",
    publisher: { "@type": "Organization", name: "MetalRate Sync" },
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Metal Rate Sync Testing 2",
    description: "Live test, part 2 — preview, sync & history.",
    thumbnailUrl:
      "https://cdn.loom.com/sessions/thumbnails/d41444a3f9734e62b91e0a6bc041f80a-d8108fbd87449b60.gif",
    embedUrl: "https://www.loom.com/embed/d41444a3f9734e62b91e0a6bc041f80a",
    duration: "PT1M25S",
    publisher: { "@type": "Organization", name: "MetalRate Sync" },
  },
];

export default async function Home() {
  const live = await getLiveRates();
  const ticks = live?.ticks ?? FALLBACK_TICKS;
  const isLive = Boolean(live);
  const fetchedAt = live?.fetchedAt ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {videoJsonLd.map((v) => (
        <script
          key={v.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(v) }}
        />
      ))}
      <nav className="nav" aria-label="Main">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <Image src="/images/logo.png" alt="" width={30} height={30} />
            Ounce: MetalRate Sync
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#screens">Inside the app</a>
            <a href="#demo">Watch it work</a>
            <a href="#pricing">Pricing</a>
            <Link href="/docs">Docs</Link>
          </div>
          <a
            className="nav-cta"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Install on Shopify
          </a>
        </div>
      </nav>

      <main>
        <header className="hero">
          <div className="wrap">
            <div className="hero-visual">
              <Image
                src="/images/hero-feature.png"
                alt="MetalRate Sync — palladium, gold, silver and platinum nuggets"
                width={1600}
                height={900}
                sizes="(max-width: 1200px) 100vw, 1040px"
                priority
              />
            </div>
            <div className="hero-copy">
              <p className="eyebrow">
                Shopify gold &amp; silver price sync · bullion &amp; by-weight
                jewelry
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
                <a
                  className="btn-primary"
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install on the Shopify App Store
                </a>
                <a className="btn-ghost" href="#features">
                  See how it works
                </a>
              </div>
              <p className="hero-note">
                14-day free trial · no rate-feed subscription needed
              </p>
              <p className="hero-note hero-note-store">
                Live on the Shopify App Store as{" "}
                <strong>Ounce: MetalRate Sync</strong>
              </p>
            </div>
          </div>
          <Ticker ticks={ticks} isLive={isLive} fetchedAt={fetchedAt} />
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
          id="storefront-ticker"
          aria-labelledby="ticker-heading"
        >
          <div className="wrap">
            <div className="section-head">
              <h2 id="ticker-heading">
                Show live metal prices on <em>your storefront</em>
              </h2>
              <p>
                The same ticker you see at the top of this page, on your own
                store. Add it from the theme editor, no code, on both plans.
              </p>
            </div>
            <div className="pillars">
              <div className="pillar">
                <span className="pillar-flag">Your style</span>
                <h3>Scrolling strip or static cards</h3>
                <p>
                  Pick which of the four metals to show, whether to display the
                  change since the last update, and set your own colors to match
                  your theme.
                </p>
              </div>
              <div className="pillar">
                <span className="pillar-flag">Any theme</span>
                <h3>Works on older themes too</h3>
                <p>
                  On newer themes, add it as a section. On older themes, turn
                  it on from the theme editor&apos;s App embeds panel. Either
                  way you never touch your theme code.
                </p>
              </div>
              <div className="pillar">
                <span className="pillar-flag">One source</span>
                <h3>Same rate feed as your pricing</h3>
                <p>
                  The ticker reads the same live rate feed your formulas use, so
                  there is one source of truth. It fails quietly and stays
                  hidden if rates are ever unavailable.
                </p>
              </div>
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

        <section className="section" id="demo" aria-labelledby="demo-heading">
          <div className="wrap">
            <div className="section-head">
              <h2 id="demo-heading">
                Watch it <em>actually work</em>
              </h2>
              <p>
                No slides, no mockups — a real store, real rates, real prices
                changing. The full walkthrough first, then the unedited
                testing sessions it was cut from.
              </p>
            </div>

            <div className="demo-featured">
              <div className="video-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${WALKTHROUGH_YOUTUBE_ID}`}
                  title="MetalRate Sync — full walkthrough"
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="demo-featured-copy">
                <span className="kicker">Full walkthrough · 2:50</span>
                <h3>From formula to a live price change</h3>
                <p>
                  Set a pricing formula, assign it to a product, preview the
                  diff against a live rate, then apply it and watch the price
                  actually update in the store — start to finish, in under
                  three minutes.
                </p>
              </div>
            </div>

            <div className="demo-grid">
              {WALKTHROUGH_LOOMS.map((v) => (
                <div className="demo-card" key={v.id}>
                  <div className="video-frame">
                    <iframe
                      src={`https://www.loom.com/embed/${v.id}`}
                      title={v.label}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <p className="demo-card-label">{v.label}</p>
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
                  <li>Up to 800 SKUs</li>
                  <li>Automatic sync twice a day</li>
                  <li>All formula features, incl. stop-loss</li>
                  <li>Bulk CSV import &amp; export</li>
                  <li>Full audit-trail history</li>
                  <li>Storefront rate ticker</li>
                </ul>
                <a
                  className="btn-ghost"
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start free trial
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
                  <li>Priority support</li>
                </ul>
                <a
                  className="btn-primary"
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start free trial
                </a>
              </div>
            </div>
            <p className="pricing-note">
              Billed through Shopify with your existing subscription — no card
              details entered anywhere else.
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
            <p className="faq-more">
              More questions? <Link href="/docs#faq">Read the full docs</Link>
            </p>
          </div>
        </section>

        <section className="final" id="get" aria-labelledby="get-heading">
          <div className="wrap">
            <h2 id="get-heading">
              Stop repricing <em>by hand.</em>
            </h2>
            <p>
              MetalRate Sync is live on the Shopify App Store.
              <br />
              Install it and preview your first repricing in minutes.
            </p>
            <a
              className="btn-primary"
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Install on the Shopify App Store
            </a>
            <p className="final-mail">
              Questions first? Write to{" "}
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
          <Link href="/docs">Docs</Link>
          <Link href="/blog">Blog</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span className="footer-tag">
            Built for people who sell metal by weight. ©{" "}
            {new Date().getFullYear()} MetalRate Sync · listed on the Shopify
            App Store as <strong>Ounce: MetalRate Sync</strong>
          </span>
        </div>
      </footer>
    </>
  );
}
