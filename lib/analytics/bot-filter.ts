import { isbot } from "isbot";

let botRejectsToday = 0;
let counterDateUtc = currentDateUtc();

function currentDateUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function rotateIfNewDay(): void {
  const today = currentDateUtc();
  if (today !== counterDateUtc) {
    botRejectsToday = 0;
    counterDateUtc = today;
  }
}

/**
 * Returns true if the request looks like a bot.
 * Treats missing User-Agent as a bot (real browsers always send one).
 *
 * Strict by design — we'd rather under-count humans than inflate analytics
 * with crawler hits. See strategy doc / Phase 0 plan: honest numbers are
 * brand-defining.
 */
export function isBotRequest(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return isbot(userAgent);
}

/**
 * Increment the in-memory bot reject counter. Counter resets at UTC midnight.
 *
 * NOTE: per-instance only. On Vercel with multiple regions/lambdas, this
 * undercounts globally. Acceptable for Phase 0 sanity-check; Phase 1 may
 * promote to a KV-backed counter.
 */
export function incrementBotReject(): void {
  rotateIfNewDay();
  botRejectsToday += 1;
}

export function getBotRejectsToday(): { count: number; date: string } {
  rotateIfNewDay();
  return { count: botRejectsToday, date: counterDateUtc };
}
