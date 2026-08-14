/**
 * Apollo.io API client for decision-maker email enrichment.
 *
 * Apollo finds named contacts (Executive Director, Owner, Administrator)
 * rather than generic info@ addresses. This is a premium enrichment layer
 * that costs credits, so it's triggered explicitly via the "Find Decision Maker"
 * button rather than being part of the free scrape waterfall.
 *
 * Plan: $49/month Basic plan (5,000 email credits/month)
 * Per lookup: 1 credit for email reveal
 *
 * API Reference: https://apolloio.github.io/apollo-api-docs/
 */

// Lazy key loading (follows existing pattern from outreach-enrichment.ts)
function apolloKey(): string | undefined {
  return process.env.APOLLO_API_KEY;
}

const APOLLO_BASE_URL = "https://api.apollo.io/v1";

// Request timeout in milliseconds
const APOLLO_TIMEOUT_MS = 30000;

// Decision-maker titles we target for senior care providers
const DECISION_MAKER_TITLES = [
  "owner",
  "executive director",
  "administrator",
  "director of operations",
  "general manager",
  "ceo",
  "president",
  "founder",
  "co-founder",
  "managing director",
  "director",
  "manager",
];

// Apollo seniority filters (valid values for person_seniorities[])
const SENIORITY = ["owner", "c_suite", "vp", "director", "manager"];

export interface ApolloContact {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  linkedin_url: string | null;
}

export interface ApolloResult {
  contact: ApolloContact | null;
  credits_used: number;
  error?: string;
}

/**
 * Find a decision-maker contact at a provider organization using Apollo.io.
 *
 * @param organizationName - The provider's business name
 * @param domain - The provider's website domain (optional but improves accuracy)
 * @returns The best matching decision-maker contact, or null if none found
 */
export async function findDecisionMaker(
  organizationName: string,
  domain: string | null
): Promise<ApolloResult> {
  const key = apolloKey();
  if (!key) {
    return {
      contact: null,
      credits_used: 0,
      error: "Apollo API key not configured",
    };
  }

  if (!organizationName?.trim()) {
    return {
      contact: null,
      credits_used: 0,
      error: "Organization name is required",
    };
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APOLLO_TIMEOUT_MS);

    // Use the mixed_people/search endpoint to find contacts at an organization
    // This endpoint searches for people and can filter by organization, seniority, title
    // Docs: https://apolloio.github.io/apollo-api-docs/?shell#search-for-people
    const response = await fetch(`${APOLLO_BASE_URL}/mixed_people/search`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        // Organization filters
        q_organization_name: organizationName.trim(),
        ...(domain && { q_organization_domains: extractDomain(domain) }),
        // Filter by seniority to find decision-makers
        person_seniorities: SENIORITY,
        // Filter by title keywords
        person_titles: DECISION_MAKER_TITLES,
        // Only get contacts with email
        contact_email_status: ["verified", "guessed", "unavailable"],
        // Limit to 1 result (we just need the best match)
        per_page: 1,
        page: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[apollo] API error:", response.status, errorText);

      // Handle specific error cases
      if (response.status === 401) {
        return {
          contact: null,
          credits_used: 0,
          error: "Invalid Apollo API key",
        };
      }
      if (response.status === 429) {
        return {
          contact: null,
          credits_used: 0,
          error: "Apollo rate limit exceeded",
        };
      }
      if (response.status === 402) {
        return {
          contact: null,
          credits_used: 0,
          error: "Apollo credits exhausted",
        };
      }

      return {
        contact: null,
        credits_used: 0,
        error: `Apollo API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // mixed_people/search returns { people: [...] }
    const people = data.people || [];

    if (people.length === 0) {
      // No match found - search doesn't cost credits
      return {
        contact: null,
        credits_used: 0,
      };
    }

    // Get the first (best) match
    const person = people[0];

    // Extract the email - Apollo returns it in the "email" field
    const email = person.email || null;

    if (!email) {
      // Found a person but no email available
      return {
        contact: {
          email: null,
          first_name: person.first_name || null,
          last_name: person.last_name || null,
          title: person.title || null,
          linkedin_url: person.linkedin_url || null,
        },
        credits_used: 0, // No credit used if no email revealed
      };
    }

    // Successfully found a decision-maker with email
    // Note: Apollo charges 1 credit when accessing email via the API
    return {
      contact: {
        email: email.toLowerCase(),
        first_name: person.first_name || null,
        last_name: person.last_name || null,
        title: person.title || null,
        linkedin_url: person.linkedin_url || null,
      },
      credits_used: 1, // 1 credit used for email access
    };
  } catch (err) {
    // Handle abort/timeout specifically
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[apollo] Request timed out");
      return {
        contact: null,
        credits_used: 0,
        error: "Apollo request timed out",
      };
    }

    console.error("[apollo] Request failed:", err);
    return {
      contact: null,
      credits_used: 0,
      error: err instanceof Error ? err.message : "Apollo request failed",
    };
  }
}

/**
 * Extract domain from a URL or domain string.
 */
function extractDomain(input: string): string {
  try {
    // If it looks like a URL, parse it
    if (input.includes("://")) {
      const url = new URL(input);
      return url.hostname.replace(/^www\./, "");
    }
    // Otherwise assume it's already a domain
    return input.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.toLowerCase();
  }
}

/**
 * Check if Apollo API is configured.
 */
export function isApolloConfigured(): boolean {
  return !!apolloKey();
}
