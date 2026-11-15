import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../blog-shell";
import { POSTS } from "../posts";

const post = POSTS[2];

export const metadata: Metadata = {
  title: {
    absolute: post.seoTitle,
  },
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: post.seoTitle,
    description: post.description,
    url: `https://metalratesync.com/blog/${post.slug}`,
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: post.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: post.seoTitle,
    description: post.description,
    images: ["/images/hero-feature.png"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.description,
  image: "https://metalratesync.com/images/hero-feature.png",
  datePublished: post.date,
  dateModified: post.date,
  mainEntityOfPage: `https://metalratesync.com/blog/${post.slug}`,
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
      "name": "Blog",
      "item": "https://metalratesync.com/blog",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": post.title,
      "item": `https://metalratesync.com/blog/${post.slug}`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the difference between flat making charges and percentage making charges?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Flat making charges charge a fixed dollar amount per gram or per piece regardless of metal spot price changes. Percentage making charges scale directly with the gold value, meaning as spot gold rises, your labor fee increases proportionally.",
      },
    },
    {
      "@type": "Question",
      name: "How is wastage calculated in gold jewelry pricing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Wastage accounts for microscopic gold dust lost during casting, polishing, and soldering. It is calculated as a percentage of the pure metal value (typically between 2% and 6%) and added to the cost before retail markup.",
      },
    },
    {
      "@type": "Question",
      name: "Can Shopify calculate making charges natively without an app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Shopify only supports static variant prices. To combine live precious metal spot prices with custom making charges and wastage dynamically, merchants must use an automated repricing app like MetalRate Sync.",
      },
    },
  ],
};

export default function JewelryMakingChargesPage() {
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
        <h1>{post.title}</h1>
        <p className="legal-date">Published {post.date}</p>

        <p>
          In precious metal jewelry, raw bullion spot rates represent only the baseline
          material value. Transforming raw gold grain into a finished 18K bracelet requires
          skilled bench labor and incurs unrecoverable material loss during casting, filing,
          and polishing.
        </p>

        <p>
          If your Shopify store calculates prices solely on gold weight &times; spot price,
          every complex fabrication erodes your operating margin. To price jewelry accurately,
          merchants must combine two specific manufacturing factors: <strong>making charges</strong> and{" "}
          <strong>wastage allowances</strong>.
        </p>

        <h2>1. Making Charges Explained: Labor and Craftsmanship</h2>
        <p>
          The making charge compensates the jeweler for bench craftsmanship, CAD design, stone
          setting, and polishing. In Shopify e-commerce, making charges are structured in two
          distinct ways:
        </p>
        <ul>
          <li>
            <strong>Flat Making Charge ($ per piece or $ per gram):</strong> A cast plain wedding
            band might incur a flat $8.00 per gram making fee, or a fixed $45.00 production fee.
            When gold spot rates jump from $2,500/oz to $2,700/oz, the labor component remains
            constant.
          </li>
          <li>
            <strong>Percentage-Based Making Charge (% of metal value):</strong> Common in high-end
            filigree and intricate chain manufacturing. The making charge is set at 10% to 25% of the
            underlying gold value, automatically scaling as bullion costs fluctuate.
          </li>
        </ul>

        <h2>2. Wastage Allowance: Accounting for Material Loss</h2>
        <p>
          No casting process yields 100% metal retention. Bench cutting, filing, refining dross,
          and ultrasonic polishing generate microscopic gold loss known as wastage (or <em>tunda</em> /{" "}
          <em>kachha</em> in South Asian trade). Standard industry wastage benchmarks range from
          2% for machine-pressed chains to 7% for intricate handmade filigree.
        </p>
        <p>
          Wastage is calculated on the net fine gold content:
        </p>
        <p>
          <code>Wastage Cost = Net Metal Value &times; Wastage Percentage</code>
        </p>

        <h2>3. Complete Formula Breakdown with Worked Example</h2>
        <p>
          Consider a 14K gold cuban link chain weighing <strong>24.50 grams</strong>. Assume a live
          pure gold spot rate of <strong>$85.00 per gram</strong> ($2,643.80 per troy ounce):
        </p>

        <div
          className="docs-table-wrap table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Worked jewelry pricing calculation breakdown"
        >
          <table className="docs-table">
            <thead>
              <tr>
                <th>Calculation Step</th>
                <th>Formula / Parameters</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fine Gold Purity Factor</td>
                <td>14K = 14 / 24 = 0.585 (58.5% fine gold)</td>
                <td>0.585 fraction</td>
              </tr>
              <tr>
                <td>Raw Metal Value</td>
                <td>24.50 g &times; 0.585 &times; $85.00/g</td>
                <td>$1,218.26</td>
              </tr>
              <tr>
                <td>Wastage Allowance (4%)</td>
                <td>$1,218.26 &times; 0.04</td>
                <td>$48.73</td>
              </tr>
              <tr>
                <td>Making Charges (12%)</td>
                <td>$1,218.26 &times; 0.12</td>
                <td>$146.19</td>
              </tr>
              <tr>
                <td>Base Production Cost</td>
                <td>$1,218.26 + $48.73 + $146.19</td>
                <td>$1,413.18</td>
              </tr>
              <tr>
                <td>Retail Markup (35%)</td>
                <td>$1,413.18 &times; 0.35</td>
                <td>$494.61</td>
              </tr>
              <tr>
                <td>Calculated Retail Price</td>
                <td>$1,413.18 + $494.61 (rounded to .99)</td>
                <td><strong>$1,907.99</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. How MetalRate Sync Automates Making Charges on Shopify</h2>
        <p>
          Calculating this formula across 1,500 variants by hand in Excel is unsustainable. If gold
          surges $40 overnight, un-updated variants create massive arbitrage opportunities for buyers
          at the expense of your margin.
        </p>
        <p>
          In MetalRate Sync, you construct your formula once:
        </p>
        <ul>
          <li>Select metal (Gold, Silver, Platinum, Palladium) and purity preset (e.g., 14K).</li>
          <li>Enter your making charges ($ flat or % of metal).</li>
          <li>Enter your wastage percentage (e.g., 4%).</li>
          <li>Set retail markup and optional stop-loss floor prices.</li>
          <li>Preview the exact dollar delta for every variant before committing to your store.</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <h3>Can I round finished prices to the nearest dollar or .99?</h3>
        <p>
          Yes. MetalRate Sync provides automated rounding rules (exact cent, .99 psychological
          ending, or whole dollar rounding) applied after markup and taxes are computed.
        </p>
        <h3>Does making charge sync work for sterling silver jewelry?</h3>
        <p>
          Yes. Sterling silver (925) jewelry typically involves higher making charge percentages
          relative to its lower base metal value. You can define separate formulas for 925 silver
          and 18K gold.
        </p>

        <BlogCta />

        <p style={{ marginTop: "32px" }}>
          <Link href="/blog">&larr; Back to all guides</Link>
        </p>
      </main>
    </>
  );
}
