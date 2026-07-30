/**
 * Cron liveness pings (dead-man's switch) to MakoPulse.
 *
 * These crons log their own failures, but a schedule that simply stops firing
 * produces no log, no error and no alert — it just goes quiet, and quiet reads
 * as healthy. MakoPulse holds the expected interval per job and alerts when a
 * check-in doesn't arrive within period + grace.
 *
 * Each cron has its OWN heartbeat URL in its own env var, so one dead job is
 * identifiable rather than being masked by its sibling still checking in.
 *
 * Never throws and never blocks: reporting must not be able to break the job
 * it reports on. A missing env var is a silent no-op, so previews and local
 * runs can't spoof a check-in and mask a dead production cron.
 */
export async function pingHeartbeat(envVar: string): Promise<void> {
  const url = process.env[envVar];
  if (!url) return;
  try {
    await fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) });
  } catch {
    // Intentionally swallowed — see above.
  }
}
