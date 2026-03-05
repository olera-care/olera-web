const LOOPS_API_URL = "https://app.loops.so/api/v1/events/send";
const MAX_STRING_LENGTH = 490;

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
