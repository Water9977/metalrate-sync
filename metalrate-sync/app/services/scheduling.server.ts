/**
 * Pure scheduling-decision logic, kept dependency-free (no prisma, no
 * shopify.server) so it can be tested in complete isolation from scheduler.server.ts,
 * which pulls in the live Shopify app context as soon as it's imported.
 */
export function isSyncDue(
  lastScheduledSyncAt: Date | null,
  scheduleIntervalMinutes: number,
  now: number,
): boolean {
  const lastRun = lastScheduledSyncAt?.getTime() ?? 0;
  const dueAt = lastRun + scheduleIntervalMinutes * 60_000;
  return now >= dueAt;
}
