import type { Metadata } from "next";
import { Inter, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
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
    default: "MetalRate Sync — Live gold & silver price sync for Shopify",
    template: "%s — MetalRate Sync",
  },
  description:
    "MetalRate Sync reprices your Shopify catalog from live gold, silver, platinum and palladium rates — with a preview before anything changes and a full audit trail of every sync.",
  keywords: [
    "shopify gold price app",
    "live metal rates shopify",
    "bullion price sync",
    "jewelry price automation",
    "gold rate updater shopify",
    "precious metals pricing app",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MetalRate Sync",
    title: "MetalRate Sync — Live gold & silver price sync for Shopify",
    description:
      "Reprice your whole catalog from live metal rates. Preview every change before it happens. Built for bullion dealers and by-weight jewelers.",
    images: [{ url: "/images/hero-feature.png", width: 1600, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MetalRate Sync — Live gold & silver price sync for Shopify",
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
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  description:
    "Shopify app that automatically reprices products from live gold, silver, platinum and palladium rates, with preview-before-commit and a per-variant audit trail.",
  url: SITE_URL,
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
      </body>
    </html>
  );
}
