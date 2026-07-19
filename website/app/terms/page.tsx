import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for the MetalRate Sync Shopify application.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <main className="legal">
      <h1>Terms of Service</h1>
      <p className="legal-date">Last updated: July 19, 2026</p>

      <p>
        These terms govern your use of MetalRate Sync (&quot;the app&quot;), a
        Shopify application that updates product prices based on
        precious-metal market rates. By installing or using the app you agree
        to these terms.
      </p>

      <h2>1. The service</h2>
      <p>
        The app computes product prices from pricing formulas you configure
        (weight, purity, charges, markup, tax) combined with metal rates from
        a commercial rate feed or rates you enter manually, and writes those
        prices to your Shopify store — after your explicit approval in manual
        mode, or on a fixed schedule if you enable automatic syncing.
      </p>

      <h2>2. Your responsibility for prices</h2>
      <ul>
        <li>
          <strong>You own your prices.</strong> The app executes the formulas
          you configure. You are responsible for verifying that formulas,
          weights, purities, and charges are correct before applying them to a
          live store.
        </li>
        <li>
          Market rates are sourced from third-party feeds and may be delayed,
          cached, or occasionally unavailable. The app shows the timestamp of
          the rates it uses; verify them before relying on them for
          high-value decisions.
        </li>
        <li>
          The app is a pricing automation tool. It is not financial advice,
          not a trading platform, and not a guarantee of margin or profit.
        </li>
      </ul>

      <h2>3. Billing</h2>
      <p>
        Paid plans are billed through Shopify&apos;s app billing system on the
        terms shown at install time, including any free-trial period. You can
        cancel any time by uninstalling the app; Shopify handles proration and
        refunds under its own policies.
      </p>

      <h2>4. Acceptable use</h2>
      <ul>
        <li>Don&apos;t attempt to disrupt, overload, or reverse-engineer the service.</li>
        <li>Don&apos;t use the app to violate Shopify&apos;s terms or applicable law.</li>
      </ul>

      <h2>5. Availability and support</h2>
      <p>
        We aim for continuous availability but do not guarantee uninterrupted
        service. Scheduled syncs depend on the app&apos;s servers and
        Shopify&apos;s API being reachable. Support is provided by email at
        the address below.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the app is provided &quot;as
        is&quot; without warranties of any kind. We are not liable for
        indirect or consequential damages, including lost profits arising
        from price changes, market movements, delayed rates, or
        misconfigured formulas. Our total liability for any claim is limited
        to the fees you paid for the app in the three months preceding the
        claim.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the app at any time by uninstalling it. We may
        suspend or terminate service for breach of these terms. Data handling
        on termination is described in the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms; material changes will be reflected in the
        &quot;last updated&quot; date. Continued use after a change
        constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:metalratesync@gmail.com">metalratesync@gmail.com</a>
      </p>

      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
