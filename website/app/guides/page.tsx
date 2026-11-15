import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav } from "../blog/blog-shell";

export const metadata: Metadata = {
  title: {
    absolute: "Precious Metals Guides for Shopify Stores | MetalRate",
  },
  description:
    "Comprehensive guides for selling gold, silver, and precious metals on Shopify. Master bullion repricing, high-risk merchant compliance, and jewelry math.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    title: "Precious Metals Guides for Shopify Stores | MetalRate",
    description:
      "Comprehensive guides for selling gold, silver, and precious metals on Shopify. Master bullion repricing, high-risk merchant compliance, and jewelry math.",
    url: "https://metalratesync.com/guides",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "Precious Metals Shopify Guides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precious Metals Guides for Shopify Stores | MetalRate",
    description:
      "Comprehensive guides for selling gold, silver, and precious metals on Shopify. Master bullion repricing, high-risk merchant compliance, and jewelry math.",
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
      name: "Guides",
      item: "https://metalratesync.com/guides",
    },
  ],
};

const GUIDES = [
  {
    slug: "sell-gold-silver-bullion-shopify",
    title: "How to Sell Gold & Silver Bullion on Shopify (2026 Guide)",
    description:
      "A complete operational playbook for bullion dealers: navigating high-risk merchant accounts, real-time spot repricing, checkout volatility locks, and armored transit insurance.",
    cta: "Read Bullion Selling Guide",
  },
  {
    slug: "jewelry-pricing-formula",
    title: "The Commercial Jewelry Pricing Formula (Complete Guide)",
    description:
      "Master the exact mathematical formula used by commercial jewelry manufacturers: fine metal content, karat purities, casting wastage allowances, making charges, and retail markup.",
    cta: "Read Jewelry Pricing Guide",
  },
];

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>Precious Metals E-Commerce Guides</h1>
        <p className="legal-date">Strategic operational playbooks for fine jewelry and bullion retailers</p>

        <p>
          Selling fine jewelry, coins, and physical bullion on Shopify demands specialized operational
          knowledge that standard e-commerce tutorials never cover. Because commodity spot prices fluctuate
          continuously across international markets (LBMA and COMEX), maintaining static catalog prices
          exposes merchants to catastrophic margin losses during market rallies.
        </p>

        <p>
          In addition, high-ticket precious metals transactions carry stringent compliance requirements.
          Standard payment gateways like Stripe and Shopify Payments restrict investment-grade bullion bars
          and coins, requiring specialized high-risk merchant underwriting, dual cash-discount checkout
          structures, and strict Anti-Money Laundering (AML) reporting under FinCEN and IRS Form 8300 guidelines.
        </p>

        <p>
          Our comprehensive guides provide the exact blueprints, legal guardrails, and mathematical models
          needed to run a profitable, scalable, and fully compliant precious metals e-commerce business.
          Whether you are an independent bench jeweler pricing rings by karat and gram weight, or an
          established coin dealership fulfilling wholesale bullion shipments, explore our in-depth guides below.
        </p>

        <div style={{ display: "grid", gap: "24px", marginTop: "32px" }}>
          {GUIDES.map((g) => (
            <article
              key={g.slug}
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
                  href={`/guides/${g.slug}`}
                  style={{ color: "var(--text, #ede9df)", borderBottom: "none" }}
                >
                  {g.title}
                </Link>
              </h2>
              <p style={{ color: "var(--silver, #c9cdd3)", fontSize: "0.95rem", marginBottom: "14px", lineHeight: 1.6 }}>
                {g.description}
              </p>
              <Link
                href={`/guides/${g.slug}`}
                style={{
                  color: "var(--gold, #e8b54a)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  borderBottom: "1px solid var(--gold-deep, #8a6519)",
                }}
              >
                {g.cta} &rarr;
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