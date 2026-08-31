/**
 * City Broadcasts - Provider Eligibility Checks
 *
 * Determines which providers should receive broadcast emails when family
 * activity occurs in their city. Filters out:
 *   - Providers without email
 *   - Bounced/complained addresses
 *   - Recently contacted providers (7 days for broadcasts, 30 days for direct questions)
 *   - Providers with active connections
 *   - Providers in certain stages (archived, not_interested, in_sequence)
 */

import { getServiceClient } from "@/lib/admin";

export interface EligibleProvider {
  provider_id: string;
  email: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  category: string | null;
}

export interface EligibilityResult {
  eligible: EligibleProvider[];
  excluded: {
    no_email: number;
    bounced: number;
    recent_broadcast: number;
    recent_question: number;
    active_connection: number;
    excluded_stage: number;
  };
}

/** Stages that should not receive broadcasts */
const EXCLUDED_STAGES = new Set(["archived", "not_interested", "in_sequence"]);

/** Days before a provider can receive another broadcast */
const BROADCAST_COOLDOWN_DAYS = 7;

/** Days before a provider who received a direct question can get a broadcast */
const QUESTION_COOLDOWN_DAYS = 30;

/** Days to consider a connection "active" */
const CONNECTION_ACTIVE_DAYS = 30;

/**
 * Find providers eligible for a city broadcast.
 *
 * @param city - City to find providers in
 * @param category - Optional category filter (for question broadcasts)
 * @param limit - Maximum providers to return (default 50)
 */
export async function findEligibleProviders(
  city: string,
  category?: string | null,
  limit = 50
): Promise<EligibilityResult> {
  const db = getServiceClient();
  const excluded = {
    no_email: 0,
    bounced: 0,
    recent_broadcast: 0,
    recent_question: 0,
    active_connection: 0,
    excluded_stage: 0,
  };

  // Step 1: Find providers in this city from provider_outreach_tracking
  // The table has denormalized city/state columns
  const { data: trackingRows, error: trackingError } = await db
    .from("provider_outreach_tracking")
    .select("provider_id, stage, apollo_contact, city, state")
    .ilike("city", city)
    .limit(limit * 3);

  if (trackingError) {
    console.error("[city-broadcasts] Failed to find tracking rows:", trackingError);
    return { eligible: [], excluded };
  }

  if (!trackingRows || trackingRows.length === 0) {
    return { eligible: [], excluded };
  }

  // Filter by stage first
  const validTrackingRows = trackingRows.filter((row) => {
    if (row.stage && EXCLUDED_STAGES.has(row.stage)) {
      excluded.excluded_stage++;
      return false;
    }
    return true;
  });

  if (validTrackingRows.length === 0) {
    return { eligible: [], excluded };
  }

  // Step 2: Fetch provider details from olera-providers
  const providerIds = validTrackingRows.map((r) => r.provider_id);

  let providerQuery = db
    .from("olera-providers")
    .select("provider_id, provider_name, slug, city, state, provider_category, email")
    .in("provider_id", providerIds)
    .or("deleted.is.null,deleted.eq.false");

  // Filter by category if provided
  if (category) {
    providerQuery = providerQuery.ilike("provider_category", `%${category}%`);
  }

  const { data: providers, error: providerError } = await providerQuery;

  if (providerError) {
    console.error("[city-broadcasts] Failed to fetch providers:", providerError);
    return { eligible: [], excluded };
  }

  if (!providers || providers.length === 0) {
    return { eligible: [], excluded };
  }

  // Create lookup maps
  const trackingByProviderId = new Map(
    validTrackingRows.map((r) => [r.provider_id, r])
  );
  const providerByProviderId = new Map(
    providers.map((p) => [p.provider_id, p])
  );

  // Step 3: Build candidate list with emails
  interface Candidate {
    provider_id: string;
    email: string;
    name: string;
    slug: string;
    city: string;
    state: string | null;
    category: string | null;
  }

  const candidates: Candidate[] = [];

  for (const tracking of validTrackingRows) {
    const provider = providerByProviderId.get(tracking.provider_id);
    if (!provider) continue;

    // Get email: prefer Apollo contact email, fall back to organization email
    const apolloContact = tracking.apollo_contact as {
      email?: string;
    } | null;
    const email = apolloContact?.email || provider.email;

    if (!email) {
      excluded.no_email++;
      continue;
    }

    candidates.push({
      provider_id: tracking.provider_id,
      email,
      name: provider.provider_name || "Provider",
      slug: provider.slug || "",
      city: provider.city || city,
      state: provider.state || null,
      category: provider.provider_category || null,
    });
  }

  if (candidates.length === 0) {
    return { eligible: [], excluded };
  }

  // Step 4: Check exclusions
  const emails = candidates.map((c) => c.email);
  const candidateProviderIds = candidates.map((c) => c.provider_id);

  // Get bounced/complained emails
  const bouncedEmails = await getBouncedEmails(db, emails);

  // Get providers who received broadcasts recently
  const recentBroadcastProviders = await getRecentBroadcastProviders(
    db,
    candidateProviderIds,
    BROADCAST_COOLDOWN_DAYS
  );

  // Get providers who received direct questions recently
  const recentQuestionProviders = await getRecentQuestionProviders(
    db,
    candidateProviderIds,
    QUESTION_COOLDOWN_DAYS
  );

  // Get providers with active connections
  const activeConnectionProviders = await getActiveConnectionProviders(
    db,
    candidateProviderIds,
    CONNECTION_ACTIVE_DAYS
  );

  // Step 5: Filter candidates
  const eligible: EligibleProvider[] = [];

  for (const candidate of candidates) {
    // Check bounced/complained
    if (bouncedEmails.has(candidate.email.toLowerCase())) {
      excluded.bounced++;
      continue;
    }

    // Check recent broadcast
    if (recentBroadcastProviders.has(candidate.provider_id)) {
      excluded.recent_broadcast++;
      continue;
    }

    // Check recent direct question
    if (recentQuestionProviders.has(candidate.provider_id)) {
      excluded.recent_question++;
      continue;
    }

    // Check active connection
    if (activeConnectionProviders.has(candidate.provider_id)) {
      excluded.active_connection++;
      continue;
    }

    eligible.push(candidate);

    if (eligible.length >= limit) break;
  }

  return { eligible, excluded };
}

