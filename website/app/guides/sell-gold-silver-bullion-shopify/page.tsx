import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../../blog/blog-shell";

export const metadata: Metadata = {
  title: {
    absolute: "Sell Gold & Silver on Shopify: 2026 Guide | MetalRate",
  },
  description:
    "Learn how to sell gold, silver, and precious metals on Shopify. Master live spot price sync, payment gateways, checkout price locks, and transit insurance.",
  alternates: { canonical: "/guides/sell-gold-silver-bullion-shopify" },
  openGraph: {
    type: "article",
    title: "Sell Gold & Silver on Shopify: 2026 Guide | MetalRate",
    description:
      "Learn how to sell gold, silver, and precious metals on Shopify. Master live spot price sync, payment gateways, checkout price locks, and transit insurance.",
    url: "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "How to Sell Gold and Silver Bullion on Shopify Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell Gold & Silver on Shopify: 2026 Guide | MetalRate",
    description:
      "Learn how to sell gold, silver, and precious metals on Shopify. Master live spot price sync, payment gateways, checkout price locks, and transit insurance.",
    images: ["/images/hero-feature.png"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Sell Gold, Silver, and Bullion on Shopify: The Complete 2026 Guide",
  description:
    "A comprehensive operational playbook for precious metals e-commerce: high-risk payment gateways, real-time spot repricing, checkout volatility locks, and armored shipping.",
  image: "https://metalratesync.com/images/hero-feature.png",
  datePublished: "2026-11-15",
  dateModified: "2026-11-15",
  mainEntityOfPage: "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
  author: { "@type": "Organization", name: "MetalRate Sync" },
  publisher: { "@type": "Organization", name: "MetalRate Sync" },
};

const breadcrumbsJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://metalratesync.com",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Guides",
      "item": "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Sell Gold & Silver on Shopify",
      "item": "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does Shopify Payments allow bullion and precious metal coin sales?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shopify Payments (powered by Stripe) categorizes pure investment bullion, sovereign coins, and gold bars as restricted high-risk items. Bullion retailers must connect specialized precious metal merchant processors such as Authorize.Net, Helcim, or bank wire integration.",
      },
    },
    {
      "@type": "Question",
      name: "How do bullion dealers prevent price arbitrage during volatile market hours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Dealers use automated live spot rate synchronization apps like MetalRate Sync combined with stop-loss floor prices. When the market moves, catalog prices update systematically across all variants, preventing buyers from purchasing at outdated lower rates.",
      },
    },
  ],
};

