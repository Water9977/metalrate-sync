import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../blog-shell";
import { POSTS } from "../posts";

const post = POSTS[3];

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
      name: "How do you calculate the gold price per gram for 14K and 18K gold?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Divide the live gold spot price per troy ounce by 31.1035 to obtain the 24K pure price per gram. Then multiply by the karat purity fraction: 0.585 for 14K (or 0.5833 in strict US standards) and 0.750 for 18K gold.",
      },
    },
    {
      "@type": "Question",
      name: "Why is 1 troy ounce 31.1035 grams instead of 28.35 grams?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Precious metals are exclusively traded in troy ounces, a legacy British imperial weight standard. Common household goods are weighed in avoirdupois ounces (28.35 grams). Confusing the two causes a catastrophic 9.7% pricing miscalculation.",
      },
    },
    {
      "@type": "Question",
      name: "Can a single Shopify product have variants with different gold karats?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. In Shopify, each karat option (e.g., 10K, 14K, 18K) is configured as a distinct variant. MetalRate Sync assigns independent formulas and weights to each variant, recalculating all karat options concurrently.",
      },
    },
  ],
};

export default function KaratGoldPricingPage() {
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
          A frequent mistake made by new e-commerce jewelers on Shopify is taking live gold
          spot prices ($/oz) and applying them directly to finished alloyed jewelry. Pure gold
          (24K) is too soft for rings and prongs, meaning virtually all commercial fine jewelry
          is alloyed with copper, silver, zinc, or palladium to improve tensile strength.
        </p>

        <p>
          Because each karat level contains a different proportion of pure gold, every variant
          must be priced using its exact mathematical purity fraction. Here is the definitive
          framework for pricing 10K, 14K, 18K, 22K, and 24K gold jewelry on Shopify.
        </p>

        <h2>1. The Karat Purity Master Reference Table</h2>
        <p>
          The word <em>karat</em> (spelled with a 'k', distinguishing metal purity from diamond
          carat weight) measures parts of pure gold out of 24. Divide any karat designation by 24
          to find its fine metal coefficient:
        </p>

        <div
          className="docs-table-wrap table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Karat gold purity conversion table"
        >
          <table className="docs-table">
            <thead>
              <tr>
                <th>Karat Rating</th>
                <th>Millesimal Fineness</th>
                <th>Purity Fraction</th>
                <th>Primary E-Commerce Use Cases</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>24K</strong></td>
                <td>999 / 999.9</td>
                <td>0.999 &ndash; 1.000</td>
                <td>Investment bullion bars, minted wafers, traditional wedding bands</td>
              </tr>
              <tr>
                <td><strong>22K</strong></td>
                <td>916</td>
                <td>0.916</td>
                <td>South Asian bridal sets, Middle Eastern filigree, sovereigns</td>
              </tr>
              <tr>
                <td><strong>18K</strong></td>
                <td>750</td>
                <td>0.750</td>
                <td>Luxury bridal, fine gemstone mountings, European designer jewelry</td>
              </tr>
              <tr>
                <td><strong>14K</strong></td>
                <td>585 (or 583.3)</td>
                <td>0.585</td>
                <td>The dominant North American fine jewelry standard (durability &amp; color)</td>
              </tr>
              <tr>
                <td><strong>10K</strong></td>
                <td>417</td>
                <td>0.417</td>
                <td>Minimum legal karat in the US; high-durability chains &amp; class rings</td>
              </tr>
              <tr>
                <td><strong>9K</strong></td>
                <td>375</td>
                <td>0.375</td>
                <td>Standard legal entry tier in the UK, Australia, and New Zealand</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>2. Converting Spot Price to Gram Price</h2>
        <p>
          Commodity exchanges (COMEX, LBMA) quote spot gold per troy ounce. Never use the avoirdupois
          ounce (28.35 g) found on kitchen scales. Always divide by <strong>31.1035</strong>:
        </p>
        <p>
          <code>Fine Gold Price Per Gram = Spot Price Per Troy Ounce / 31.1035</code>
        </p>
        <p>
          If live spot gold is $2,700.00/oz:
        </p>
        <p>
          <code>$2,700.00 / 31.1035 = $86.8068 per gram of 24K gold</code>
        </p>

        <h2>3. Calculating Karat Price per Gram</h2>
        <p>
          To find the metal value for an 18K or 14K item, multiply the 24K gram price by the purity fraction:
        </p>
        <ul>
          <li><strong>22K Gram Value:</strong> $86.81 &times; 0.916 = <strong>$79.52 / gram</strong></li>
          <li><strong>18K Gram Value:</strong> $86.81 &times; 0.750 = <strong>$65.11 / gram</strong></li>
          <li><strong>14K Gram Value:</strong> $86.81 &times; 0.585 = <strong>$50.78 / gram</strong></li>
          <li><strong>10K Gram Value:</strong> $86.81 &times; 0.417 = <strong>$36.20 / gram</strong></li>
        </ul>
        <p>
          Notice that 14K gold has almost 42% lower raw metal cost than 24K. Using the wrong
          coefficient immediately distorts pricing or erodes margins.
        </p>

        <h2>4. Handling Multi-Karat Variants on Shopify</h2>
        <p>
          Modern jewelry brands often offer the same pendant in 10K, 14K, and 18K gold. On Shopify,
          these exist as variants under a single product listing. Because each variant differs in
          both metal density and gram cost, you cannot use a simple flat surcharge.
        </p>
        <p>
          With MetalRate Sync, you set up dedicated formula presets:
        </p>
        <ul>
          <li>Create an <code>18K Fine Jewelry</code> formula with 0.750 purity, 10% making charges, and 3% wastage.</li>
          <li>Create a <code>14K Commercial</code> formula with 0.585 purity, 8% making charges, and 4% wastage.</li>
          <li>Assign variants via CSV upload or directly in the Shopify admin interface.</li>
          <li>Whenever spot rates shift, all karat variants update simultaneously in safe batch increments.</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <h3>What is the minimum legal gold karat you can sell in the United States?</h3>
        <p>
          Under FTC guidelines, 10K (41.7% pure gold) is the lowest purity that can legally be
          advertised and stamped as &ldquo;real gold&rdquo; in the United States. Anything below 10K
          cannot be labeled gold.
        </p>
        <h3>Does white gold or rose gold change the pricing formula?</h3>
        <p>
          No. 18K white gold, 18K rose gold, and 18K yellow gold all contain exactly 75.0% pure
          gold. Only the alloy metals differ (nickel/palladium for white, copper for rose). The
          fine gold content and base metal pricing calculation remain identical.
        </p>

        <BlogCta />

        <p style={{ marginTop: "32px" }}>
          <Link href="/blog">&larr; Back to all guides</Link>
        </p>
      </main>
    </>
  );
}
