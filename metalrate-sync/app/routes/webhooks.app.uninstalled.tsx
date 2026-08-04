import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticateWebhook } from "../services/webhooks.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Uses authenticateWebhook rather than authenticate.webhook directly --
  // by definition this topic fires for a shop whose token Shopify has just
  // revoked, which is the exact case the framework 500s on. See
  // webhooks.server.ts for the full story.
  const { shop, topic } = await authenticateWebhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Delete unconditionally rather than gating on `session`. The session row
  // is what goes stale and breaks the next delivery, and on the fallback
  // path `session` is always undefined -- gating on it would leave the row
  // in place forever, which is what made this failure self-perpetuating.
  // deleteMany is a no-op when there's nothing to delete, so a repeat
  // delivery is harmless.
  await db.session.deleteMany({ where: { shop } });

  // M6 fix: sessions being gone doesn't stop scheduleEnabled from being
  // true — without this, the scheduler kept attempting this shop every
  // minute (failing with no session) until the shop/redact webhook wipes
  // settings ~48h later. Disable scheduling immediately instead of waiting
  // on the H2 circuit breaker to grind through 5 failed attempts first.
  await db.shopSettings.updateMany({
    where: { shop },
    data: { scheduleEnabled: false },
  });

  return new Response();
};
