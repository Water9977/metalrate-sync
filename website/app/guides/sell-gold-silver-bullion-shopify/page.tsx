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
      position: 1,
      name: "Home",
      item: "https://metalratesync.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Guides",
      item: "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Sell Gold & Silver on Shopify",
      item: "https://metalratesync.com/guides/sell-gold-silver-bullion-shopify",
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
        text: "Shopify Payments (powered by Stripe) restricts investment-grade bullion, sovereign coins, and gold bars as high-risk assets. Bullion dealers must configure specialized merchant gateways like Authorize.Net or Helcim, or accept Bank Wires and ACH.",
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
    {
      "@type": "Question",
      name: "What carrier is safest for shipping physical gold and silver online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "USPS Registered Mail provides physical chain-of-custody tracking with postal insurance up to $50,000 per parcel. For overnight expedited courier shipments via FedEx or UPS, merchants must use third-party underwriters like Parcel Pro or Shipsurance.",
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
        <p className="legal-date">Published November 15, 2026 &bull; Strategic Guide &bull; 10 min read</p>

        <p>
          Selling precious metals online represents one of e-commerce&rsquo;s highest-ticket
          categories. A single order regularly exceeds $15,000 for a tube of 1 oz Gold American
          Eagles or a monster box of 500 Silver Philharmonics.
        </p>

        <p>
          However, selling bullion on Shopify is fundamentally different from selling apparel or
          consumer goods. Physical bullion operating margins are wafer-thin (typically 1.5% to 4.5% above spot),
          commodity spot prices fluctuate by the second on global COMEX and LBMA exchanges, and
          standard e-commerce payment processors restrict bullion sales.
        </p>

        <p>
          This verified operational playbook details the four non-negotiable pillars required to build
          a compliant, profitable precious metals dealership on Shopify.
        </p>

        <h2>1. Payment Gateways &amp; High-Risk Merchant Compliance</h2>
        <p>
          The most critical hurdle facing new bullion dealers is payment processing. While standard
          finished jewelry (karat gold rings, sterling necklaces) is permitted on Shopify Payments,
          investment-grade bullion bars, ingots, and sovereign legal tender coins are classified as
          restricted assets under Stripe and Shopify Payments acceptable use policies.
        </p>
        <p>
          Processing high-ticket bullion orders through standard credit card channels without high-risk
          underwriting risks frozen reserves, severe chargeback losses, and abrupt account terminations.
          Successful bullion stores operate a multi-tiered checkout strategy:
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
                <th>Settlement &amp; Chargeback Risk</th>
                <th>Standard Checkout Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bank Wire Transfer</strong></td>
                <td>Flat bank fee ($15 &ndash; $25)</td>
                <td>Zero chargeback risk (irreversible)</td>
                <td>Wholesale &amp; orders &gt; $2,500</td>
              </tr>
              <tr>
                <td><strong>ACH / eCheck</strong></td>
                <td>0.5% &ndash; 1.0% ($5 &ndash; $10 cap)</td>
                <td>Minimal risk after 3-day funds clearing</td>
                <td>Repeat orders $500 &ndash; $5,000</td>
              </tr>
              <tr>
                <td><strong>High-Risk Credit Gateway</strong></td>
                <td>2.2% &ndash; 2.8% + $0.30</td>
                <td>High fraud target; requires 3D Secure 2.0</td>
                <td>Retail collector orders &lt; $1,500</td>
              </tr>
              <tr>
                <td><strong>Cryptocurrency (USDC / BTC)</strong></td>
                <td>0.5% &ndash; 1.0%</td>
                <td>Irreversible on-chain settlement</td>
                <td>International and tech buyers</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>The Cash Discount Pricing Pattern:</strong> Industry leaders like APMEX and JM Bullion
          display dual pricing on product pages: a 3% to 4% discounted cash rate for Bank Wire/ACH,
          and a standard rate for credit cards. This structure protects the merchant&rsquo;s 2% bullion margin
          from being wiped out by credit card interchange fees.
        </p>

        <h2>2. Dynamic Spot Pricing &amp; Margin Protection</h2>
        <p>
          Precious metals trade 24 hours a day during global market sessions. If gold surges $45/oz
          on geopolitical news while your Shopify catalog prices remain static, predatory bots and
          arbitrageurs will sweep your inventory before you can manually edit listings.
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
            <strong>Stop-Loss Price Floors:</strong> Define minimum acceptable pricing thresholds so sudden
            liquidity crashes never reprice physical inventory below your wholesale acquisition cost.
          </li>
          <li>
            <strong>Preview Before Commit:</strong> Audit proposed price shifts across variant batches
            before changes apply to the live storefront, preventing erroneous calculations.
          </li>
        </ul>

        <h2>3. High-Security Shipping &amp; Transit Insurance</h2>
        <p>
          Standard carrier insurance will not protect physical bullion. FedEx and UPS standard declared
          value terms explicitly cap maximum liability for jewelry, precious metals, and coins at
          $1,000 per package, refusing claims beyond this limit.
        </p>
        <p>
          Bullion merchants secure their shipments through specialized logistics channels:
        </p>
        <ul>
          <li>
            <strong>USPS Registered Mail:</strong> The gold standard for domestic bullion shipping up to
            $50,000 per parcel. Every postal worker must sign a physical chain-of-custody manifest
            at every depot transition, and packages travel in locked metal cages.
          </li>
          <li>
            <strong>Third-Party Transit Insurance:</strong> For expedited shipments via FedEx Express or
            UPS Next Day Air, dealers use specialized third-party underwriters (such as Parcel Pro,
            Shipsurance, or Cabrella) to declare full values up to $100,000 per parcel.
          </li>
          <li>
            <strong>Armored Vault Couriers:</strong> For wholesale dealer-to-dealer transactions exceeding
            $50,000, shipments travel via armored carriers such as Brink&rsquo;s, Malca-Amit, or Loomis.
          </li>
          <li>
            <strong>Discreet Packaging Protocols:</strong> Shipping labels must never state words like
            &ldquo;Gold&rdquo;, &ldquo;Bullion&rdquo;, or &ldquo;Jewelry&rdquo;. Senders use innocuous corporate
            abbreviations, heavy-duty reinforced filament tape, and nested boxes to prevent puncture leaks.
          </li>
        </ul>

        <h2>4. Fraud Mitigation, AML &amp; State Sales Tax</h2>
        <p>
          Because gold and silver are instant cash equivalents, precious metal dealers operate under
          strict federal compliance mandates in the United States and global jurisdictions:
        </p>
        <ul>
          <li>
            <strong>FinCEN AML Compliance:</strong> Under the USA PATRIOT Act (31 CFR Part 1027), any dealer
            who purchases or sells more than $50,000 in covered precious metals, stones, or jewels annually
            must establish a formal, written Anti-Money Laundering (AML) program and appoint a compliance officer.
          </li>
          <li>
            <strong>IRS / FinCEN Form 8300:</strong> Dealers must file Form 8300 within 15 days if receiving
            more than $10,000 in cash or cash equivalents (including cashier&rsquo;s checks, bank drafts, or
            money orders) in a single transaction or related series of transactions.
          </li>
          <li>
            <strong>State Sales Tax Exemption Rules:</strong> Over 40 US states provide sales tax exemptions
            for investment-grade bullion and legal tender coins. However, threshold rules vary widely
            (for example, California exempts bullion purchases over $2,000, while Florida exempts coins and
            bullion over $500). Dealers must configure automated tax engines (like Avalara or Shopify Tax)
            to prevent charging sales tax where buyers are legally exempt.
          </li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <h3>Does Shopify Payments allow bullion and precious metal coin sales?</h3>
        <p>
          Shopify Payments (powered by Stripe) restricts investment-grade bullion, sovereign coins, and gold bars
          as high-risk assets. Bullion dealers must configure specialized merchant gateways like Authorize.Net or
          Helcim, or accept Bank Wires and ACH.
        </p>
        <h3>How do bullion dealers prevent price arbitrage during volatile market hours?</h3>
        <p>
          Dealers use automated live spot rate synchronization apps like MetalRate Sync combined with stop-loss
          floor prices. When the market moves, catalog prices update systematically across all variants,
          preventing buyers from purchasing at outdated lower rates.
        </p>
        <h3>What carrier is safest for shipping physical gold and silver online?</h3>
        <p>
          USPS Registered Mail provides physical chain-of-custody tracking with postal insurance up to $50,000
          per parcel. For overnight expedited courier shipments via FedEx or UPS, merchants must use third-party
          underwriters like Parcel Pro or Shipsurance.
        </p>

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