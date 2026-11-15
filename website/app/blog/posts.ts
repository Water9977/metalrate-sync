export interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly seoTitle: string;
  readonly description: string;
  readonly date: string;
}

export const POSTS: readonly BlogPost[] = [
  {
    slug: "update-gold-prices-on-shopify-automatically",
    title: "How to update gold prices on Shopify automatically",
    seoTitle: "Update Gold Prices on Shopify: Live Sync Guide | MetalRate",
    description:
      "Automate Shopify jewelry and bullion prices from live gold spot rates. Learn the pricing formula, avoid margin errors, and set up live sync in minutes.",
    date: "2026-10-24",
  },
  {
    slug: "price-jewelry-by-weight-shopify",
    title: "How to price jewelry by weight on Shopify: formula and examples",
    seoTitle: "Price Jewelry by Weight on Shopify: Formulas | MetalRate",
    description:
      "Learn how to price gold, silver, and platinum jewelry by weight on Shopify. Calculate purity, making charges, wastage, and markup with clear examples.",
    date: "2026-10-24",
  },
  {
    slug: "jewelry-making-charges-wastage-shopify",
    title: "How to calculate jewelry making charges and wastage on Shopify",
    seoTitle: "Jewelry Making Charges & Wastage on Shopify | MetalRate",
    description:
      "Calculate jewelry making charges and wastage percentages on Shopify. Master live gold formula setups, weight conversions, and margin protection.",
    date: "2026-11-15",
  },
  {
    slug: "karat-gold-pricing-shopify",
    title: "How to price karat gold on Shopify: 10K, 14K, 18K, 22K, and 24K",
    seoTitle: "Karat Gold Pricing on Shopify: 10K to 24K Guide | MetalRate",
    description:
      "Set up accurate karat gold pricing on Shopify. Calculate purity fractions for 24K, 22K, 18K, 14K, and 10K gold without margin-eroding math errors.",
    date: "2026-11-15",
  },
] as const;
