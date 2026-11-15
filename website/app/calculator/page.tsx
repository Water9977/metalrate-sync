import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav, BlogCta } from "../blog/blog-shell";
import { getLiveRates } from "../lib/rates";
import { CalculatorWidget, type RateItem } from "./calculator-widget";

export const metadata: Metadata = {
  title: {
    absolute: "Jewelry & Bullion Price Calculator: Formulas | MetalRate",
  },
  description:
    "Calculate live gold, silver, and platinum jewelry prices by weight. Compute karat purity, making charges, wastage, and retail margins in real time.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    type: "website",
    title: "Jewelry & Bullion Price Calculator: Formulas | MetalRate",
    description:
      "Calculate live gold, silver, and platinum jewelry prices by weight. Compute karat purity, making charges, wastage, and retail margins in real time.",
    url: "https://metalratesync.com/calculator",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "Jewelry & Bullion Price Calculator for Shopify",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jewelry & Bullion Price Calculator: Formulas | MetalRate",
    description:
      "Calculate live gold, silver, and platinum jewelry prices by weight. Compute karat purity, making charges, wastage, and retail margins in real time.",
    images: ["/images/hero-feature.png"],
  },
};

const DEFAULT_RATES: RateItem[] = [
  { metal: "GOLD", pricePerOzt: 4017.99 },
  { metal: "SILVER", pricePerOzt: 55.91 },
  { metal: "PLATINUM", pricePerOzt: 1597.66 },
  { metal: "PALLADIUM", pricePerOzt: 1249.71 },
];

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Jewelry and Bullion Live Price Calculator",
  url: "https://metalratesync.com/calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Interactive pricing calculator for precious metals e-commerce: gold, silver, platinum, karat purities, making charges, and wastage allowances.",
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
      "name": "Pricing Calculator",
      "item": "https://metalratesync.com/calculator",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does this calculator determine live gold price per gram?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The calculator divides the live market spot price per troy ounce by 31.1035 grams, then multiplies by the selected purity fraction (0.999 for 24K, 0.916 for 22K, 0.750 for 18K, 0.585 for 14K, and 0.417 for 10K).",
      },
    },
    {
      "@type": "Question",
      name: "Can I automatically sync this formula to my Shopify product catalog?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MetalRate Sync applies this exact formula to all tracked variants in your Shopify store, automatically updating retail prices whenever live spot rates change without manual calculations.",
      },
    },
  ],
};

export default async function CalculatorPage() {
  const live = await getLiveRates();
  const rates: RateItem[] = live?.ticks
    ? live.ticks.map((t) => ({
        metal: t.metal,
        pricePerOzt: parseFloat(t.price.replace(/,/g, "")) || 0,
      }))
    : DEFAULT_RATES;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
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
        <h1>Jewelry &amp; Bullion Live Price Calculator</h1>
        <p className="legal-date">Interactive E-Commerce Pricing Tool &bull; Real-Time Spot Data</p>

        <p>
          Calculate retail jewelry and bullion prices based on live precious metal spot rates.
          Adjust metal, karat purity, weight units, craftsmanship making charges, casting wastage,
          and retail markup to see instant cost and price breakdowns.
        </p>

        <CalculatorWidget initialRates={rates} />

        <h2>Understanding the Calculation Engine</h2>
        <p>
          Commercial precious metal pricing requires a sequential multi-step formula.
          Every component of the calculation addresses a distinct manufacturing or market factor:
        </p>

        <div
          className="docs-table-wrap table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Jewelry pricing formula breakdown"
        >
          <table className="docs-table">
            <thead>
              <tr>
                <th>Factor</th>
                <th>Mathematical Role</th>
                <th>Standard Range</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Spot Price per Troy Oz</strong></td>
                <td>Global benchmark rate for pure bullion (LBMA / COMEX)</td>
                <td>Fluctuates continuously</td>
              </tr>
              <tr>
                <td><strong>Gram Conversion</strong></td>
                <td>Spot price divided by 31.1035 grams per troy ounce</td>
                <td>Deterministic standard</td>
              </tr>
              <tr>
                <td><strong>Purity Fraction</strong></td>
                <td>Actual pure metal content (e.g. 14K = 14/24 = 58.5%)</td>
                <td>0.417 to 0.999</td>
              </tr>
              <tr>
                <td><strong>Wastage Allowance</strong></td>
                <td>Compensates for lost gold particles during polishing &amp; filing</td>
                <td>2.0% &ndash; 6.0%</td>
              </tr>
              <tr>
                <td><strong>Making Charges</strong></td>
                <td>Labor, CAD design, stone setting, and bench craftsmanship</td>
                <td>$5 &ndash; $25/g or 8% &ndash; 25%</td>
              </tr>
              <tr>
                <td><strong>Retail Markup</strong></td>
                <td>Wholesale or retail gross profit margin</td>
                <td>15% &ndash; 60%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Frequently Asked Questions</h2>
        <h3>How often do live spot rates update?</h3>
        <p>
          Spot rates reflect global market prices during active trading hours. In MetalRate Sync,
          scheduled price sync runs can reprice your Shopify catalog up to five times a day.
        </p>
        <h3>Does this calculator work for silver and platinum?</h3>
        <p>
          Yes. Select Silver (Fine 999 or Sterling 925), Platinum (Pt950), or Palladium (Pd950)
          above to calculate prices across any precious metal.
        </p>

        <BlogCta />

        <p style={{ marginTop: "32px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}
