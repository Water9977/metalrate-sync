import Image from "next/image";
import Link from "next/link";

const APP_STORE_URL = "https://apps.shopify.com/metalrate-sync";

export function BlogNav() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/images/logo.png" alt="" width={30} height={30} />
          Ounce: MetalRate Sync
        </Link>
        <div className="nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <a
          className="nav-cta"
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Install on Shopify
        </a>
      </div>
    </nav>
  );
}

export function BlogCta() {
  return (
    <div className="docs-callout">
      MetalRate Sync keeps your Shopify prices in step with live gold, silver,
      platinum and palladium rates, and shows you every change before it
      happens. 14-day free trial.{" "}
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
        See it on the Shopify App Store
      </a>
      .
    </div>
  );
}
