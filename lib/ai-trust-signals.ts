/**
 * AI Trust Signal Verification via Perplexity Sonar API.
 *
 * Verifies discretized trust signals for senior care providers
 * not covered by CMS (non-medical home care, assisted living,
 * independent living, memory care).
 *
 * Each signal is independently verifiable with a source URL.
 * Cost: ~$1 per 1,000 providers.
 */

import type { AiTrustSignals, AiTrustSignal } from "@/lib/types";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

const SIGNAL_NAMES = [
  "state_licensed",
  "accredited",
  "bbb_rated",
  "years_in_operation",
  "regulatory_actions",
  "active_website",
  "google_business",
  "community_presence",
] as const;

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityResponse {
  choices: { message: { content: string } }[];
  citations?: string[];
}

/**
 * Build the verification prompt for a provider.
 */
function buildPrompt(provider: {
  provider_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
  provider_category: string;
  website: string | null;
}): PerplexityMessage[] {
  const location = [provider.address, provider.city, provider.state, provider.zipcode]
    .filter(Boolean)
    .join(", ");

  return [
    {
      role: "system",
      content:
        "You are a senior care provider verification assistant. You search for factual, verifiable information about care providers. Report what you find — mark signals as 'confirmed' when evidence exists, even from the provider's own website or business listings. Return ONLY valid JSON.",
    },
    {
      role: "user",
      content: `Verify trust signals for this senior care provider. Return ONLY valid JSON, no other text.

Provider: ${provider.provider_name}
Location: ${location}
Category: ${provider.provider_category}
${provider.website ? `Website: ${provider.website}` : ""}

For each signal below, report:
- "status": "confirmed" if you found evidence (from any source including the provider's website, business listings, directories, or state databases), "not_found" if you searched and found nothing, "unclear" if ambiguous
- "detail": brief factual note (license number, year, rating, URL, etc.) or null
- "source_url": the URL where you found evidence, or null

Signals:
1. "state_licensed" - Is this provider licensed by the state of ${provider.state || "their state"}? Check state licensing databases, registries, or provider website mentioning license.
2. "accredited" - Is this provider accredited by Joint Commission, CHAP, CARF, or ACHC?
3. "bbb_rated" - Does this provider have a BBB profile? What is their rating?
4. "years_in_operation" - When was this provider founded or incorporated? Check state business registries, About pages, or directories.
5. "regulatory_actions" - Are there regulatory actions, complaints, or violations on record? If none found, mark as "confirmed" with detail "No regulatory actions found".
6. "active_website" - Does this provider have an active, functional website? Check if ${provider.website || "their domain"} resolves and has real content.
7. "google_business" - Does this provider have a Google Business Profile listing?
8. "community_presence" - Does this provider have a presence on social media (Facebook, LinkedIn, Nextdoor), local directories (Yelp, Caring.com, A Place for Mom), or community involvement?

Return this exact JSON structure:
{
  "signals": [
    {"signal": "state_licensed", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "accredited", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "bbb_rated", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "years_in_operation", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "regulatory_actions", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "active_website", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "google_business", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"},
    {"signal": "community_presence", "status": "confirmed|not_found|unclear", "detail": "string or null", "source_url": "string or null"}
  ],
  "confidence": "high|medium|low"
}

Mark "confirmed" when you find evidence — provider websites, directories, and business listings all count as valid sources.`,
    },
  ];
}

/**
 * Call the Perplexity Sonar API.
 */
async function callPerplexity(messages: PerplexityMessage[]): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const res = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages,
      temperature: 0.0,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Perplexity API error: ${res.status} ${body.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Parse and validate the AI response into structured signals.
 */
function parseSignals(
  content: string,
  citations: string[] | undefined,
): { signals: AiTrustSignal[]; confidence: "high" | "medium" | "low" } {
  // Extract JSON from response (may have markdown code fences)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const rawSignals = parsed.signals;

  if (!Array.isArray(rawSignals)) {
    throw new Error("Invalid signals format");
  }

  // Validate and normalize each signal
  const signals: AiTrustSignal[] = SIGNAL_NAMES.map((name) => {
    const raw = rawSignals.find((s: Record<string, unknown>) => s.signal === name);
    if (!raw) {
      return { signal: name, status: "not_found" as const, detail: null, source_url: null };
    }

    const status = ["confirmed", "not_found", "unclear"].includes(raw.status)
      ? (raw.status as "confirmed" | "not_found" | "unclear")
      : "unclear";

    // Accept "confirmed" if there's a source URL, citation, or detail text
    const hasEvidence = raw.source_url || (citations && citations.length > 0) || raw.detail;
    const finalStatus = status === "confirmed" && !hasEvidence ? "unclear" : status;

    return {
      signal: name,
      status: finalStatus,
      detail: typeof raw.detail === "string" ? raw.detail : null,
      source_url: typeof raw.source_url === "string" ? raw.source_url : null,
    };
  });

  const confidence = ["high", "medium", "low"].includes(parsed.confidence)
    ? (parsed.confidence as "high" | "medium" | "low")
    : "medium";

  return { signals, confidence };
}

/**
 * Verify trust signals for a single provider using Perplexity Sonar.
 */
export async function verifyProviderTrustSignals(provider: {
  provider_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
  provider_category: string;
  website: string | null;
}): Promise<AiTrustSignals> {
  const messages = buildPrompt(provider);
  const response = await callPerplexity(messages);

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Perplexity");
  }

  const { signals, confidence } = parseSignals(content, response.citations);
  const summaryScore = signals.filter((s) => s.status === "confirmed").length;

  return {
    provider_name: provider.provider_name,
    state: provider.state || "",
    category: provider.provider_category,
    signals,
    summary_score: summaryScore,
    last_verified: new Date().toISOString(),
    model: "sonar",
    confidence,
  };
}

/**
 * Categories NOT covered by CMS — these need AI verification.
 */
export const NON_CMS_CATEGORIES = [
  "Home Care (Non-medical)",
  "Assisted Living",
  "Independent Living",
  "Memory Care",
  "Assisted Living | Independent Living",
  "Memory Care | Assisted Living",
];
