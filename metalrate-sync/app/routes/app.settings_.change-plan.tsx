import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getBillingStatus, planSelectionUrl } from "../services/billing.server";

/**
 * Resource route (no UI) — exists purely to reuse the exact iframe-safe
 * redirect() mechanism already proven live for the "no active plan" case
 * (app.tsx's layout loader) for the "change an EXISTING plan" case too.
 *
 * Real App Store review bounce (1.2.3 "Allow pricing plan changes",
 * 2026-07-27): the Settings page's "Upgrade to Pro" button used a raw
 * client-side `window.open(url, "_top")`, which rendered a blank
 * screen/error for the reviewer. Root cause: our own verification only
 * ever tested the automatic "no plan yet" redirect (app.tsx's loader,
 * confirmed live 2026-07-24) -- changing an ALREADY-active plan is a
 * genuinely different flow that goes through a merchant clicking a button
 * inside the app, and that path used a different, untested, less-proven
 * navigation mechanism. Routing it through a loader-issued redirect()
 * instead means it's the exact same code path that's already confirmed
 * working, not a new one.
 *
 * Also fixes the missing downgrade path: this route doesn't care what
 * tier the shop is currently on, it always sends them to Shopify's
 * hosted plan-selection page, which itself supports moving in either
 * direction. Settings now shows one "Change plan" button regardless of
 * tier instead of an upgrade-only button that only ever appeared for
 * Starter shops.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, redirect } = await authenticate.admin(request);
  const billing = await getBillingStatus(admin);
  return redirect(planSelectionUrl(session.shop, billing.appHandle), {
    target: "_top",
  });
};
