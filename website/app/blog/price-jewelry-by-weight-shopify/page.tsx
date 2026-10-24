import type { Metadata } from "next";
import Link from "next/link";
import { BlogCta, BlogNav } from "../blog-shell";
import { POSTS } from "../posts";

const post = POSTS[1];

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
          Pricing jewelry by weight means the price follows the metal. When the
          market moves, so should your price. The method is the same for a gold
          ring, a silver chain or a platinum band. Here it is, step by step.
        </p>

        <h2>Step 1: Get the metal value per gram</h2>
        <p>
          Spot prices are quoted per troy ounce. One troy ounce is 31.1035
          grams (not the 28.35 grams of an ordinary ounce, a common mix-up).
          Divide the spot price by 31.1035 to get the price per gram.
        </p>
        <p>
          For example, if spot gold is $3,110.35 per troy ounce, that is $100
          per gram. These numbers are illustrative, chosen to keep the maths
          simple, not a current price.
        </p>
        <p>
          Some markets sell by other units. One tola is about 11.6638 grams,
          and pennyweight (dwt) is one twentieth of a troy ounce.
        </p>

        <h2>Step 2: Adjust for purity</h2>
        <p>
          The spot price is for pure metal. Jewelry is usually an alloy, so you
          multiply by the purity fraction:
        </p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Alloy</th>
                <th>Purity fraction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>24K gold (fine)</td>
                <td>0.999</td>
              </tr>
              <tr>
                <td>22K gold</td>
                <td>0.916</td>
              </tr>
              <tr>
                <td>18K gold</td>
                <td>0.750</td>
              </tr>
              <tr>
                <td>14K gold</td>
                <td>0.585</td>
              </tr>
              <tr>
                <td>10K gold</td>
                <td>0.417</td>
              </tr>
              <tr>
                <td>Sterling silver (925)</td>
                <td>0.925</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          A frequent mistake is using the 24K rate for an 18K piece. That
          overprices it by a third.
        </p>

        <h2>Step 3: Add your own charges</h2>
        <p>
          Metal value is only the start. Most sellers then add some or all of
          these, depending on how they run their business:
        </p>
        <ul>
          <li>
            <strong>Making charge:</strong> the cost of labor and craft, as a
            percentage or a flat amount.
          </li>
          <li>
            <strong>Wastage:</strong> metal lost in manufacturing, usually a
            percentage.
          </li>
          <li>
            <strong>Markup:</strong> your margin.
          </li>
          <li>
            <strong>Tax:</strong> where it applies to your sales.
          </li>
        </ul>

        <h2>A worked example</h2>
        <p>
          An 18K gold pendant weighing 5 grams, using the illustrative $100 per
          gram rate from above, with these example charges (yours will differ):
        </p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Calculation</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Metal value</td>
                <td>5 g &times; 0.750 &times; $100</td>
                <td>$375.00</td>
              </tr>
              <tr>
                <td>Making charge</td>
                <td>12% of metal value</td>
                <td>$45.00</td>
              </tr>
              <tr>
                <td>Wastage</td>
                <td>3% of metal value</td>
                <td>$11.25</td>
              </tr>
              <tr>
                <td>Subtotal</td>
                <td></td>
                <td>$431.25</td>
              </tr>
              <tr>
                <td>Markup</td>
                <td>10% of subtotal</td>
                <td>$43.13</td>
              </tr>
              <tr>
                <td>Price before tax</td>
                <td></td>
                <td>$474.38</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          If spot gold rises 2%, the metal value rises by $7.50 and every
          charge that is a percentage of it moves too. Do that across hundreds
          of products and you can see why doing it by hand stops working.
        </p>

        <h2>Step 4: Keep it current</h2>
        <p>
          The formula is easy. Keeping hundreds of prices current as the
          market moves is the hard part. Our guide to{" "}
          <Link href="/blog/update-gold-prices-on-shopify-automatically">
            updating gold prices on Shopify automatically
          </Link>{" "}
          covers the options.
        </p>

        <BlogCta />

        <p>
          <Link href="/blog">&larr; All posts</Link>
        </p>
      </main>
    </>
  );
}
