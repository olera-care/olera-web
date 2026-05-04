/**
 * Classify the originating host of a referrer URL into a coarse traffic
 * class. Used to tag anonymous page_view events so we can measure how
 * traffic is shifting — especially the rise of AI-chat referrers
 * (ChatGPT, Claude, Gemini, Perplexity, Copilot) as families increasingly
 * start research with an LLM rather than a search engine.
 *
 * Sets are deliberately permissive on canonical hosts (with and without
 * www., common subdomains). Anything not matched falls through to "other"
 * so we don't lose the long tail.
 */

export const OLERA_HOSTS = new Set([
  "olera.care",
  "www.olera.care",
  "olera2-web.vercel.app",
  "staging-olera2-web.vercel.app",
  "localhost",
]);

export const AI_HOSTS = new Set([
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "bard.google.com",
  "perplexity.ai",
  "www.perplexity.ai",
  "copilot.microsoft.com",
]);

export const SEARCH_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "search.yahoo.com",
  "yahoo.com",
  "search.brave.com",
]);

export const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "l.facebook.com",
  "twitter.com",
  "x.com",
  "t.co",
  "linkedin.com",
  "www.linkedin.com",
  "instagram.com",
  "www.instagram.com",
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "youtube.com",
  "m.youtube.com",
  "tiktok.com",
  "pinterest.com",
]);

export type ReferrerClass =
  | "ai_chat"
  | "search"
  | "social"
  | "olera_internal"
  | "direct"
  | "other";

export const REFERRER_CLASSES: readonly ReferrerClass[] = [
  "ai_chat",
  "search",
  "social",
  "olera_internal",
  "direct",
  "other",
] as const;

export function classifyReferrer(
  rawReferrer: string | null | undefined,
): ReferrerClass {
  if (!rawReferrer) return "direct";
  try {
    const u = new URL(rawReferrer);
    const host = u.hostname.toLowerCase();
    if (OLERA_HOSTS.has(host)) return "olera_internal";
    if (AI_HOSTS.has(host)) return "ai_chat";
    if (SEARCH_HOSTS.has(host)) return "search";
    if (SOCIAL_HOSTS.has(host)) return "social";
    return "other";
  } catch {
    return "direct";
  }
}

/**
 * Reduce a raw referrer URL to either an Olera-internal path or just the
 * external domain. Never store query strings on external referrers — they
 * can leak search terms (PII risk per Phase 0 privacy review).
 */
export function sanitizeReferrer(
  rawReferrer: string | null | undefined,
): string | null {
  if (!rawReferrer) return null;
  try {
    const u = new URL(rawReferrer);
    if (OLERA_HOSTS.has(u.hostname)) {
      return `internal:${u.pathname}`;
    }
    return u.hostname;
  } catch {
    return null;
  }
}