export default function SellGoldSilverGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>How to Sell Gold &amp; Silver Bullion on Shopify (2026 Guide)</h1>
        <p className="legal-date">Published November 15, 2026 &bull; Strategic Guide</p>

        <p>
          Selling precious metals online represents one of e-commerce&rsquo;s highest-ticket
          categories. A single checkout often exceeds $15,000 for a tube of Gold American
          Eagles or a monster box of Silver Philharmonics.
        </p>

        <p>
          However, selling bullion on Shopify is fundamentally unlike selling apparel or
          electronics. Operating margins are wafer-thin (often 1.5% to 4.5% above spot),
          commodity spot prices fluctuate by the second, and standard payment processors
          prohibit bullion sales.
        </p>

        <p>
          This operational playbook outlines the four non-negotiable pillars required to build
          a profitable, compliant precious metals business on Shopify.
        </p>

        <h2>1. Payment Processing &amp; High-Risk Compliance</h2>
        <p>
          The most common hurdle facing new bullion dealers is payment processing. Standard
          Shopify Payments (Stripe) restricts investment-grade coins, gold bars, and bullion.
          Attempting to process large bullion orders through standard credit card channels risks
          frozen merchant balances and sudden account terminations.
        </p>

        <div
          className="docs-table-wrap table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Payment methods comparison for bullion dealers"
        >
          <table className="docs-table">
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Fee Structure</th>
                <th>Settlement Risk</th>
                <th>Recommended Volume</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bank Wire Transfer</strong></td>
                <td>Flat bank fee ($15 &ndash; $30)</td>
                <td>Zero chargeback risk</td>
                <td>Orders &gt; $2,500</td>
              </tr>
              <tr>
                <td><strong>ACH / eCheck</strong></td>
                <td>0.5% &ndash; 1.0% ($5 cap)</td>
                <td>Low (verified funds)</td>
                <td>Orders $500 &ndash; $5,000</td>
              </tr>
              <tr>
                <td><strong>Specialized High-Risk Gateway</strong></td>
                <td>2.2% &ndash; 2.9% + $0.30</td>
                <td>Requires 3D Secure 2.0</td>
                <td>Retail collectors &lt; $1,500</td>
              </tr>
              <tr>
                <td><strong>Cryptocurrency (USDC / BTC)</strong></td>
                <td>0.5% &ndash; 1.0%</td>
                <td>Irreversible on-chain</td>
                <td>International buyers</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>2. Dynamic Spot Pricing &amp; Margin Protection</h2>
        <p>
          Because bullion operates on tight spreads (e.g., $45 premium on a 1 oz gold bar
          selling for $2,700), a $30 drop in spot gold turns a profitable sale into an outright loss.
          Dealers cannot manually edit thousands of listings when COMEX markets swing.
        </p>
        <p>
          To maintain commercial viability, stores implement three pricing rules:
        </p>
        <ul>
          <li>
            <strong>Automated GraphQL Sync:</strong> Schedule periodic price updates matching live
            feeds (Gold, Silver, Platinum, Palladium) across all mint products.
          </li>
          <li>
            <strong>Stop-Loss Floors:</strong> Define minimum acceptable pricing thresholds so sudden
            liquidity crashes do not reprice stock below your physical acquisition cost.
          </li>
          <li>
            <strong>Preview Before Commit:</strong> Audit proposed price shifts across variant
            batches before live changes apply, preventing inadvertent calculation errors.
          </li>
        </ul>

        <h2>3. High-Security Shipping &amp; Transit Insurance</h2>
        <p>
          Standard postal carriers limit package insurance to $5,000, and postal policies often
          exclude precious metals altogether. Shipping high-value bullion requires specialized
          third-party logistics:
        </p>
        <ul>
          <li>
            <strong>Discreet Packaging:</strong> Never mention &ldquo;Gold&rdquo;, &ldquo;Bullion&rdquo;,
            or &ldquo;Coins&rdquo; on the outer shipping label. Use innocuous business entity names.
          </li>
          <li>
            <strong>Third-Party Transit Insurance:</strong> Utilize specialized underwriters
            (e.g., Shipsurance, Cabrella, or Lloyd&rsquo;s syndicates) providing door-to-door
            declarations up to $100,000 per parcel.
          </li>
          <li>
            <strong>Armored Logistics:</strong> For high-volume wholesale shipments exceeding $50,000,
            contract with armored carriers such as Brink&rsquo;s or Malca-Amit for secure vault delivery.
          </li>
        </ul>

        <h2>4. Fraud Mitigation &amp; AML Compliance</h2>
        <p>
          Precious metals represent liquid cash substitutes, making online dealers frequent targets
          for stolen credit cards and synthetic identity theft.
        </p>
        <p>
          To safeguard operations:
        </p>
        <ul>
          <li>Enforce mandatory ID verification for first-time buyers on credit card purchases.</li>
          <li>Ship exclusively to billing addresses verified through AVS (Address Verification Service).</li>
          <li>Maintain automated AML/KYC records in compliance with FinCEN regulations for cash-equivalent transactions.</li>
        </ul>

        <h2>Automate Your Bullion Catalog with MetalRate Sync</h2>
        <p>
          MetalRate Sync is engineered specifically for precious metals merchants. It provides
          reliable high-volume variant updates, preview-before-commit protection, stop-loss price
          floors, and a transparent storefront rate ticker.
        </p>

        <BlogCta />

        <p style={{ marginTop: "32px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}
