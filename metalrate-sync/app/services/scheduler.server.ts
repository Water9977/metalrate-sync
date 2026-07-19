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

/**
 * H2 follow-up: expired-offline-token auto-refresh is handled by the
 * framework itself (verified in shopify-app-react-router's
 * ensureOfflineTokenIsNotExpired -> refreshToken, which unauthenticated.admin
 * already calls) — so a shop that's merely been idle recovers on its own.
 * What's NOT handled automatically is a refresh that fails permanently
 * (shop uninstalled, refresh token itself expired/revoked): without this
 * breaker, that shop would retry every tick forever, once a minute,
 * indefinitely. After MAX_CONSECUTIVE_FAILURES straight failures, scheduling
 * auto-disables for that shop rather than grinding forever — also the
 * general-purpose fix for M6 (uninstalled shops), belt-and-suspenders with
 * the more immediate fix in webhooks.app.uninstalled.
 */
const MAX_CONSECUTIVE_FAILURES = 5;

async function runScheduledSync(shop: string): Promise<void> {
  let failureMessage: string | null = null;
  try {
    const { admin } = await unauthenticated.admin(shop);
    await executeSync(admin, shop, "scheduled");
  } catch (error) {
    failureMessage = error instanceof Error ? error.message : String(error);
    console.error(`[scheduler] sync failed for ${shop}:`, error);
  }

  try {
    if (failureMessage) {
      const updated = await prisma.shopSettings.update({
        where: { shop },
        data: {
          lastScheduledSyncAt: new Date(),
          scheduleFailureCount: { increment: 1 },
          lastScheduleError: failureMessage,
        },
      });
      if (updated.scheduleFailureCount >= MAX_CONSECUTIVE_FAILURES) {
        await prisma.shopSettings.update({
          where: { shop },
          data: { scheduleEnabled: false },
        });
        console.error(
          `[scheduler] disabled scheduling for ${shop} after ${updated.scheduleFailureCount} consecutive failures. Last error: ${failureMessage}`,
        );
      }
    } else {
      await prisma.shopSettings.update({
        where: { shop },
        data: {
          lastScheduledSyncAt: new Date(),
          scheduleFailureCount: 0,
          lastScheduleError: null,
        },
      });
    }
  } catch {
    // Shop settings row may have been deleted (app uninstalled mid-run) — fine to ignore.
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

/**
 * L6 fix: `npm run dev` used to start this same real scheduler on the
 * laptop -- if any shop had scheduling enabled, dev machines fired real
 * syncs and real Admin/rate-provider API calls in the background while
 * coding, with no visible indication. Only auto-start outside production
 * with an explicit opt-in env var; Preview & Sync covers manual testing.
 */
function shouldRunScheduler(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.ENABLE_DEV_SCHEDULER === "1";
}

export function startScheduler(): void {
  if (globalThis.__metalRateSchedulerStarted) return;
  globalThis.__metalRateSchedulerStarted = true;

  if (!shouldRunScheduler()) {
    console.log(
      "[scheduler] not starting (non-production, ENABLE_DEV_SCHEDULER not set) — Preview & Sync still works for manual testing",
    );
    return;
  }

  console.log(`[scheduler] started, checking every ${TICK_MS / 1000}s`);
  setInterval(() => {
    tick().catch((error) => console.error("[scheduler] tick failed:", error));
  }, TICK_MS);
}

startScheduler();
