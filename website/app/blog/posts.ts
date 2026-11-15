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
] as const;
