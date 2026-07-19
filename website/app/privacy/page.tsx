import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MetalRate Sync handles your store's data: what we store, what we never touch, and how deletion works.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <main className="legal">
      <h1>Privacy Policy</h1>
      <p className="legal-date">Last updated: July 19, 2026</p>

      <p>
        MetalRate Sync (&quot;the app&quot;, &quot;we&quot;) is a Shopify
        application that reprices products based on live precious-metal rates.
        This policy explains what data the app touches, what it stores, and
        what happens to that data when you leave.
      </p>

      <h2>What we store</h2>
      <p>When you install the app, we store:</p>
      <ul>
        <li>Your store&apos;s myshopify.com domain.</li>
        <li>
          Your app configuration: rate source choice, base currency, schedule
          preference, pricing formulas, and per-product weight and formula
          assignments.
        </li>
        <li>
          Sync history: for each price sync, a per-variant record of the old
          price, new price, outcome (updated, skipped, or failed), and the
          metal rates used — this is the audit trail shown in the app.
        </li>
        <li>
          Product identifiers, titles, and SKUs for the products you choose to
          track — the minimum needed to match your catalog and reprice it.
        </li>
      </ul>

      <h2>What we never touch</h2>
      <ul>
        <li>
          <strong>No customer data.</strong> The app does not request, read, or
          store your customers&apos; names, email addresses, physical
          addresses, orders, or payment information. Its only Shopify
          permission is writing product prices.
        </li>
        <li>
          <strong>No payment details.</strong> Billing is handled entirely by
          Shopify. We never see a card number.
        </li>
        <li>
          <strong>No selling of data.</strong> We do not sell, rent, or share
          your data with third parties for marketing.
        </li>
      </ul>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Metal rate provider.</strong> Live rates are fetched from a
          commercial metals-price API using the app&apos;s own credentials.
          Your store data is never sent to the rate provider — requests contain
          only currency and metal codes.
        </li>
        <li>
          <strong>Hosting.</strong> The app and its database run on Railway
          (railway.com) infrastructure. Data is stored in a managed PostgreSQL
          database.
        </li>
        <li>
          <strong>Shopify.</strong> The app operates inside your Shopify admin
          under Shopify&apos;s own security model and API terms.
        </li>
      </ul>

      <h2>Data retention and deletion</h2>
      <ul>
        <li>
          When you uninstall the app, its access to your store is revoked
          immediately and scheduled syncing stops.
        </li>
        <li>
          Following Shopify&apos;s mandatory data-erasure process, all stored
          data for your shop — settings, formulas, product configuration, and
          sync history — is permanently deleted after uninstall.
        </li>
        <li>
          You can request earlier deletion at any time by emailing us (address
          below).
        </li>
      </ul>

      <h2>GDPR &amp; compliance webhooks</h2>
      <p>
        The app implements Shopify&apos;s mandatory compliance webhooks. Since
        no customer personal data is stored, customer data requests return
        nothing to export, and customer redaction requests have nothing to
        delete. Shop redaction requests permanently erase all shop-level data
        listed above.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        This website (metalratesync.com) does not set marketing cookies and
        does not run third-party ad trackers.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes materially, the &quot;last updated&quot; date
        above will change with it. Continued use of the app after a change
        constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or deletion requests:{" "}
        <a href="mailto:metalratesync@gmail.com">metalratesync@gmail.com</a>
      </p>

      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
