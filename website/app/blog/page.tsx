import type { Metadata } from "next";
import Link from "next/link";
import { BlogNav } from "./blog-shell";
import { POSTS } from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides for Shopify sellers who price gold, silver and platinum by weight: keeping prices current, formulas, and avoiding margin mistakes.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <>
      <BlogNav />
      <main className="legal">
        <h1>Blog</h1>
        <p className="legal-date">
          Guides for Shopify sellers who price metal by weight
        </p>
        {POSTS.map((p) => (
          <section key={p.slug}>
            <h2>
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>
            <p>{p.description}</p>
          </section>
        ))}
        <p>
          <Link href="/">&larr; Back to home</Link>
        </p>
      </main>
    </>
  );
}
