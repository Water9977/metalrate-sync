import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav } from "../blog/blog-shell";

export const metadata: Metadata = {
  title: {
    absolute: "Precious Metals Shopify Apps: Reviews & Guides | MetalRate",
  },
  description:
    "Compare top precious metal pricing apps for Shopify. Discover reliable alternatives, feature comparisons, and migration playbooks for jewelry dealers.",
  alternates: { canonical: "/vs" },
  openGraph: {
    type: "website",
    title: "Precious Metals Shopify Apps: Reviews & Guides | MetalRate",
    description:
      "Compare top precious metal pricing apps for Shopify. Discover reliable alternatives, feature comparisons, and migration playbooks for jewelry dealers.",
    url: "https://metalratesync.com/vs",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "Shopify Precious Metals Apps Comparisons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precious Metals Shopify Apps: Reviews & Guides | MetalRate",
    description:
      "Compare top precious metal pricing apps for Shopify. Discover reliable alternatives, feature comparisons, and migration playbooks for jewelry dealers.",
    images: ["/images/hero-feature.png"],
  },
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
      "name": "Comparisons",
      "item": "https://metalratesync.com/vs",
    },
  ],
};

const COMPARISONS = [
  {
    slug: "shopify-precious-metals-apps",
    title: "Shopify Precious Metals Apps: 2026 Comparison & Benchmark",
    description:
      "An objective breakdown of all 18 precious metal repricing apps on the Shopify App Store. Compare bulk sync reliability, preview before commit, stop-loss protection, and pricing.",
  },
  {
    slug: "gold-feed-alternative",
    title: "Gold Feed Inc Alternative for Shopify: Live Sync at Scale",
    description:
      "Why bullion dealers and jewelry manufacturers are switching away from the 2.8-star incumbent Gold Feed Inc to MetalRate Sync for reliable bulk updates and audit trails.",
  },
];

export default function ComparisonsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>Shopify Precious Metals Pricing App Comparisons</h1>
        <p className="legal-date">
          Objective architectural reviews, competitor benchmarks, and migration guides
        </p>

        <p>
          Selecting an automated pricing tool for your Shopify store directly impacts your
          gross margins, inventory safety, and customer trust. Unlike ordinary retail where
          prices remain constant for seasons, precious metal e-commerce requires constant
          synchronization against volatile live market feeds (Gold, Silver, Platinum, Palladium).
        </p>

        <p>
          Unfortunately, many tools in the Shopify App Store were built on legacy architectures.
          They update products one by one, hitting API limits and failing silently. When a
          market rally happens, incomplete updates leave portions of your catalog underpriced,
          allowing consumers to purchase below replacement cost.
        </p>

        <h2>Our Independent Testing &amp; Evaluation Criteria</h2>
        <p>
          We benchmark every competing precious metals application on Shopify across four
          rigorous operational criteria:
        </p>
        <ul>
          <li>
            <strong>Scale &amp; API Rate Limit Safety:</strong> Can the app push updates to
            5,000+ variants without triggering 429 throttle timeouts or dropping rows silently?
          </li>
          <li>
            <strong>Preview Before Commit:</strong> Does the merchant receive a full dry-run
            diff showing exact dollar changes before any mutation goes live on the storefront?
          </li>
          <li>
            <strong>Per-Variant Audit Logging:</strong> Does the tool record which spot feed
            timestamp was used for every calculation, ensuring clear bookkeeping and order reconciliation?
          </li>
          <li>
            <strong>Formula Flexibility:</strong> Does the system support karat purity fractions
            (24K down to 10K), making charges ($ flat and % metal), wastage, and stop-loss floors?
          </li>
        </ul>

        <h2>Featured Comparisons &amp; Migration Guides</h2>
        {COMPARISONS.map((c) => (
          <section key={c.slug} style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
              <Link href={`/vs/${c.slug}`}>{c.title}</Link>
            </h3>
            <p style={{ marginTop: "4px", color: "var(--text-muted, #555)" }}>
              {c.description}
            </p>
          </section>
        ))}

        <h2>Migration Assistance</h2>
        <p>
          Transitioning from an incumbent tool like Gold Feed Inc, GPE, or custom scripts is
          straightforward. Because MetalRate Sync identifies products using native Shopify IDs,
          merchants never need to restructure existing SKUs or rebuild theme code.
        </p>

        <p style={{ marginTop: "32px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}