/**
 * Get emails that have bounced or received complaints.
 */
async function getBouncedEmails(
  db: ReturnType<typeof getServiceClient>,
  emails: string[]
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const { data, error } = await db
    .from("email_log")
    .select("recipient")
    .in("recipient", emails)
    .or("bounced_at.not.is.null,complained_at.not.is.null");

  if (error) {
    console.error("[city-broadcasts] Failed to check bounced emails:", error);
    return new Set();
  }

  return new Set((data || []).map((r) => r.recipient.toLowerCase()));
}

/**
 * Get providers who received a city broadcast in the last N days.
 */
async function getRecentBroadcastProviders(
  db: ReturnType<typeof getServiceClient>,
  providerIds: string[],
  days: number
): Promise<Set<string>> {
  if (providerIds.length === 0) return new Set();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await db
    .from("city_broadcast_recipients")
    .select("provider_id")
    .in("provider_id", providerIds)
    .eq("status", "sent")
    .gte("created_at", cutoff.toISOString());

  if (error) {
    console.error("[city-broadcasts] Failed to check recent broadcasts:", error);
    return new Set();
  }

  return new Set((data || []).map((r) => r.provider_id));
}

/**
 * Get providers who received a direct question notification in the last N days.
 */
async function getRecentQuestionProviders(
  db: ReturnType<typeof getServiceClient>,
  providerIds: string[],
  days: number
): Promise<Set<string>> {
  if (providerIds.length === 0) return new Set();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await db
    .from("email_log")
    .select("provider_id")
    .in("provider_id", providerIds)
    .eq("email_type", "question_received")
    .eq("status", "sent")
    .gte("created_at", cutoff.toISOString());

  if (error) {
    console.error("[city-broadcasts] Failed to check recent questions:", error);
    return new Set();
  }

  return new Set((data || []).filter((r) => r.provider_id).map((r) => r.provider_id));
}

/**
 * Get providers with active connections in the last N days.
 */
async function getActiveConnectionProviders(
  db: ReturnType<typeof getServiceClient>,
  providerIds: string[],
  days: number
): Promise<Set<string>> {
  if (providerIds.length === 0) return new Set();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await db
    .from("connections")
    .select("provider_id")
    .in("provider_id", providerIds)
    .in("status", ["pending", "active", "accepted"])
    .gte("created_at", cutoff.toISOString());

  if (error) {
    console.error("[city-broadcasts] Failed to check active connections:", error);
    return new Set();
  }

  return new Set((data || []).filter((r) => r.provider_id).map((r) => r.provider_id));
}
