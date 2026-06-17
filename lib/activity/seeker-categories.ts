/**
 * Care-seeker (family) activity taxonomy — the hierarchy for the Activity
 * Center "Families" tab, mirroring lib/activity/provider-categories.ts. Every
 * seeker_activity event maps to exactly one care-seeker journey stage. The admin
 * page renders these as the orientation stat strip + drill-down; the API turns a
 * category into the set of event_types to query.
 *
 * Source of truth — keep in sync with FAMILY_EVENT_TYPES in
 * app/api/activity/track/route.ts (plus benefits_completed, written by
 * app/api/benefits/save-results/route.ts). Every event surfaced on the Families
 * tab should appear in exactly one category here, or it falls into "Other".
 *
 * No "flags" overlay (unlike providers) — care seekers have no trust signal.
 */

export type SeekerCategoryKey =
  | "connecting"
  | "questions"
  | "benefits"
  | "profile"
  | "saving"
  | "outreach"
  | "email";

export interface SeekerCategoryMeta {
  key: SeekerCategoryKey;
  label: string;
  /** One-line plain-English description (tooltip / empty-state copy). */
  blurb: string;
  eventTypes: string[];
}

// Ordered most-meaningful-first. "Connecting" leads — it's the care-seeker KPI.
export const SEEKER_CATEGORIES: SeekerCategoryMeta[] = [
  {
    key: "connecting",
    label: "Connecting",
    blurb: "Reached out to providers",
    eventTypes: ["connection_sent", "matches_activated"],
  },
  {
    key: "questions",
    label: "Asking questions",
    blurb: "Asked providers a question",
    // qa_email_capture_impression is the "get notified" prompt, not an actual
    // ask — it lives under "Saving an account" so this bucket = real questions.
    eventTypes: ["question_asked", "question_email_enriched"],
  },
  {
    key: "benefits",
    label: "Exploring benefits",
    blurb: "Completed a benefits guide",
    eventTypes: ["benefits_completed"],
  },
  {
    key: "profile",
    label: "Building a profile",
    blurb: "Enriched and published their care profile",
    eventTypes: ["profile_enriched", "profile_published", "go_live_skipped"],
  },
  {
    key: "saving",
    label: "Saving an account",
    blurb: "Engaged save-to-account and get-notified prompts",
    eventTypes: [
      "save_nudge_shown",
      "save_nudge_dismissed",
      "save_nudge_signup_clicked",
      "save_nudge_converted",
      // Q&A "get notified when answered" email-capture prompt (guest askers).
      "qa_email_capture_impression",
    ],
  },
  {
    key: "outreach",
    label: "Provider suggestions",
    blurb: "Saw and acted on suggested providers",
    eventTypes: [
      "outreach_module_impression",
      "outreach_card_clicked",
      "outreach_request_submitted",
    ],
  },
  {
    key: "email",
    label: "Email clicks",
    blurb: "Clicked a link in one of our emails",
    eventTypes: ["email_click"],
  },
];

export const SEEKER_CATEGORY_MAP: Record<SeekerCategoryKey, SeekerCategoryMeta> =
  SEEKER_CATEGORIES.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<SeekerCategoryKey, SeekerCategoryMeta>
  );

const EVENT_TO_CATEGORY: Record<string, SeekerCategoryKey> = {};
for (const cat of SEEKER_CATEGORIES) {
  for (const ev of cat.eventTypes) EVENT_TO_CATEGORY[ev] = cat.key;
}

export function seekerCategoryForEvent(eventType: string): SeekerCategoryKey | null {
  return EVENT_TO_CATEGORY[eventType] ?? null;
}

export function isSeekerCategory(value: string | null | undefined): value is SeekerCategoryKey {
  return !!value && value in SEEKER_CATEGORY_MAP;
}

export function eventTypesForSeekerCategory(key: SeekerCategoryKey): string[] {
  return SEEKER_CATEGORY_MAP[key]?.eventTypes ?? [];
}

/** All event types that belong to a category — the full Families allowlist. */
export const SEEKER_ALL_EVENT_TYPES: string[] = SEEKER_CATEGORIES.flatMap((c) => c.eventTypes);

/**
 * Humanized, past-tense descriptions for the feed. Never show a raw snake_case
 * event name to an operator.
 */
export const SEEKER_EVENT_LABELS: Record<string, string> = {
  // Connecting
  connection_sent: "Connected with a provider",
  matches_activated: "Activated matches",
  // Asking questions
  question_asked: "Asked a question",
  qa_email_capture_impression: "Saw the question prompt",
  question_email_enriched: "Added email via a question",
  // Exploring benefits
  benefits_completed: "Completed a benefits guide",
  // Building a profile
  profile_enriched: "Enriched their profile",
  profile_published: "Published their profile",
  go_live_skipped: "Skipped going live",
  // Saving an account
  save_nudge_shown: "Saw a save prompt",
  save_nudge_dismissed: "Dismissed a save prompt",
  save_nudge_signup_clicked: "Tapped save → sign up",
  save_nudge_converted: "Signed up to save",
  // Provider suggestions
  outreach_module_impression: "Saw provider suggestions",
  outreach_card_clicked: "Viewed a suggested provider",
  outreach_request_submitted: "Requested a suggested provider",
  // Email
  email_click: "Clicked an email link",
};

/** Friendly phrase for a feed row; falls back to a de-snaked label. */
export function seekerEventLabel(eventType: string): string {
  if (SEEKER_EVENT_LABELS[eventType]) return SEEKER_EVENT_LABELS[eventType];
  return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
