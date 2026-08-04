/**
 * Plan detection and enforcement for Shopify App Pricing.
 *
 * No Partner API, no separate credentials. Confirmed by reading the actual
 * installed @shopify/shopify-api source (billing/check.js): the framework's
 * own billing.check() queries Admin GraphQL's currentAppInstallation --
 * Shopify App Pricing subscriptions are visible there too, not only through
 * the Partner API. This module calls that same field directly so one code
 * path works both in live routes (authenticate.admin) and the background
 * scheduler (unauthenticated.admin, which has no `billing` helper at all
 * since it isn't tied to a live request).
 *
 * Query validated against the live Admin GraphQL schema via the Shopify
 * dev MCP before being written here -- not guessed.
 */

export type PlanTier = "starter" | "pro";

export interface PlanLimits {
  /** null = unlimited */
  skuCap: number | null;
  scheduleIntervalMinutes: number;
}

// Keys here must match the plan's "Plan name for merchant invoices" set in
// the Partner Dashboard exactly (case-insensitively) -- AppSubscription.name
// is the only signal available to tell plans apart from Admin GraphQL. If
// the Dashboard plan name is ever renamed, update PLAN_NAME_TO_TIER too.
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: { skuCap: 800, scheduleIntervalMinutes: 720 }, // 2x/day
  pro: { skuCap: null, scheduleIntervalMinutes: 288 }, // 5x/day
};

const PLAN_NAME_TO_TIER: Record<string, PlanTier> = {
  starter: "starter",
  pro: "pro",
};

/**
 * Tier applied when a shop has a genuinely ACTIVE subscription whose plan
 * name we don't recognize. Starter is the deliberate choice: it's the
 * conservative option (real limits still apply) while still granting full
 * access to the app.
 */
const FALLBACK_TIER: PlanTier = "starter";

/**
 * Resolve a Shopify plan name to one of our tiers.
 *
 * Matching is deliberately forgiving. The only signal Admin GraphQL gives us
 * for telling plans apart is the human-entered `AppSubscription.name` from
 * the Partner Dashboard, and that string is one rename away from silently
 * breaking access for every paying merchant. Exact match first, then a
 * word-boundary contains check so "Starter Plan", "Ounce Starter" or
 * "Pro (Monthly)" still resolve correctly instead of falling through.
 *
 * Returns null only when the name resembles no known tier at all -- the
 * caller decides what to do with that, and per requirePlanOrRedirect it is
 * never "lock the merchant out".
 */
function resolveTier(subscriptionName: string): PlanTier | null {
  const normalized = subscriptionName.trim().toLowerCase();
  const exact = PLAN_NAME_TO_TIER[normalized];
  if (exact) return exact;

  // Check "pro" before "starter"? No -- they can't both appear in a sane
  // plan name, and checking in declaration order keeps this predictable.
  for (const [key, tier] of Object.entries(PLAN_NAME_TO_TIER)) {
    if (new RegExp(`\\b${key}\\b`).test(normalized)) return tier;
  }
  return null;
}

interface AdminClient {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
}

export interface BillingStatus {
  /**
   * The tier whose limits apply. null means one thing only: this shop has NO
   * active subscription at all. An active subscription always yields a
   * usable tier, even when its plan name is unrecognized -- see
   * FALLBACK_TIER.
   */
  tier: PlanTier | null;
  subscriptionName: string | null;
  /**
   * False when the shop is subscribed but the plan name didn't map to a
   * known tier, so FALLBACK_TIER's limits were applied. Surfaced in Settings
   * so an operator can spot a Dashboard/code mismatch instead of merchants
   * quietly getting the wrong limits.
   */
  isRecognizedPlan: boolean;
  appHandle: string;
}

const BILLING_STATUS_QUERY = `#graphql
  query metalRateSyncBillingStatus {
    currentAppInstallation {
      app {
        handle
      }
      activeSubscriptions {
        name
        status
        test
      }
    }
  }
`;

/**
 * Single source of truth for "does this shop have an active plan, and
 * which one." Always fetched fresh, never cached -- this gates real
 * access; a stale cache could wrongly let a canceled shop keep syncing or
 * wrongly lock out someone who just paid. isTest subscriptions (dev
 * stores, the reviewer, Chris's eventual private plan) count as active --
 * status ACTIVE is the only gate, matching how Shopify itself treats them.
 */
export async function getBillingStatus(
  admin: AdminClient,
): Promise<BillingStatus> {
  const response = await admin.graphql(BILLING_STATUS_QUERY);
  const payload = (await response.json()) as {
    data?: {
      currentAppInstallation?: {
        app?: { handle: string };
        activeSubscriptions?: Array<{
          name: string;
          status: string;
          test: boolean;
        }>;
      };
    };
  };
  const installation = payload.data?.currentAppInstallation;
  const active = installation?.activeSubscriptions?.find(
    (sub) => sub.status === "ACTIVE",
  );

  // An ACTIVE subscription must always grant access. Resolving an unknown
  // plan name to null used to make requirePlanOrRedirect bounce the merchant
  // straight back to plan selection, from which they'd be bounced again --
  // an inescapable loop for anyone on a plan this code didn't know about.
  // That's how App Store review bounce #2 happened: Shopify auto-provisions
  // a $0 private test plan for its reviewers, whose name matches neither
  // "starter" nor "pro", so downgrading into it locked the reviewer out of
  // the app entirely. Failing closed is the wrong default for a gate whose
  // failure mode is denying paying merchants the software they bought.
  const resolved = active ? resolveTier(active.name) : null;
  return {
    tier: active ? (resolved ?? FALLBACK_TIER) : null,
    subscriptionName: active?.name ?? null,
    isRecognizedPlan: active ? resolved !== null : true,
    appHandle: installation?.app?.handle ?? "",
  };
}

/** Shopify's hosted plan-selection page -- see architecture.md "Billing" for why. */
export function planSelectionUrl(shop: string, appHandle: string): string {
  const storeHandle = shop.replace(/\.myshopify\.com$/, "");
  return `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`;
}

/**
 * Loader-side gate. Returns a Response to redirect if there's no active
 * plan -- the caller must `return` it directly (React Router treats a
 * returned Response from a loader as a redirect; this can't be thrown,
 * and a plain `redirect()` from react-router can't escape the embedded
 * iframe, which is why this uses the framework's own iframe-aware
 * `redirect` helper from authenticate.admin instead). Returns the tier
 * otherwise.
 */
export async function requirePlanOrRedirect(
  admin: AdminClient,
  redirectFn: (
    url: string,
    init?: { target?: "_self" | "_parent" | "_top" | "_blank" },
  ) => Response,
  shop: string,
): Promise<PlanTier | Response> {
  const status = await getBillingStatus(admin);
  if (!status.tier) {
    return redirectFn(planSelectionUrl(shop, status.appHandle), {
      target: "_top",
    });
  }
  return status.tier;
}

/**
 * Action-side gate (defense in depth). Loaders only run on navigation, not
 * on a fetcher.submit POST to an already-mounted page -- a merchant could
 * cancel their subscription in another tab and still fire actions on a
 * stale page. Every mutating action must independently re-check billing
 * rather than trusting the layout loader already gated it. This is the
 * actual security boundary; the loader redirect is just the normal-path UX.
 */
export async function requireActivePlan(
  admin: AdminClient,
): Promise<{ ok: true; tier: PlanTier } | { ok: false; message: string }> {
  const status = await getBillingStatus(admin);
  if (!status.tier) {
    return {
      ok: false,
      message:
        "Your subscription isn't active. Pick a plan in Settings to continue.",
    };
  }
  return { ok: true, tier: status.tier };
}
