import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../../blog/blog-shell";

export const metadata: Metadata = {
  title: {
    absolute: "Live Metal Rates Ticker for Shopify Themes | MetalRate",
  },
  description:
    "Add a live gold, silver, and platinum spot price ticker to your Shopify theme. Compatible with Online Store 2.0 themes, Dawn, and custom liquid sections.",
  alternates: { canonical: "/features/storefront-ticker" },
  openGraph: {
    type: "website",
    title: "Live Metal Rates Ticker for Shopify Themes | MetalRate",
    description:
      "Add a live gold, silver, and platinum spot price ticker to your Shopify theme. Compatible with Online Store 2.0 themes, Dawn, and custom liquid sections.",
    url: "https://metalratesync.com/features/storefront-ticker",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "Live Metal Rates Ticker for Shopify Themes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Metal Rates Ticker for Shopify Themes | MetalRate",
    description:
      "Add a live gold, silver, and platinum spot price ticker to your Shopify theme. Compatible with Online Store 2.0 themes, Dawn, and custom liquid sections.",
    images: ["/images/hero-feature.png"],
  },
};

const techArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Live Metal Rates Storefront Ticker for Shopify Online Store 2.0",
  description:
    "Enhance customer confidence and display real-time precious metal market rates directly on your Shopify storefront with customizable ticker banners.",
  image: "https://metalratesync.com/images/hero-feature.png",
  datePublished: "2026-11-15",
  dateModified: "2026-11-15",
  mainEntityOfPage: "https://metalratesync.com/features/storefront-ticker",
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
      name: "Features",
      item: "https://metalratesync.com/features",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Storefront Ticker",
      item: "https://metalratesync.com/features/storefront-ticker",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does the storefront ticker slow down my Shopify store?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The ticker script weighs less than 12KB, loads asynchronously via CDN after initial DOM paint, and carries zero layout shift (CLS), preserving your Core Web Vitals.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize the ticker colors to match my brand?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The ticker widget provides extensive visual controls inside the Shopify Theme Editor, allowing you to configure font styling, background tints, border radiance, and accent highlights.",
      },
    },
    {
      "@type": "Question",
      name: "Can I display prices in currencies other than USD?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MetalRate Sync supports multi-currency conversions including EUR, GBP, CAD, AUD, and INR, automatically synchronizing with your store's native currency settings.",
      },
    },
  ],
};

export default function StorefrontTickerFeaturePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
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
        <h1>Live Precious Metal Spot Rates Ticker for Shopify Themes</h1>
        <p className="legal-date">Theme Extension &bull; Storefront Conversion Feature &bull; 6 min read</p>

        <p>
          In precious metals e-commerce, customer trust is the primary driver of conversion. High-ticket
          buyers purchasing bullion coins or fine gold jewelry scrutinize product pricing against
          live market spot benchmarks.
        </p>

        <p>
          Displaying an authentic, real-time spot rate ticker on your storefront signals price transparency,
          legitimizes your product formulas, and creates a compelling market trading atmosphere that
          encourages immediate checkout before rates fluctuate.
        </p>

        <p>
          MetalRate Sync includes a native Shopify Theme App Extension allowing you to embed a sleek,
          performant spot rate banner anywhere on your Online Store 2.0 theme.
        </p>

        <h2>Why Display a Live Spot Ticker on Your Storefront?</h2>
        <p>
          Fine jewelry shoppers and bullion investors behave differently from traditional apparel buyers:
        </p>
        <ul>
          <li>
            <strong>Transparent Fair-Market Verification:</strong> Shoppers understand that your prices
            reflect genuine commodity market value rather than arbitrary retail markups.
          </li>
          <li>
            <strong>Urgency &amp; Conversion Velocity:</strong> Visible intraday spot fluctuations create
            natural commercial urgency, prompting customers to complete orders during price dips.
          </li>
          <li>
            <strong>Professional Brand Authority:</strong> Giving your store the aesthetic credibility of
            major exchanges and established bullion houses establishes instant consumer confidence.
          </li>
        </ul>

        <h2>Core Features of the MetalRate Sync Ticker Widget</h2>

        <h3>1. Instant Real-Time Institutional Spot Feeds</h3>
        <p>
          The ticker displays live benchmark spot rates for Gold, Silver, Platinum, and Palladium directly
          from institutional LBMA and COMEX market feeds, refreshing on high-speed global CDNs.
        </p>

        <h3>2. Fully Customizable Theme Integration (OS 2.0 &amp; Dawn)</h3>
        <p>
          Built natively using Shopify&rsquo;s Theme App Extension architecture, the ticker embeds cleanly
          into any Online Store 2.0 theme (including Dawn, Prestige, Impulse, and custom headless builds)
          without modifying theme code or leaving orphaned liquid tags when uninstalled.
        </p>

        <h3>3. Lightweight &amp; Zero Impact on Page Speed (Zero CLS)</h3>
        <p>
          Performance is paramount for search ranking and conversion. The ticker widget is ultra-lightweight
          (under 12KB), loads asynchronously, and reserves exact container dimensions to guarantee
          <strong>zero Cumulative Layout Shift (CLS = 0)</strong> and preserve perfect Lighthouse scores.
        </p>

        <h3>4. Mobile-Responsive Header or Announcement Bar Mode</h3>
        <p>
          Display the ticker as a compact announcement bar, a floating pill badge, a dedicated homepage
          section, or a subtle widget in your site footer. Mobile viewports feature touch-friendly smooth
          scrolling ticker strips.
        </p>

        <h2>Supported Display Formats &amp; Units</h2>
        <p>
          Customize display units to match your target regional market and customer expectations:
        </p>

        <div
          className="docs-table-wrap table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Supported display formats and units for storefront ticker"
        >
          <table className="docs-table">
            <thead>
              <tr>
                <th>Unit / Purity</th>
                <th>Target Market</th>
                <th>Standard Display Format</th>
                <th>Supported Metals</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Troy Ounces ($/ozt)</strong></td>
                <td>US / UK Bullion Dealers</td>
                <td>Gold: $2,654.20/oz &bull; Silver: $31.40/oz</td>
                <td>Gold, Silver, Platinum, Palladium</td>
              </tr>
              <tr>
                <td><strong>Grams ($/g)</strong></td>
                <td>European / US Fine Jewelry</td>
                <td>Gold 24K: $85.34/g &bull; 18K: $64.01/g &bull; 14K: $49.92/g</td>
                <td>Gold, Silver, Platinum</td>
              </tr>
              <tr>
                <td><strong>Tolas ($/tola)</strong></td>
                <td>South Asian Bridal &amp; Bullion</td>
                <td>Gold 22K (916): $912.40/tola</td>
                <td>Gold, Silver</td>
              </tr>
              <tr>
                <td><strong>10 Gram Baskets</strong></td>
                <td>Middle Eastern &amp; Asian Exchanges</td>
                <td>Gold 24K: $853.40 / 10g</td>
                <td>Gold, Silver</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Frequently Asked Questions</h2>
        <h3>Does the storefront ticker slow down my Shopify store?</h3>
        <p>
          No. The ticker script weighs less than 12KB, loads asynchronously via CDN after initial DOM
          paint, and carries zero layout shift (CLS), preserving your Core Web Vitals.
        </p>
        <h3>Can I customize the ticker colors to match my brand?</h3>
        <p>
          Yes. The ticker widget provides extensive visual controls inside the Shopify Theme Editor,
          allowing you to configure font styling, background tints, border radiance, and accent highlights.
        </p>
        <h3>Can I display prices in currencies other than USD?</h3>
        <p>
          Yes. MetalRate Sync supports multi-currency conversions including EUR, GBP, CAD, AUD, and INR,
          automatically synchronizing with your store&rsquo;s native currency settings.
        </p>

        <h2>Add a Live Rate Ticker to Your Store Today</h2>
        <p>
          Install MetalRate Sync from the Shopify App Store and enable the live spot ticker in your
          Theme Editor in under two minutes &mdash; no custom code required.
        </p>

        <BlogCta />

        <p style={{ marginTop: "32px" }}>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}