import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import { executeSync } from "./sync.server";
import { isSyncDue } from "./scheduling.server";

/**
 * In-process scheduler for automatic syncing. Suitable for a long-running
 * host (Fly.io/Railway/Render — the recommended targets, see
 * architecture.md); it will NOT work on a serverless/cold-start host, since
 * there's nothing keeping a process alive to tick. That tradeoff is
 * documented, not hidden — a real job queue is the fix if/when the app
 * moves to serverless hosting.
 *
 * Ticks once a minute, checks every shop with scheduling enabled, and only
 * runs a shop's sync once its configured interval has actually elapsed.
 * Failures are isolated per shop so one broken/uninstalled store never
 * blocks scheduling for anyone else.
 */

const TICK_MS = 60_000;
const runningShops = new Set<string>();

async function runScheduledSync(shop: string): Promise<void> {
  try {
    const { admin } = await unauthenticated.admin(shop);
    await executeSync(admin, shop, "scheduled");
  } catch (error) {
    console.error(`[scheduler] sync failed for ${shop}:`, error);
  } finally {
    await prisma.shopSettings
      .update({ where: { shop }, data: { lastScheduledSyncAt: new Date() } })
      .catch(() => {
        // Shop settings row may have been deleted (app uninstalled mid-run) — fine to ignore.
      });
  }
}

async function tick(): Promise<void> {
  const due = await prisma.shopSettings.findMany({
    where: { scheduleEnabled: true },
  });
  const now = Date.now();

  for (const settings of due) {
    if (runningShops.has(settings.shop)) continue; // previous run for this shop still in flight
    if (!isSyncDue(settings.lastScheduledSyncAt, settings.scheduleInterval, now)) {
      continue;
    }

    runningShops.add(settings.shop);
    runScheduledSync(settings.shop).finally(() => {
      runningShops.delete(settings.shop);
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __metalRateSchedulerStarted: boolean | undefined;
}

export function startScheduler(): void {
  if (globalThis.__metalRateSchedulerStarted) return;
  globalThis.__metalRateSchedulerStarted = true;

  console.log(`[scheduler] started, checking every ${TICK_MS / 1000}s`);
  setInterval(() => {
    tick().catch((error) => console.error("[scheduler] tick failed:", error));
  }, TICK_MS);
}

startScheduler();
