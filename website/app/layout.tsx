import type { Metadata } from "next";
import { Inter, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SmoothAnchorNav } from "./smooth-anchor-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://metalratesync.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shopify Gold & Silver Price Sync: Live Rates | MetalRate",
    template: "%s | MetalRate",
  },
  description:
    "Automatically update Shopify prices from live gold, silver, platinum and palladium spot rates. Built for bullion and jewelry stores. Free 14-day trial.",
  keywords: [
    "shopify gold price app",
    "live metal rates shopify",
    "bullion price sync",
    "jewelry price automation",
    "gold rate updater shopify",
    "precious metals pricing app",
    "price jewelry by weight shopify",
    "shopify bullion spot price",
  ],
  alternates: { canonical: "/" },
  verification: {
    google: "jW4hyACZItFlrrPT1huGCPlSskup8UPDxAzy19x8OtE",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MetalRate Sync",
    title: "Shopify Gold & Silver Price Sync: Live Rates | MetalRate",
    description:
      "Automatically update Shopify prices from live gold, silver, platinum and palladium spot rates. Built for bullion and jewelry stores. Free 14-day trial.",
    images: [
      {
        url: "/images/hero-feature.png",
        width: 1600,
        height: 900,
        alt: "MetalRate Sync Shopify App Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify Gold & Silver Price Sync: Live Rates | MetalRate",
    description:
      "Reprice your whole catalog from live metal rates. Preview every change before it happens.",
    images: ["/images/hero-feature.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MetalRate Sync",
  alternateName: "Ounce: MetalRate Sync",
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  description:
    "Shopify app that automatically reprices products from live gold, silver, platinum and palladium rates, with preview-before-commit and a per-variant audit trail.",
  url: SITE_URL,
  installUrl: "https://apps.shopify.com/metalrate-sync",
  offers: [
    { "@type": "Offer", name: "Starter", price: "30", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro", price: "50", priceCurrency: "USD" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${plexMono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <SmoothAnchorNav />
        <Analytics />
      </body>
    </html>
  );
}
