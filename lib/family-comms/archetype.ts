/**
 * Care-seeker ARCHETYPE — the intent/urgency self-sort that opens the guidance
 * journey (Logan's idea, 2026-07-07). It REPLACES the financial self-sort as the
 * FIRST question a family gets: people know their urgency instantly but not
 * their "financial path", and urgency is what should really drive tone, cadence,
 * and which help we lead with. The financial self-sort is demoted to stage 2
 * (asked later, once the family has engaged).
 *
 * Delivered in the "Have you heard back?" shape: one question, three chips,
 * nothing else. Captured through the SAME scanner-safe path as the benefits
 * micro-quiz (signed quiz token → /family/quiz-answer page → client POST on
 * mount), so a mail-scanner pre-clicking a chip can never mis-file the answer.
 * Stored at business_profiles.metadata.archetype.
 */

export type Archetype = "urgent" | "avoiding" | "researching";

export const ARCHETYPE_ANSWERS: ReadonlySet<string> = new Set<Archetype>([
  "urgent",
  "avoiding",
  "researching",
]);

export interface ArchetypeChip {
  label: string;
  answer: Archetype;
}

/**
 * The one question. Order is highest-urgency first (what an anxious family scans
 * for), but no chip is styled as the "primary" action — they're equal weight.
 */
export const ARCHETYPE_ASK: { prompt: string; chips: ArchetypeChip[] } = {
  prompt: "Where are you in all this right now?",
  chips: [
    { label: "I need help this week", answer: "urgent" },
    { label: "I'd rather avoid senior living", answer: "avoiding" },
    { label: "I'm just researching for now", answer: "researching" },
  ],
};

export interface ArchetypePayoff {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
}

/** Valid /browse ?type= slugs (from app/browse/page.tsx careTypeSEO). */
const KNOWN_BROWSE_SLUGS: ReadonlySet<string> = new Set([
  "home-care",
  "home-health",
  "assisted-living",
  "memory-care",
  "nursing-homes",
  "independent-living",
]);

/**
 * Map a family care_type ("Memory Care", "home_care_agency") to a /browse
 * ?type= slug, or null when we can't confidently match — then we omit the param
 * so browse shows everything nearby instead of an empty filtered list.
 */
export function careTypeToBrowseSlug(raw: string | null | undefined): string | null {
  const s = (raw || "").toLowerCase().replace(/_/g, " ").replace(/\s+agency$/, "").trim();
  if (!s) return null;
  if (s.includes("memory")) return "memory-care";
  if (s.includes("nursing") || s.includes("skilled")) return "nursing-homes";
  if (s.includes("assisted")) return "assisted-living";
  if (s.includes("independent")) return "independent-living";
  if (s.includes("home health")) return "home-health";
  if (s.includes("home")) return "home-care";
  return null;
}

function browseHref(city: string | null, typeSlug: string | null): string {
  const qs = new URLSearchParams();
  if (typeSlug && KNOWN_BROWSE_SLUGS.has(typeSlug)) qs.set("type", typeSlug);
  if (city) qs.set("location", city);
  const q = qs.toString();
  return q ? `/browse?${q}` : "/browse";
}

/**
 * Archetype-specific payoff — the first taste of "archetype-specific comms".
 *   urgent      → move to real options now (matching providers nearby)
 *   avoiding    → the non-facility path (in-home care)
 *   researching → orient calmly, benefits/cost education (no pressure)
 * City + care type personalize the destination when we hold them.
 */
export function archetypePayoff(
  archetype: Archetype,
  opts: { city?: string | null; careType?: string | null },
): ArchetypePayoff {
  const city = opts.city || null;
  const near = city ? ` near ${city}` : " near you";
  if (archetype === "urgent") {
    return {
      headline: "Let's move.",
      subline: `Here are providers${near} that match what you need. You can reach out to a few at once, and we'll help you compare.`,
      ctaLabel: "See providers ready to help",
      ctaHref: browseHref(city, careTypeToBrowseSlug(opts.careType)),
    };
  }
  if (archetype === "avoiding") {
    return {
      headline: "It doesn't have to be a facility.",
      subline: `Plenty of families keep care at home. Here are in-home and non-facility options${near} worth a look.`,
      ctaLabel: "See in-home care options",
      ctaHref: browseHref(city, "home-care"),
    };
  }
  return {
    headline: "Smart to look early.",
    subline:
      "No pressure at all. Here's how families think through senior care, and what it actually costs, so you're ready when the time comes.",
    ctaLabel: "See how care gets paid for",
    ctaHref: "/benefits/finder",
  };
}
