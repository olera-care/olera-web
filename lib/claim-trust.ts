import Anthropic from "@anthropic-ai/sdk";

export type ClaimTrustLevel = "high" | "medium" | "low";

export interface ClaimTrustInput {
  email: string;
  providerName: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerCategory?: string | null;
  providerDomain?: string | null;
}

export interface ClaimTrustResult {
  level: ClaimTrustLevel;
  reason: string;
}

const INSTITUTIONAL_TLDS = [".gov", ".edu", ".mil"];

const SYSTEM_PROMPT = `You're evaluating whether an email plausibly belongs to someone authorized to claim a senior-care business listing on a directory.

Return ONLY a JSON object (no prose, no markdown fences): {"level":"high"|"medium"|"low","reason":"<one short sentence>"}.

How to think about this: the score reflects how confident we are that this person is authorized to claim this listing.

The business type matters a lot:
- "Well-known multi-location brand" = large national/regional chain with hundreds of locations and a corporate office. Examples: Sunrise Senior Living, Brookdale, Atria, Home Instead, Comfort Keepers, Visiting Angels, Right at Home, Amedisys, BrightStar Care.
- "Small/local business" = single-location, family-run, or small regional operator. Most listings fall here. If you don't recognize the name as a major chain, treat it as small/local.

Scoring:
- high — we're confident:
  - Corporate domain matching the business name on ANY TLD (.com/.io/.org/.care/.net/.us). Minor spelling or franchise-location suffixes are fine.
  - Institutional domain (.gov / .edu / .mil).
  - Generic-domain email (gmail/yahoo/etc.) with a local-part that clearly references the business, AND the business is small/local. Example: "bella.vista.apts@gmail.com" for "Bella Vista Apartments", "drfalohun@gmail.com" for "Dr. Falohun Dental".
  - Domain that matches by initials (e.g., "lccg.care" for "Loving Caregivers Group").

- medium — plausible but we can't confirm:
  - Generic-domain email with a name-matched local-part, BUT the business is a well-known multi-location brand. Could be a legitimate franchise operator or local manager, but we can't verify from a personal email alone. Example: "sunrise.senior@gmail.com" for "Sunrise Senior Living" → medium.
  - Generic domain with weak/partial name match on any business.
  - An unusual corporate domain we can't confirm.
  - Initials / abbreviations that could go either way.

- low — clear mismatch:
  - The local-part has NO meaningful connection to the business name. Example: "randomuser99@gmail.com", "jane.doe.1992@gmail.com" — regardless of brand size.
  - If the local-part echoes the business name in any recognizable way, it is NOT low.

Additional rules:
- Domain variants (.com vs .io vs .org of the same name) are equivalent — all high-trust.
- Small family-run businesses routinely use gmail/yahoo. That alone is NEVER low-trust.
- Franchise/location suffixes ("homeinstead-nj.com", "sunrise-boston.com") are high-trust.
- We are NOT blocking anyone — this flag just routes to manual review.
- Err toward medium over low when in doubt. False low-flags create admin noise.`;

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase().trim();
}

export function extractDomainFromWebsite(
  website: string | null | undefined
): string | null {
  if (!website) return null;
  try {
    const normalized = website.startsWith("http") ? website : `https://${website}`;
    return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isInstitutionalDomain(domain: string): boolean {
  return INSTITUTIONAL_TLDS.some((tld) => domain.endsWith(tld));
}

function buildUserMessage(input: ClaimTrustInput): string {
  const lines = [
    `Claimant email: ${input.email}`,
    `Business name: ${input.providerName}`,
  ];
  if (input.providerCity || input.providerState) {
    lines.push(
      `Location: ${[input.providerCity, input.providerState].filter(Boolean).join(", ")}`
    );
  }
  if (input.providerCategory) {
    lines.push(`Category: ${input.providerCategory}`);
  }
  if (input.providerDomain) {
    lines.push(`Known business domain on file: ${input.providerDomain}`);
  }
  return lines.join("\n");
}

function parseResponse(raw: string): ClaimTrustResult | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(trimmed) as { level?: string; reason?: string };
    if (
      parsed &&
      (parsed.level === "high" || parsed.level === "medium" || parsed.level === "low") &&
      typeof parsed.reason === "string" &&
      parsed.reason.length > 0
    ) {
      return { level: parsed.level, reason: parsed.reason };
    }
  } catch {
    // fall through
  }
  return null;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export async function scoreClaimTrust(
  input: ClaimTrustInput
): Promise<ClaimTrustResult> {
  const domain = extractDomain(input.email);
  if (!domain) {
    return { level: "medium", reason: "unable_to_parse_email" };
  }

  if (isInstitutionalDomain(domain)) {
    return { level: "high", reason: `institutional domain (${domain})` };
  }

  try {
    const response = await Promise.race<Anthropic.Messages.Message>([
      getClient().messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserMessage(input),
          },
        ],
      }),
      new Promise<Anthropic.Messages.Message>((_, reject) =>
        setTimeout(() => reject(new Error("llm_timeout")), 5000)
      ),
    ]);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";
    const parsed = parseResponse(raw);
    if (!parsed) {
      console.error("[claim-trust] unparseable LLM response:", raw);
      return { level: "medium", reason: "llm_unparseable_response" };
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[claim-trust] LLM call failed:", message);
    return { level: "medium", reason: `llm_error: ${message}` };
  }
}
