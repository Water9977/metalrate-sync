import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

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
