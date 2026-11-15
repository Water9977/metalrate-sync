import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav } from "../blog/blog-shell";

export const metadata: Metadata = {
  title: {
    absolute: "Precious Metals Pricing Features for Shopify | MetalRate",
  },
  description:
    "Explore enterprise precious metals pricing features for Shopify: real-time spot sync, stop-loss protection, storefront ticker, and formula automation.",
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    title: "Precious Metals Pricing Features for Shopify | MetalRate",
    description:
      "Explore enterprise precious metals pricing features for Shopify: real-time spot sync, stop-loss protection, storefront ticker, and formula automation.",
    url: "https://metalratesync.com/features",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "Precious Metals Shopify Pricing Features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precious Metals Pricing Features for Shopify | MetalRate",
    description:
      "Explore enterprise precious metals pricing features for Shopify: real-time spot sync, stop-loss protection, storefront ticker, and formula automation.",
    images: ["/images/hero-feature.png"],
  },
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
      name: "Features",
      item: "https://metalratesync.com/features",
    },
  ],
};

const FEATURES = [
  {
    slug: "bullion-repricing",
    title: "Automated Bullion Repricing & Stop-Loss Protection",
    description:
      "High-frequency live spot synchronization, minimum stop-loss floor prices, dry-run preview diffs, and GraphQL bulk mutations scaling across 10,000+ variants.",
    cta: "Explore Bullion Repricing Architecture",
  },
  {
    slug: "storefront-ticker",
    title: "Live Precious Metal Spot Rates Ticker for Themes",
    description:
      "Embed a lightweight, zero-CLS live gold, silver, and platinum spot ticker directly on your Shopify Online Store 2.0 theme to build customer credibility and drive conversions.",
    cta: "Explore Storefront Ticker Features",
  },
];

export default function FeaturesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>Precious Metals E-Commerce Features</h1>
        <p className="legal-date">Engineered for accuracy, catalog scale, and gross margin protection</p>

        <p>
          MetalRate Sync equips Shopify jewelry brands, bullion dealers, and mints with enterprise-grade
          pricing infrastructure. Standard e-commerce pricing tools fail in precious metals because commodity
          spot values change continuously during global market hours, requiring dynamic recalculation
          rather than static discounts.
        </p>

        <p>
          Our platform addresses the core technical bottlenecks that plague online precious metal merchants.
          Using Shopify&rsquo;s high-throughput GraphQL Bulk Mutation APIs, MetalRate Sync updates
          catalogs containing more than 10,000 variants without triggering 429 rate limit errors or dropping
          records silently.
        </p>

        <p>
          Every pricing update incorporates essential commercial safety controls: interactive dry-run preview
          diffs let you verify price shifts before publishing, hard stop-loss floors shield physical inventory
          from market crashes, and comprehensive variant audit logs track every calculation back to its
          institutional source timestamp. Explore our core features below:
        </p>

        <div style={{ display: "grid", gap: "24px", marginTop: "32px" }}>
          {FEATURES.map((f) => (
            <article
              key={f.slug}
              style={{
                background: "var(--coal, #121212)",
                border: "1px solid var(--line, rgba(255, 255, 255, 0.12))",
                borderRadius: "var(--radius, 14px)",
                padding: "24px",
                transition: "border-color 0.2s ease",
              }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 600 }}>
                <Link
                  href={`/features/${f.slug}`}
                  style={{ color: "var(--text, #ede9df)", borderBottom: "none" }}
                >
                  {f.title}
                </Link>
              </h2>
              <p style={{ color: "var(--silver, #c9cdd3)", fontSize: "0.95rem", marginBottom: "14px", lineHeight: 1.6 }}>
                {f.description}
              </p>
              <Link
                href={`/features/${f.slug}`}
                style={{
                  color: "var(--gold, #e8b54a)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  borderBottom: "1px solid var(--gold-deep, #8a6519)",
                }}
              >
                {f.cta} &rarr;
              </Link>
            </article>
          ))}
        </div>

        <p style={{ marginTop: "40px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}