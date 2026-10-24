import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "metalratesync@gmail.com";

export const metadata: Metadata = {
  title: "Documentation & guide",
  description:
    "Formulas, weight units, rate sources, bulk import, automatic sync, plans and FAQs for bullion and by-weight jewelry sellers on Shopify.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "MetalRate Sync — Documentation & guide",
    description:
      "Formulas, weight units, rate sources, bulk import, automatic sync, plans, and a full FAQ for bullion and by-weight jewelry sellers.",
    url: "https://metalratesync.com/docs",
  },
};

const TOC = [
  { id: "quick-start", label: "Quick start" },
  { id: "formulas", label: "Formulas" },
  { id: "weight-units", label: "Weight units" },
  { id: "rate-sources", label: "Rate sources" },
  { id: "preview-sync", label: "Preview & Sync" },
  { id: "bulk-import", label: "Bulk import" },
  { id: "automatic-sync", label: "Automatic sync" },
  { id: "storefront-ticker", label: "Storefront ticker" },
  { id: "history", label: "History & audit trail" },
  { id: "plans", label: "Plans & limits" },
  { id: "faq", label: "FAQ" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "support", label: "Support" },
];

const FAQS = [
  {
    q: "Do I need my own rate feed or API key?",
    a: "No. Live gold, silver, platinum and palladium rates are included with the app — you pick a currency and you're done. There's nothing to sign up for and no separate rate-feed bill. If you'd rather price off your own board rate (IBJA, an in-house desk number), Manual entry mode lets you type your own per-gram rate instead.",
  },
  {
    q: "Which metals and purities are supported?",
    a: "Gold, silver, platinum and palladium. Purity ships with presets for 24K/fine (0.999), 22K (0.916), 18K (0.750), 14K (0.585), 10K (0.417), sterling 925 (0.925) and bullion .9999 (1.0) — and you can type any custom purity factor if yours isn't in the list.",
  },
  {
    q: "How often do prices update, and is it automatic?",
    a: "Two ways. Manual: open Preview & Sync any time, see every proposed change, and click Apply. Automatic: turn on the schedule and the app reprices in the background on its own — twice a day on Starter, up to five times a day on Pro. The frequency is set by your plan; you don't have to configure a cron.",
  },
  {
    q: "Can the app change my prices without me knowing?",
    a: "Only if you turn on automatic sync — and even then, every single run is logged in History, per variant, with the exact rate used. In manual mode the app never changes a price until you've seen the full preview and clicked Apply, and it applies exactly the numbers you approved, not a freshly recomputed set.",
  },
  {
    q: "When the metal rate changes, does my sell price update too?",
    a: "Yes. Each tracked product runs through its assigned formula every time you preview or sync, so the price reflects the current rate plus your making charges, wastage, markup and tax — automatically.",
  },
  {
    q: "What happens if the metal market drops through my cost?",
    a: "Each formula can set a stop-loss rate per gram. If the live rate falls below it, affected products are held at their current price and flagged in the preview instead of being repriced downward — so a sudden crash doesn't gut your margins before you've had a chance to react.",
  },
  {
    q: "I weigh in tola / vori / pennyweight — is that supported?",
    a: "Yes. Grams, troy ounces, pennyweight (dwt), tola and vori are all supported, both on the product page and as CSV columns (weight_tola, weight_vori, weight_troy_oz, weight_dwt). Conversion to grams happens once, at the moment you enter the weight.",
  },
  {
    q: "How big a catalog can it handle?",
    a: "Starter tracks up to 800 products (variants); Pro is unlimited. Bulk import matches against your live Shopify catalog, and for large stores it automatically uses Shopify's Bulk Operations API so a catalog of thousands of products is read reliably rather than timing out.",
  },
  {
    q: "Do I need SKUs on my products?",
    a: "No. The CSV you download includes a variant_id column for every product, and the importer matches on that first, so a store with no SKUs at all works fine. SKU is only used as a fallback when you type a row by hand. Keep the variant_id column in the file when you re-upload.",
  },
  {
    q: "Can I show live metal prices on my storefront?",
    a: "Yes. The Metal Price Ticker is part of the app and is included on both plans. Add it from your theme editor with no code, choose a scrolling strip or static cards, pick which metals to show, and set your own colors. See the Storefront ticker section above for the steps for newer and older themes.",
  },
  {
    q: "Does the app read my customers' data?",
    a: "No. The app requests exactly one permission: writing product prices. It stores your pricing configuration and sync history — no customer names, addresses, orders or payment data, ever.",
  },
  {
    q: "Can I price in Indian rupees?",
    a: "Yes. Set your base currency to INR in Settings and live rates are converted for you, so a store selling in rupees prices in rupees. The app works the same way for any currency your store already sells in.",
  },
  {
    q: "Does it round prices to clean numbers?",
    a: "It can, but it's off by default. Most real bullion and by-weight sellers track the market exactly, so the default is exact pricing. If you want clean numbers you can round each formula to the nearest 5/10/25/50/100, add charm-price .99 endings, and set a minimum change threshold so tiny market moves don't nudge a price by a dollar or two.",
  },
  {
    q: "How am I billed?",
    a: "Through Shopify, on your existing Shopify subscription — no card details entered anywhere else. There's a 14-day free trial.",
  },
  {
    q: "Does it do diamond or gemstone pricing, POS sync, or buyback?",
    a: "Not in this version. MetalRate Sync is built first for bullion and by-weight sellers, where reliable metal-rate repricing is the whole job. Diamond/gemstone granularity, POS sync and buyback calculators are on the roadmap, not in the app today — we'd rather be honest about that than list features that aren't really there.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Docs() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <nav className="nav" aria-label="Main">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <Image src="/images/logo.png" alt="" width={30} height={30} />
            Ounce: MetalRate Sync
          </Link>
          <div className="nav-links">
            <Link href="/#features">Features</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <a
            className="nav-cta"
            href="https://apps.shopify.com/metalrate-sync"
            target="_blank"
            rel="noopener noreferrer"
          >
            Install on Shopify
          </a>
        </div>
      </nav>

      <main className="docs">
        <div className="docs-head">
          <div className="wrap">
            <p className="eyebrow">Documentation</p>
            <h1>How MetalRate Sync works</h1>
            <p className="docs-lede">
              Everything from your first formula to a fully automatic,
              audited repricing schedule. If you sell metal by weight, this is
              the whole workflow — start at the top, or jump to what you need.
            </p>
          </div>
        </div>

        <div className="wrap docs-body">
          <aside className="docs-toc" aria-label="On this page">
            <p className="docs-toc-label">On this page</p>
            <nav>
              {TOC.map((t) => (
                <a key={t.id} href={`#${t.id}`}>
                  {t.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="docs-content">
            <section id="quick-start">
              <h2>Quick start</h2>
              <p>The whole app is three steps:</p>
              <ol className="docs-steps">
                <li>
                  <strong>Create a formula.</strong> Pick a metal and purity,
                  then decide how making charges, wastage, markup and tax stack
                  on top of the raw metal value. A formula is just the math — it
                  doesn&apos;t touch anything on its own.
                </li>
                <li>
                  <strong>Track a product.</strong> On a product variant, set
                  its weight and choose a formula. That variant is now
                  &ldquo;tracked&rdquo; and will appear in Preview &amp; Sync.
                </li>
                <li>
                  <strong>Preview, then apply.</strong> Open Preview &amp; Sync
                  to see exactly what every tracked product&apos;s price would
                  become, against today&apos;s live rate, before anything
                  changes. Click Apply when you&apos;re happy.
                </li>
              </ol>
              <div className="docs-callout">
                Nothing touches your store until you click Apply. Every Apply is
                recorded in History with the exact rate used.
              </div>
            </section>

            <section id="formulas">
              <h2>Formulas</h2>
              <p>
                A formula computes the metal value as{" "}
                <code>weight × purity × live rate</code>, then layers your costs
                on top, in this order:
              </p>
              <ul className="docs-list">
                <li>
                  <strong>Wastage %</strong> — a percentage of the metal value,
                  standard for cutting/setting loss.
                </li>
                <li>
                  <strong>Making charge</strong> — a flat amount, a per-gram
                  amount, or a percentage of the metal value.
                </li>
                <li>
                  <strong>Markup</strong> — a flat amount or a percentage of
                  everything so far.
                </li>
                <li>
                  <strong>Tax %</strong> (e.g. GST) — applied last, on top of
                  everything.
                </li>
              </ul>
              <p>Then, optionally:</p>
              <ul className="docs-list">
                <li>
                  <strong>Round to nearest</strong> — snap the final price to a
                  clean step (5, 10, 25, 50, 100). Leave on &ldquo;Exact&rdquo;
                  to track the market precisely, which is what most bullion and
                  coin sellers want.
                </li>
                <li>
                  <strong>End in .99</strong> — charm pricing on top of whatever
                  rounding you picked.
                </li>
                <li>
                  <strong>Minimum change to trigger an update</strong> — if the
                  new price is closer to the current price than this amount, the
                  app leaves it alone instead of nudging it a couple of units.
                  Set to 0 to always track exactly (recommended for bullion).
                </li>
                <li>
                  <strong>Stop-loss rate per gram</strong> — if the live rate
                  drops below this, the app skips repricing entirely rather than
                  following the market down.
                </li>
              </ul>
              <p className="docs-note">
                Not sure what to use? Leave rounding off and the threshold at 0
                — that matches what most real gold and silver sellers already
                do. Rounding and the change threshold are there if you
                specifically want cleaner-looking prices, not because you need
                them.
              </p>
              <p>
                <strong>Purity presets:</strong> 24K / fine (0.999), 22K
                (0.916), 18K (0.750), 14K (0.585), 10K (0.417), sterling 925
                (0.925), bullion .9999 (1.0) — or type any custom factor.
              </p>
            </section>

            <section id="weight-units">
              <h2>Weight units</h2>
              <p>
                Enter weights in whatever unit you already use. The app converts
                to grams internally, so everything downstream is consistent.
              </p>
              <ul className="docs-list docs-list-inline">
                <li>Grams (g)</li>
                <li>Troy ounce (oz t)</li>
                <li>Pennyweight (dwt)</li>
                <li>Tola</li>
                <li>Vori</li>
              </ul>
            </section>

            <section id="rate-sources">
              <h2>Rate sources</h2>
              <p>Set this in Settings. Three options:</p>
              <ul className="docs-list">
                <li>
                  <strong>Live market rates</strong> — real gold, silver,
                  platinum and palladium spot prices, included with the app. No
                  key to bring, nothing to configure beyond your base currency.
                </li>
                <li>
                  <strong>Manual entry</strong> — type your own per-gram board
                  rate for each metal. Best if you price off IBJA or your own
                  desk number. Rates are tagged with the currency you entered
                  them in, so a later currency change never silently relabels
                  them.
                </li>
                <li>
                  <strong>Demo rates</strong> — simulated numbers for testing
                  only. The app warns clearly before applying demo prices to a
                  real store.
                </li>
              </ul>
            </section>

            <section id="preview-sync">
              <h2>Preview &amp; Sync</h2>
              <p>
                This is the safety net that most rate-sync apps don&apos;t have.
                Every sync starts as a <strong>dry run</strong>: a table of
                every tracked variant showing its current price, the new price,
                and the % change, against the exact rates shown at the top of
                the page.
              </p>
              <p>
                Nothing changes until you click <strong>Apply</strong> — and the
                app applies exactly what you were shown. If the rates moved while
                you were looking, it asks you to refresh and look again rather
                than quietly substituting new numbers. Rows that would land on
                the same price show as &ldquo;No change&rdquo; and are left
                alone; stop-loss holds are flagged too.
              </p>
            </section>

            <section id="bulk-import">
              <h2>Bulk import</h2>
              <p>The fast way to configure many products at once:</p>
              <ol className="docs-steps">
                <li>
                  Go to <strong>Products → Bulk import</strong>.
                </li>
                <li>
                  Click <strong>Download current products as CSV</strong>. You
                  get a spreadsheet with every product&apos;s ID, name, current
                  price, and any weight/formula already set. Products without a
                  SKU are included too; SKUs are optional.
                </li>
                <li>
                  Edit it in Excel or Google Sheets. Fill in a weight column
                  (<code>weight_grams</code>, or <code>weight_tola</code>,{" "}
                  <code>weight_vori</code>, <code>weight_troy_oz</code>,{" "}
                  <code>weight_dwt</code>) and <code>formula</code> (must match a
                  formula name exactly) for the rows you want tracked.
                </li>
                <li>Upload it back.</li>
              </ol>
              <p>
                You get a report: how many rows matched and updated, which rows
                weren&apos;t found in your store, and which formula names
                didn&apos;t match anything. Nothing fails silently. Leaving a
                cell blank keeps whatever was already set for that product.
              </p>
              <p className="docs-note">
                On Starter, bulk import respects the 800-SKU cap — if an import
                would turn on more tracked variants than your plan allows, the
                extra rows are matched but left off, and reported to you, rather
                than silently dropped.
              </p>
            </section>

            <section id="automatic-sync">
              <h2>Automatic sync</h2>
              <p>
                Turn on the schedule in Settings and the app reprices in the
                background on its own — <strong>twice a day on Starter</strong>,{" "}
                <strong>up to five times a day on Pro</strong>. The frequency is
                controlled by your plan, so there&apos;s no cron to configure and
                no way to accidentally hammer your store with reprices.
              </p>
              <p>
                Scheduled runs use the same formulas and stop-loss rules as a
                manual sync, and each one is logged in History exactly the same
                way. If your subscription lapses, automatic sync stops on its own
                rather than continuing to run.
              </p>
            </section>

            <section id="storefront-ticker">
              <h2>Storefront ticker</h2>
              <p>
                Show live gold, silver, platinum and palladium prices on your
                own store. It is included on both plans and needs no code.
              </p>
              <p>
                <strong>On newer themes (Online Store 2.0):</strong>
              </p>
              <ol className="docs-steps">
                <li>
                  In Shopify admin go to{" "}
                  <strong>Online Store → Themes → Customize</strong>.
                </li>
                <li>
                  Click <strong>Add section</strong>, open the{" "}
                  <strong>Apps</strong> category and choose{" "}
                  <strong>Metal Price Ticker</strong>. Drag it where you want it.
                </li>
                <li>Adjust the settings and click Save.</li>
              </ol>
              <p>
                <strong>On older themes</strong> (themes that don&apos;t show
                apps under Add section):
              </p>
              <ol className="docs-steps">
                <li>
                  In the theme editor, click the <strong>App embeds</strong>{" "}
                  icon in the left sidebar.
                </li>
                <li>
                  Switch on <strong>Metal Price Ticker</strong> and click Save.
                  It appears at the very top of the page, full width.
                </li>
              </ol>
              <p>
                In the settings you can choose a scrolling strip or static
                cards, set the scroll speed, show or hide each metal and the
                change since the last update, and set the background, text,
                accent, up and down colors and the spacing.
              </p>
              <p className="docs-note">
                The ticker reads the same live rates as your pricing. If rates
                or your subscription are unavailable it stays hidden instead of
                showing an empty box. View the live storefront page, not just
                the editor preview, to see real prices.
              </p>
            </section>

            <section id="history">
              <h2>History &amp; audit trail</h2>
              <p>
                Every sync — manual or scheduled — writes a full record: which
                variants were updated, skipped or failed, and the exact rate
                snapshot each price came from. When a price changes, you can
                always answer &ldquo;what happened, and at what rate?&rdquo; This
                audit trail is the point: prices never change silently, and
                nothing disappears without a reason you can read back later.
              </p>
            </section>

            <section id="plans">
              <h2>Plans &amp; limits</h2>
              <div className="docs-table-wrap">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>&nbsp;</th>
                      <th>Starter — $30/mo</th>
                      <th>Pro — $50/mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tracked SKUs</td>
                      <td>Up to 800</td>
                      <td>Unlimited</td>
                    </tr>
                    <tr>
                      <td>Automatic sync</td>
                      <td>Twice a day</td>
                      <td>Up to 5× a day</td>
                    </tr>
                    <tr>
                      <td>Formulas, stop-loss, rounding</td>
                      <td>Included</td>
                      <td>Included</td>
                    </tr>
                    <tr>
                      <td>Bulk CSV import &amp; export</td>
                      <td>Included</td>
                      <td>Included</td>
                    </tr>
                    <tr>
                      <td>Storefront ticker</td>
                      <td>Included</td>
                      <td>Included</td>
                    </tr>
                    <tr>
                      <td>Full audit-trail history</td>
                      <td>Included</td>
                      <td>Included</td>
                    </tr>
                    <tr>
                      <td>Priority support</td>
                      <td>—</td>
                      <td>Included</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="docs-note">
                14-day free trial on both plans. Manual Preview &amp; Sync is
                unlimited on every plan — the plan only governs the SKU count and
                the automatic-sync frequency.
              </p>
            </section>

            <section id="faq">
              <h2>FAQ</h2>
              <div className="docs-faq">
                {FAQS.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <section id="troubleshooting">
              <h2>Troubleshooting</h2>
              <ul className="docs-list">
                <li>
                  <strong>A product isn&apos;t in Preview &amp; Sync.</strong> It
                  needs both a weight greater than 0 and a formula assigned. On
                  the Products page its badge should read &ldquo;Tracked.&rdquo;
                </li>
                <li>
                  <strong>A price didn&apos;t update even though I applied.</strong>{" "}
                  Check its status in the preview: &ldquo;Stop-loss hold&rdquo;
                  means the live rate is below the floor on its formula;
                  &ldquo;No change&rdquo; means the computed price was too close
                  to the current one (check the formula&apos;s minimum-change
                  setting).
                </li>
                <li>
                  <strong>Bulk import says a row wasn&apos;t found.</strong> The
                  app matches on the <code>variant_id</code> column from the
                  file you downloaded, then falls back to SKU. Don&apos;t delete
                  or edit the <code>variant_id</code> column. If you typed a row
                  by hand using a SKU, check it matches Shopify exactly (case
                  and spacing matter).
                </li>
                <li>
                  <strong>Bulk import says a formula name was unrecognized.</strong>{" "}
                  Formula names must match an existing formula exactly, including
                  capitalization. Check the Formulas page, or leave the column
                  blank to keep whatever was already assigned.
                </li>
                <li>
                  <strong>I turned on automatic syncing but nothing happens.</strong>{" "}
                  Scheduled syncing needs an active subscription and runs on the
                  app&apos;s server. Confirm your plan is active and give it up to
                  one schedule interval to fire.
                </li>
              </ul>
            </section>

            <section id="support">
              <h2>Support</h2>
              <p>
                Stuck on something, or want a formula set up for your exact
                catalog? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> — real
                answers from the person who built the app.
              </p>
              <p>
                <Link href="/" className="docs-back">
                  ← Back to metalratesync.com
                </Link>
              </p>
            </section>
          </article>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-brand">
            <Image src="/images/logo.png" alt="" width={22} height={22} />
            MetalRate Sync
          </span>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span className="footer-tag">
            Built for people who sell metal by weight. Listed on the Shopify App
            Store as <strong>Ounce: MetalRate Sync</strong>.
          </span>
        </div>
      </footer>
    </>
  );
}
