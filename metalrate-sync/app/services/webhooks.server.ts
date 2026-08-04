import crypto from "node:crypto";
import { authenticate } from "../shopify.server";

/**
 * Webhook authentication that survives an already-uninstalled shop.
 *
 * The problem this exists for is an upstream framework bug, not a mistake
 * in this app. With `future.expiringOfflineAccessTokens` enabled,
 * `authenticate.webhook()` calls `ensureValidOfflineSession()` ->
 * `refreshToken()` BEFORE the route handler runs, and the framework's
 * `refresh-token.js` ends in a literal `throw new Response(undefined,
 * {status: 500})` for any refresh failure outside two narrow error types.
 * Shopify revokes a shop's tokens the moment it uninstalls, so that refresh
 * can never succeed -- every `app/uninstalled` and mandatory compliance
 * webhook for that shop 500s before a single line of our own code executes.
 * It is self-perpetuating: the stale session row is only deleted inside the
 * handler, so every Shopify retry hits the identical failure forever.
 *
 * Independently confirmed as a live, unfixed Shopify bug reported by another
 * developer on 2026-07-30 and acknowledged by Shopify staff:
 * https://community.shopify.dev/t/app-uninstalled-and-compliance-webhooks-return-500-after-enabling-expiring-offline-access-tokens/36449
 * Their reproduction matches ours exactly, including why it evades local
 * testing -- it only fires when the stored token is already stale, so
 * uninstalling right after using the app looks fine and only a store left
 * idle (like an App Store reviewer's) triggers it.
 *
 * Disabling the future flag would also silence this, but expiring offline
 * tokens become mandatory for every app on 2027-01-01, so that trades a
 * present bug for a deadline and a second review risk. Instead: catch the
 * framework's 500, re-verify the webhook's authenticity ourselves, and
 * continue with no session -- which is precisely what the framework already
 * does for a shop whose session row is missing entirely. When Shopify ships
 * their fix this fallback simply stops being reached; there is nothing to
 * remove later.
 *
 * Security note: the fallback does NOT trust the framework's partial work or
 * assume the request is genuine because HMAC validation happens to run
 * earlier in the call chain. It recomputes the HMAC from the raw body and
 * the app secret itself, with a timing-safe comparison, and refuses anything
 * that doesn't verify. An attacker cannot reach the handler by forging a
 * request that makes the framework throw.
 */

/** Shape the routes consume. Mirrors the framework's own webhook context. */
export interface WebhookContext {
  /** Normalized to the framework's SCREAMING_SNAKE form, e.g. "SHOP_REDACT". */
  topic: string;
  shop: string;
  payload: unknown;
  /** Always undefined on the fallback path -- an uninstalled shop has no usable session. */
  session: unknown;
}

export async function authenticateWebhook(
  request: Request,
): Promise<WebhookContext> {
  // Clone before the framework consumes the body -- a Request body can only
  // be read once, and the fallback needs the exact raw bytes to verify.
  const forFallback = request.clone();

  try {
    const context = await authenticate.webhook(request);
    return {
      topic: context.topic,
      shop: context.shop,
      payload: context.payload,
      session: context.session,
    };
  } catch (error) {
    // Only the token-refresh 500 is recoverable. A 401 (bad HMAC), 400
    // (malformed) or 405 (wrong method) is a real rejection and must stay
    // rejected -- rethrow untouched.
    if (!(error instanceof Response) || error.status !== 500) {
      throw error;
    }
    return verifyWebhookWithoutSession(forFallback);
  }
}

async function verifyWebhookWithoutSession(
  request: Request,
): Promise<WebhookContext> {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Response(undefined, {
      status: 500,
      statusText: "Webhook secret not configured",
    });
  }

  const rawBody = await request.text();
  const providedHmac = request.headers.get("X-Shopify-Hmac-Sha256");
  const shop = request.headers.get("X-Shopify-Shop-Domain");
  const rawTopic = request.headers.get("X-Shopify-Topic");

  if (!providedHmac || !shop || !rawTopic) {
    throw new Response(undefined, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (!timingSafeEquals(providedHmac, expectedHmac)) {
    throw new Response(undefined, {
      status: 401,
      statusText: "Unauthorized",
    });
  }

  return {
    // Header form is "shop/redact"; the framework hands routes "SHOP_REDACT".
    // Normalize so a route's switch statement behaves identically on both paths.
    topic: rawTopic.replace(/[/-]/g, "_").toUpperCase(),
    shop,
    payload: rawBody ? JSON.parse(rawBody) : {},
    session: undefined,
  };
}

/**
 * Constant-time compare. `crypto.timingSafeEqual` throws on length mismatch,
 * which would itself leak length, so guard that first.
 */
function timingSafeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}
