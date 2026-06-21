const LOOPS_API_URL = "https://app.loops.so/api/v1/events/send";
const MAX_STRING_LENGTH = 490;

/**
 * Loops is RETIRED as of 2026-06-20 — OFF by default (this flag defaults false).
 *
 * Resend (lib/email.ts) is the system of record for all transactional + lifecycle
 * email. It already covers every active Loops trigger — new_message, new_lead,
 * new_review, welcome, the full verification_* suite, review_request — PLUS the
 * dormant/re-engagement nurtures that Loops' own lifecycle groups sat empty for.
 * The live Loops workflows were stale duplicates: they double-sent on
 * oleracare.com (a complaint/AUP-bounce surface) and posed opt-in ToS exposure on
 * a platform we hadn't edited in months.
 *
 * This neuters both senders at the source — no events/contacts are pushed to
 * Loops — while leaving every call site intact. Re-enabling is a single env flip
 * (LOOPS_ENABLED=true) or a revert of this commit; zero behavioral risk, since the
 * senders already fail soft and every caller is fire-and-forget. With this off the
 * LOOPS_API_KEY_* env vars are moot (left in place for an easy re-enable).
 */
const LOOPS_ENABLED = process.env.LOOPS_ENABLED === "true";

type LoopsAudience = "seeker" | "provider";

interface SendLoopsEventOptions {
  email: string;
  eventName: string;
  audience: LoopsAudience;
  eventProperties?: Record<string, string | number | boolean | null>;
  contactProperties?: Record<string, string | number | boolean | null>;
}

/**
 * Two Loops accounts, one per sending domain:
 *   - seeker  → olera.care    (confirmed care seeker emails)
 *   - provider → oleracare.com (cold outbound, protects primary domain)
 */
function getApiKey(audience: LoopsAudience): string | undefined {
  return audience === "provider"
    ? process.env.LOOPS_API_KEY_PROVIDER
    : process.env.LOOPS_API_KEY_SEEKER;
}

/**
 * Truncate string values to 490 chars (Loops field limit carried from v1).
 */
function truncateStrings(
  obj?: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> | undefined {
  if (!obj) return undefined;
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] =
      typeof value === "string" && value.length > MAX_STRING_LENGTH
        ? value.slice(0, MAX_STRING_LENGTH)
        : value;
  }
  return result;
}

/**
 * Send a marketing event to Loops. Fire-and-forget safe — logs errors
 * but never throws so callers can wrap in try/catch without
 * breaking their main flow.
 *
 * Routes to the correct Loops account based on audience:
 *   - "seeker"   → LOOPS_API_KEY_SEEKER  (olera.care)
 *   - "provider" → LOOPS_API_KEY_PROVIDER (oleracare.com)
 */
async function sendToLoops(
  apiKey: string,
  options: Omit<SendLoopsEventOptions, "audience">
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, unknown> = {
      email: options.email,
      eventName: options.eventName,
    };

    const eventProps = truncateStrings(options.eventProperties);
    if (eventProps) payload.eventProperties = eventProps;

    const contactProps = truncateStrings(options.contactProperties);
    if (contactProps) payload.contactProperties = contactProps;

    const res = await fetch(LOOPS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("[loops] API error:", res.status, msg);
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    console.error("[loops] Send failed:", err);
    return { success: false, error: String(err) };
  }
}

export async function sendLoopsEvent(
  options: SendLoopsEventOptions
): Promise<{ success: boolean; error?: string }> {
  if (!LOOPS_ENABLED) return { success: false, error: "Loops disabled (retired in favor of Resend)" };
  const apiKey = getApiKey(options.audience);
  if (!apiKey) {
    const envVar = options.audience === "provider"
      ? "LOOPS_API_KEY_PROVIDER"
      : "LOOPS_API_KEY_SEEKER";
    console.warn(`[loops] ${envVar} not configured, skipping event`);
    return { success: false, error: "Loops not configured" };
  }

  return sendToLoops(apiKey, options);
}

/**
 * Send an event to BOTH Loops accounts (seeker + provider).
 * Used for account_deleted so the email gets suppressed everywhere.
 */
export async function sendLoopsEventBoth(
  options: Omit<SendLoopsEventOptions, "audience">
): Promise<{ success: boolean; error?: string }> {
  if (!LOOPS_ENABLED) return { success: false, error: "Loops disabled (retired in favor of Resend)" };
  const seekerKey = getApiKey("seeker");
  const providerKey = getApiKey("provider");

  if (!seekerKey && !providerKey) {
    console.warn("[loops] No Loops API keys configured, skipping event");
    return { success: false, error: "Loops not configured" };
  }

  const results = await Promise.all([
    seekerKey ? sendToLoops(seekerKey, options) : Promise.resolve(null),
    providerKey ? sendToLoops(providerKey, options) : Promise.resolve(null),
  ]);

  const errors = results.filter((r) => r && !r.success);
  if (errors.length > 0) {
    return { success: false, error: errors.map((e) => e!.error).join("; ") };
  }

  return { success: true };
}
