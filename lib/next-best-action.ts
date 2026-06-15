import type { ProfileCategory } from "@/lib/types";
import type { ProfileCompleteness } from "@/lib/profile-completeness";

/**
 * Sections the picker can nudge providers toward. Excludes "reviews" and
 * "response_rate" because they're outcomes (driven by real activity), not
 * sections a provider can edit. Excludes "owner" because it isn't scored
 * in profile-completeness today.
 */
export type NudgeSectionId =
  | "overview"
  | "pricing"
  | "screening"
  | "services"
  | "gallery"
  | "about"
  | "payment";

export const NUDGE_SECTION_IDS: readonly NudgeSectionId[] = [
  "overview",
  "pricing",
  "screening",
  "services",
  "gallery",
  "about",
  "payment",
];

const NUDGE_SECTION_ID_SET = new Set<string>(NUDGE_SECTION_IDS);

/** Profile categories where the provider IS a physical place families visit. */
const PLACE_CATEGORIES = new Set<ProfileCategory>([
  "independent_living",
  "assisted_living",
  "memory_care",
  "nursing_home",
  "inpatient_hospice",
  "rehab_facility",
  "adult_day_care",
  "wellness_center",
]);

function isPlaceBased(category: ProfileCategory | null | undefined): boolean {
  if (!category) return false;
  return PLACE_CATEGORIES.has(category);
}

export interface NudgeCopy {
  headline: string;
  subline?: string;
  cta: string;
}

interface CopyEntry {
  default: NudgeCopy;
  /** Override copy for facility-based providers (assisted living, memory care, etc.) */
  place?: NudgeCopy;
}

/**
 * Soft-honest copy. No data-claim multipliers ("photos get 2x more questions")
 * unless we have data backing them. Lead with what families experience, not
 * what the provider gets. Category branching only where wording genuinely
 * needs to differ — most sections share copy across place vs service.
 */
const COPY: Record<NudgeSectionId, CopyEntry> = {
  gallery: {
    default: {
      headline: "Add a photo so families can put a face to your business",
      subline: "A few photos help families feel more comfortable reaching out.",
      cta: "Add photos",
    },
    place: {
      headline: "Add a photo so families can picture your space",
      subline: "Photos of the community help families decide before they call.",
      cta: "Add photos",
    },
  },
  overview: {
    default: {
      headline: "Finish your profile basics",
      subline: "Name, category, location, and a profile photo — what families look for first.",
      cta: "Add details",
    },
  },
  pricing: {
    default: {
      headline: "Help families know if you're a fit",
      subline: "Add a starting price or set “contact for pricing.” Either is better than blank.",
      cta: "Add pricing",
    },
  },
  services: {
    default: {
      headline: "List your services so families can find you in search",
      subline: "Care types are how families filter — the more accurate, the better the match.",
      cta: "Add services",
    },
  },
  about: {
    default: {
      headline: "Tell families about your business in a few sentences",
      subline: "A short description goes a long way before they reach out.",
      cta: "Write about",
    },
    place: {
      headline: "Tell families about your community in a few sentences",
      subline: "A short description goes a long way before they call.",
      cta: "Write about",
    },
  },
  screening: {
    default: {
      headline: "Show families how you screen your team",
      subline: "Background checks, references, training — what makes your hiring rigorous.",
      cta: "Add screening",
    },
  },
  payment: {
    default: {
      headline: "Add accepted payments so families don't have to ask",
      subline: "Medicare, Medicaid, private pay, long-term care insurance — what you take.",
      cta: "Add payments",
    },
  },
};

function getCopy(section: NudgeSectionId, category: ProfileCategory | null | undefined): NudgeCopy {
  const entry = COPY[section];
  if (isPlaceBased(category) && entry.place) return entry.place;
  return entry.default;
}

/**
 * Resolved copy for a section without a ProfileCompleteness — used by the admin
 * banner preview to render each completion banner's headline/subline/CTA from
 * the same source the live picker uses (no drift). Defaults to the generic
 * (service) copy; pass a category to see the place-based wording.
 */
export function previewCopy(
  section: NudgeSectionId,
  category?: ProfileCategory | null,
): NudgeCopy {
  return getCopy(section, category ?? null);
}

export interface NextAction {
  sectionId: NudgeSectionId;
  /** Section weight (existing impact heuristic from profile-completeness). */
  weight: number;
  /** Resolved copy for the provider's category. */
  copy: NudgeCopy;
}

/**
 * Pick the highest-impact incomplete section for this provider. Returns null
 * when every nudgeable section is at 100% (the dashboard should show nothing
 * — we don't have a curiosity branch in v1).
 *
 * Scoring rules:
 *   1. Sections at 0% beat sections that are partially filled. Empty is the
 *      most actionable state — a half-filled section is at least started.
 *   2. Within each tier, order by section weight (higher = more impact on the
 *      overall profile-completeness score). These are TJ's signed-off weights
 *      from lib/profile-completeness.ts — we reuse them rather than invent
 *      a parallel ranking.
 *   3. Stable tie-break by section ID so the picker is deterministic.
 */
export function pickNextAction(
  completeness: ProfileCompleteness,
  category: ProfileCategory | null | undefined,
  exclude?: ReadonlySet<string>,
): NextAction | null {
  const candidates = completeness.sections
    .filter((s) => NUDGE_SECTION_ID_SET.has(s.id) && s.percent < 100 && !exclude?.has(s.id))
    .slice()
    .sort((a, b) => {
      const aZero = a.percent === 0 ? 0 : 1;
      const bZero = b.percent === 0 ? 0 : 1;
      if (aZero !== bZero) return aZero - bZero;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.id.localeCompare(b.id);
    });

  const top = candidates[0];
  if (!top) return null;

  const sectionId = top.id as NudgeSectionId;
  return {
    sectionId,
    weight: top.weight,
    copy: getCopy(sectionId, category),
  };
}
