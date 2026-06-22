import { getServiceClient } from "@/lib/admin";

/**
 * Shared alternative-provider finder for the family help cascade.
 *
 * Used by both the self-report landing page (app/api/families/connection-outcome)
 * and the Family Comms Coordinator's "provider silent" rung. One copy so the two
 * surfaces can never drift. See plans/family-comms-system.md.
 */

export interface ThreadMessage {
  from_profile_id: string;
  text?: string;
  is_auto_reply?: boolean;
}

export interface RecommendedProvider {
  name: string;
  slug: string;
  url: string;
  priceRange: string | null;
}

/**
 * Find up to 3 alternative providers in the same area + care type. Prefers
 * providers that have actually responded to a lead in the last 60 days
 * ("responsive"), then fills remaining slots with other matching providers so the
 * cascade is never empty when options exist.
 */
export async function findAlternativeProviders(
  db: ReturnType<typeof getServiceClient>,
  excludeProfileId: string,
  city: string | undefined,
  state: string | undefined,
  careTypes: string[],
): Promise<RecommendedProvider[]> {
  if (!city || !state || careTypes.length === 0) return [];

  const { data: candidates } = await db
    .from("business_profiles")
    .select("id, display_name, slug, care_types, metadata")
    .eq("type", "organization")
    .eq("is_active", true)
    .eq("city", city)
    .eq("state", state)
    .neq("id", excludeProfileId)
    .limit(50);

  if (!candidates?.length) return [];

  const matching = candidates.filter((p) => {
    const cts = (p.care_types as string[]) || [];
    return cts.some((ct) => careTypes.includes(ct));
  });
  if (matching.length === 0) return [];

  // Responsiveness: who has a real (non-auto) provider reply in the last 60 days.
  const ids = matching.map((p) => p.id);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentConns } = await db
    .from("connections")
    .select("to_profile_id, metadata")
    .in("to_profile_id", ids)
    .gte("created_at", sixtyDaysAgo);

  const responsive = new Set<string>();
  for (const c of recentConns || []) {
    if (responsive.has(c.to_profile_id)) continue;
    const thread = ((c.metadata as Record<string, unknown> | null)?.thread as ThreadMessage[]) || [];
    if (thread.some((m) => m.from_profile_id === c.to_profile_id && !m.is_auto_reply && m.text?.trim())) {
      responsive.add(c.to_profile_id);
    }
  }

  const toCard = (p: (typeof matching)[number]): RecommendedProvider => ({
    name: p.display_name as string,
    slug: p.slug as string,
    url: `/provider/${p.slug}?rp=${p.slug}`,
    priceRange: ((p.metadata as Record<string, unknown> | null)?.price_range as string) || null,
  });

  const ranked = [
    ...matching.filter((p) => responsive.has(p.id)),
    ...matching.filter((p) => !responsive.has(p.id)),
  ];
  return ranked.slice(0, 3).map(toCard);
}
