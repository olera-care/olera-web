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
 * API Reference: https://docs.apollo.io/reference/people-api-search
 *
 * Flow:
 * 1. Search for people at org with seniority filters (free, no credits)
 * 2. Enrich the best match to get email (1 credit)
 */

// Lazy key loading (follows existing pattern from outreach-enrichment.ts)
function apolloKey(): string | undefined {
  return process.env.APOLLO_API_KEY;
}

const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

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

    // Step 1: Search for people at the organization with seniority filters
    // This is free (doesn't cost credits) but doesn't return emails
    // Docs: https://docs.apollo.io/reference/people-api-search
    // Note: Apollo API requires JSON body, not query parameters
    // Note: Using only seniority filter (not titles) to broaden search results

    // Apollo requires domain - there's no company name search parameter
    if (!domain) {
      return {
        contact: null,
        credits_used: 0,
        error: "Domain required - Apollo cannot search by company name alone",
      };
    }

    const searchDomain = extractDomain(domain);
    const searchBody: Record<string, unknown> = {
      q_organization_domains_list: [searchDomain],
      person_seniorities: SENIORITY,
      page: 1,
      per_page: 10,
    };

    console.log("[apollo] Searching domain:", searchDomain);
    console.log("[apollo] Search request:", JSON.stringify(searchBody));

    const searchUrl = `${APOLLO_BASE_URL}/mixed_people/api_search`;

    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
      signal: controller.signal,
    });

    if (!searchResponse.ok) {
      clearTimeout(timeoutId);
      const errorText = await searchResponse.text();
      console.error("[apollo] Search API error:", searchResponse.status, errorText);

      if (searchResponse.status === 401) {
        return { contact: null, credits_used: 0, error: "Invalid Apollo API key" };
      }
      if (searchResponse.status === 429) {
        return { contact: null, credits_used: 0, error: "Apollo rate limit exceeded" };
      }
      if (searchResponse.status === 422) {
        return { contact: null, credits_used: 0, error: "Apollo search failed - invalid parameters" };
      }

      return { contact: null, credits_used: 0, error: `Apollo API error: ${searchResponse.status}` };
    }

    const searchData = await searchResponse.json();

    // Log full response for debugging
    console.log("[apollo] Full response:", JSON.stringify(searchData));

    const people = searchData.people || [];
    console.log("[apollo] Search returned", people.length, "people");

    if (people.length === 0) {
      clearTimeout(timeoutId);
      return { contact: null, credits_used: 0 };
    }

    // Step 2: Enrich the best match to get email (costs 1 credit)
    // Docs: https://docs.apollo.io/reference/people-enrichment
    const bestMatch = people[0];
    console.log("[apollo] Best match:", JSON.stringify(bestMatch));

    // Apollo returns last_name_obfuscated, not last_name
    // Extract whatever name info we have
    const firstName = bestMatch.first_name || null;
    const lastName = bestMatch.last_name || bestMatch.last_name_obfuscated || null;
    const fullName = bestMatch.name || null;

    // Need some name to enrich
    if (!firstName && !lastName && !fullName) {
      console.log("[apollo] No name found on best match, skipping enrichment");
      clearTimeout(timeoutId);
      return {
        contact: {
          email: null,
          first_name: null,
          last_name: null,
          title: bestMatch.title || null,
          linkedin_url: bestMatch.linkedin_url || null,
        },
        credits_used: 0,
      };
    }

    console.log("[apollo] Attempting enrichment for:", firstName, lastName || fullName);

    // Enrichment endpoint uses query parameters (not JSON body)
    const enrichParams = new URLSearchParams();
    enrichParams.append("reveal_personal_emails", "true");
    if (firstName) enrichParams.append("first_name", firstName);
    // Use full last_name if available, otherwise try obfuscated (might help matching)
    if (bestMatch.last_name) {
      enrichParams.append("last_name", bestMatch.last_name);
    }
    // If we only have fullName (no separate first/last), use it
    if (!firstName && !bestMatch.last_name && fullName) {
      enrichParams.append("name", fullName);
    }
    if (domain) enrichParams.append("domain", extractDomain(domain));
    if (bestMatch.organization?.name) enrichParams.append("organization_name", bestMatch.organization.name);
    // Also try Apollo's person ID if available - most reliable for enrichment
    if (bestMatch.id) enrichParams.append("id", bestMatch.id);

    const enrichUrl = `${APOLLO_BASE_URL}/people/match?${enrichParams.toString()}`;
    console.log("[apollo] Enrichment URL:", enrichUrl);

    const enrichResponse = await fetch(enrichUrl, {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!enrichResponse.ok) {
      const errorText = await enrichResponse.text();
      console.error("[apollo] Enrich API error:", enrichResponse.status, errorText);

      // Return the search result without email if enrichment fails
      return {
        contact: {
          email: null,
          first_name: bestMatch.first_name || null,
          last_name: bestMatch.last_name || null,
          title: bestMatch.title || null,
          linkedin_url: bestMatch.linkedin_url || null,
        },
        credits_used: 0,
        error: `Could not enrich contact: ${enrichResponse.status}`,
      };
    }

    const enrichData = await enrichResponse.json();
    const person = enrichData.person;

    if (!person) {
      return {
        contact: {
          email: null,
          first_name: bestMatch.first_name || null,
          last_name: bestMatch.last_name || null,
          title: bestMatch.title || null,
          linkedin_url: bestMatch.linkedin_url || null,
        },
        credits_used: 0,
      };
    }

    const email = person.email || null;

    return {
      contact: {
        email: email ? email.toLowerCase() : null,
        first_name: person.first_name || bestMatch.first_name || null,
        last_name: person.last_name || bestMatch.last_name || null,
        title: person.title || bestMatch.title || null,
        linkedin_url: person.linkedin_url || bestMatch.linkedin_url || null,
      },
      credits_used: email ? 1 : 0, // 1 credit only if email was revealed
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[apollo] Request timed out");
      return { contact: null, credits_used: 0, error: "Apollo request timed out" };
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
