import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav } from "./blog-shell";
import { POSTS } from "./posts";

export const metadata: Metadata = {
  title: {
    absolute: "Shopify Precious Metals Blog: Pricing & Guides | MetalRate",
  },
  description:
    "Read expert guides for Shopify merchants pricing jewelry and bullion by weight. Master live spot rate sync, pricing formulas, and inventory margins.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Shopify Precious Metals Blog: Pricing & Guides | MetalRate",
    description:
      "Read expert guides for Shopify merchants pricing jewelry and bullion by weight. Master live spot rate sync, pricing formulas, and inventory margins.",
    url: "https://metalratesync.com/blog",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "MetalRate Sync Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify Precious Metals Blog: Pricing & Guides | MetalRate",
    description:
      "Read expert guides for Shopify merchants pricing jewelry and bullion by weight. Master live spot rate sync, pricing formulas, and inventory margins.",
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
      "name": "Blog",
      "item": "https://metalratesync.com/blog",
    },
  ],
};

export default function BlogIndex() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>Precious Metals E-Commerce &amp; Pricing Blog</h1>
        <p className="legal-date">
          Technical playbooks, pricing formulas, and automation guides for Shopify merchants
        </p>

        <p>
          Managing an e-commerce catalog for precious metals is fundamentally
          different from standard retail. Gold, silver, platinum, and palladium
          spot prices fluctuate continuously throughout global trading sessions.
          When retail prices are static, merchants absorb unhedged market volatility:
          rising spot rates compress product margins, while dropping spot rates can
          render products uncompetitive against live physical dealer desks.
        </p>

        <p>
          This publication provides field-tested strategies for jewelry manufacturers,
          bullion dealers, and coin retailers operating on Shopify. We break down the
          mechanics of weight-based product pricing, karat purity fractions (from 24K
          fine gold down to 10K alloy), manufacturing wastage calculations, craftsmanship
          making charges, and automated GraphQL catalog sync architecture.
        </p>

        <h2>Featured Guides &amp; Playbooks</h2>
        {POSTS.map((p) => (
          <section key={p.slug} style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            </h3>
            <p style={{ marginTop: "4px", color: "var(--text-muted, #555)" }}>
              {p.description}
            </p>
          </section>
        ))}

        <h2>Core Principles of Dynamic Metal Pricing</h2>
        <ul>
          <li>
            <strong>Purity Calibration:</strong> Never apply raw fine gold rates directly
            to alloyed jewelry. An 18K piece contains 75.0% gold, while 14K contains 58.5%.
            Applying 24K pricing directly overcharges buyers and harms conversion rates.
          </li>
          <li>
            <strong>Stop-Loss Floors:</strong> Implement non-negotiable price floors
            to protect inventory acquisition costs against sharp intraday commodity corrections.
          </li>
          <li>
            <strong>Deterministic Audit Records:</strong> Track every price mutation with
            exact spot feed timestamps to maintain clear bookkeeping and accounting integrity.
          </li>
        </ul>

        <p style={{ marginTop: "32px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}
