import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../blog-shell";
import { POSTS } from "../posts";

const post = POSTS[0];

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.description,
    url: `https://metalratesync.com/blog/${post.slug}`,
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.date,
  mainEntityOfPage: `https://metalratesync.com/blog/${post.slug}`,
  author: { "@type": "Organization", name: "MetalRate Sync" },
  publisher: { "@type": "Organization", name: "MetalRate Sync" },
};

export default function Post() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogNav />
      <main className="legal">
        <h1>{post.title}</h1>
        <p className="legal-date">Published {post.date}</p>

        <p>
          If you sell gold, silver or platinum by weight on Shopify, every
          price in your store is a snapshot of a market that keeps moving.
          Shopify does not have a built-in setting that ties a product price
          to a live metal rate, so you have to do something to keep prices
          current. There are three realistic options.
        </p>

        <h2>1. Edit prices by hand</h2>
        <p>
          Fine for a dozen products. Past that, it breaks down: you are doing
          arithmetic on every variant, you cannot update as often as the
          market moves, and one slip in a formula can quietly underprice a
          whole collection.
        </p>

        <h2>2. Calculate in a spreadsheet and re-import</h2>
        <p>
          Shopify can export and import products as a CSV, so you can work out
          new prices in a spreadsheet and upload the file. This scales better,
          but you repeat the whole export, calculate and upload cycle every
          time you want fresh prices, and it is easy to let it slip for days.
        </p>

        <h2>3. Use an app that calculates and updates prices</h2>
        <p>
          An app fetches the current metal rate, applies a pricing formula to
          each product you tell it to track, and writes the new prices back to
          your store, on demand or on a schedule. This is the only option that
          keeps prices current without someone sitting at the keyboard.
        </p>

        <h2>The formula is the same whichever way you do it</h2>
        <p>Whatever method you choose, the price is built the same way:</p>
        <p>
          <code>
            price = weight &times; purity &times; live rate + making + wastage
            + markup + tax
          </code>
        </p>
        <p>
          We walk through each part, with a worked example, in{" "}
          <Link href="/blog/price-jewelry-by-weight-shopify">
            how to price jewelry by weight on Shopify
          </Link>
          .
        </p>

        <h2>What to look for in an app</h2>
        <p>
          Prices are your margin, so it is worth being picky. Questions to ask
          of any app before you let it touch your catalog:
        </p>
        <ul>
          <li>
            <strong>Can I preview changes before they go live?</strong> An app
            that silently rewrites prices is a risk. You want to see old price,
            new price and percent change first.
          </li>
          <li>
            <strong>Is there a record of every change?</strong> When a price
            looks wrong, you should be able to see what changed and which rate
            was used.
          </li>
          <li>
            <strong>Can I set a floor?</strong> A stop-loss on the rate stops a
            sudden market drop from pulling prices below your cost.
          </li>
          <li>
            <strong>How do I set up a large catalog?</strong> Look for bulk
            import, and check whether it forces you to have SKUs on every
            product.
          </li>
          <li>
            <strong>Is the rate feed included?</strong> Some apps need you to
            buy a separate rate subscription.
          </li>
          <li>
            <strong>How often do prices update?</strong> Check what the plan
            allows, not just what the feature list says.
          </li>
          <li>
            <strong>What does it ask permission for?</strong> A pricing app
            should not need your customer data.
          </li>
        </ul>

        <h2>How MetalRate Sync does it</h2>
        <p>
          MetalRate Sync is built around those questions. You set up a formula
          (metal, purity, making charge, wastage, markup, tax, rounding),
          assign it to products with a weight, then preview every proposed
          price against the live rate before anything changes. Apply when you
          are happy, or switch on automatic sync: twice a day on Starter, up
          to five times a day on Pro. Every run is logged per variant with the
          exact rate used, a stop-loss floor holds prices if the market falls
          through your cost, and bulk import works even if your products have
          no SKUs. Live rates for gold, silver, platinum and palladium are
          included, and it can also show a live ticker on your storefront.
        </p>
        <p>
          Plans are $30 a month (Starter, up to 800 products) and $50 a month
          (Pro, unlimited), both with a 14-day free trial.
        </p>

        <BlogCta />

        <p>
          <Link href="/blog">&larr; All posts</Link>
        </p>
      </main>
    </>
  );
}
