/**
 * Email variant registry — the single source of truth for "render every email
 * variant from canned, PII-free sample data." Powers:
 *   - the consolidated Email Gallery (/admin/emails/gallery)
 *   - the per-cron preview (/api/admin/automations/[id]/preview, ?variant=)
 *   - stable shareable per-variant links (/api/admin/emails/sample?id=…&raw=1)
 *
 * Subsumes the old hardcoded digestVariantSample() so provider + family + transactional
 * live in ONE place. See plans/email-gallery.md.
 *
 * Constraints: fixtures MUST be deterministic (no Date.now / Math.random / new Date)
 * and PII-free. Image URLs use the Supabase-hosted stock set (email-proxy safe).
 */
import {
  // family
  connectionOutcomeCheckEmail,
  providerSilentEmail,
  familyNeverEngagedEmail,
  day10AwaitingEmail,
  familyPendingReachOutNudgeEmail,
  familyNudgeEmail,
  type CompareCardItem,
  // provider
  providerWeeklyDigestEmail,
  providerProfileCompletionEmail,
  coldProviderRankEmail,
  providerLeadDigestEmail,
  providerManagedAdsEmail,
} from "@/lib/email-templates";

export interface EmailVariant {
  /** Stable slug — used in URLs and the automations ?variant= param. */
  id: string;
  audience: "family" | "provider" | "transactional";
  /** Display grouping in the gallery, e.g. "Family · Compare cascade". */
  group: string;
  label: string;
  /** Rendered subject line (gallery header). */
  subject: string;
  /** Underlying email_type — cross-refs /admin/emails + email_log. */
  emailType: string;
  /** Cron/registry id that sends it — links to /admin/automations/[id]. */
  cron?: string;
  /** Renders the LIVE template with sample fixtures → full HTML. */
  render: () => string;
}

// ── Family fixtures ────────────────────────────────────────────────────────
const STOCK = "https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/fallback";
const FAM_RECS: CompareCardItem[] = [
  { name: "Golden Years Home Care", viewUrl: "https://olera.care/provider/golden-years", imageUrl: `${STOCK}/home-care-1.jpg`, priceRange: "$25–30/hr", rating: 4.8, reviewCount: 42, distanceMi: 2.3 },
  { name: "Comfort First Caregivers", viewUrl: "https://olera.care/provider/comfort-first", imageUrl: `${STOCK}/home-care-2.jpg`, priceRange: null, rating: 4.6, reviewCount: 18, distanceMi: 4.1 },
  { name: "Hill Country Home Aides", viewUrl: "https://olera.care/provider/hill-country", imageUrl: `${STOCK}/home-care-3.jpg`, priceRange: "from $24/hr", rating: null, reviewCount: null, distanceMi: 6.0 },
];
const F = {
  familyName: "Maria Garcia",
  providerName: "Evergreen Senior Care",
  quizUrl: "https://olera.care/benefits/finder",
  browseUrl: "https://olera.care/browse?type=home-care&location=Killeen%2C%20TX",
  inboxUrl: "https://olera.care/portal/inbox",
  guideUrl: "https://olera.care/olera-senior-care-guide-one-page.pdf",
  profileUrl: "https://olera.care/portal/profile",
};

// ── Provider fixtures (migrated verbatim from digestVariantSample) ──────────
const SAMPLE_BASE = {
  providerName: "Evergreen Home Care", providerSlug: "evergreen-home-care", tier: "low" as const,
  viewsPriorWeek: 6, deltaPct: 33, localDemand: 140, areaDemand: 210, city: "Austin", category: "home_care",
  topSource: "Google search",
};
const SAMPLE_LINK = "https://olera.care/provider/evergreen-home-care/onboard";

export const EMAIL_VARIANTS: EmailVariant[] = [
  // ─────────────── Family · Compare cascade (the coordinator) ───────────────
  {
    id: "family_outcome_check", audience: "family", group: "Family · Compare cascade",
    label: "R1 · Outcome check (sensor)", subject: `Did ${F.providerName} get back to you?`,
    emailType: "family_outcome_check", cron: "family-comms-coordinator",
    render: () => connectionOutcomeCheckEmail({
      familyName: F.familyName, providerName: F.providerName,
      yesUrl: "https://olera.care/connection-outcome?v=yes",
      notYetUrl: "https://olera.care/connection-outcome?v=not_yet",
      noUrl: "https://olera.care/connection-outcome?v=no",
    }),
  },
  {
    id: "family_provider_silent", audience: "family", group: "Family · Compare cascade",
    label: "R2 · Provider silent → compare", subject: "You're never limited to one — here are others worth comparing.",
    emailType: "family_provider_silent", cron: "family-comms-coordinator",
    render: () => providerSilentEmail({
      familyName: F.familyName, providerName: F.providerName, providerPassed: false,
      recommendedProviders: FAM_RECS, browseUrl: F.browseUrl, city: "Killeen", benefitsQuizUrl: F.quizUrl,
    }),
  },
  {
    id: "family_provider_declined", audience: "family", group: "Family · Compare cascade",
    label: "R2 · Provider declined (with message)", subject: "A few other providers near you, while you wait",
    emailType: "family_provider_silent", cron: "family-comms-coordinator",
    render: () => providerSilentEmail({
      familyName: F.familyName, providerName: F.providerName, providerPassed: true,
      declineMessage: "We're at capacity for new clients this month, so sorry.",
      recommendedProviders: FAM_RECS, browseUrl: F.browseUrl, city: "Killeen", benefitsQuizUrl: F.quizUrl,
    }),
  },
  {
    id: "family_never_engaged_compare", audience: "family", group: "Family · Compare cascade",
    label: "R3 · Never-engaged → compare", subject: "A few other providers near you worth comparing",
    emailType: "family_never_engaged", cron: "family-comms-coordinator",
    render: () => familyNeverEngagedEmail({
      familyName: F.familyName, providerName: F.providerName, guideUrl: F.guideUrl, inboxUrl: F.inboxUrl,
      recommendedProviders: FAM_RECS, browseUrl: F.browseUrl, benefitsQuizUrl: F.quizUrl,
    }),
  },
  {
    id: "family_never_engaged_fallback", audience: "family", group: "Family · Compare cascade",
    label: "R3 · Never-engaged → guide fallback (<3 alts)", subject: "A quick resource while you're thinking things over",
    emailType: "family_never_engaged", cron: "family-comms-coordinator",
    render: () => familyNeverEngagedEmail({
      familyName: F.familyName, providerName: F.providerName, guideUrl: F.guideUrl, inboxUrl: F.inboxUrl,
      benefitsQuizUrl: F.quizUrl,
    }),
  },
  {
    id: "day_10_awaiting", audience: "family", group: "Family · Compare cascade",
    label: "R4 · Provider responded → compare + choose", subject: `How does ${F.providerName} compare? A couple of others to weigh`,
    emailType: "day_10_awaiting", cron: "family-comms-coordinator",
    render: () => day10AwaitingEmail({
      familyName: F.familyName, providerName: F.providerName, inboxUrl: F.inboxUrl,
      supportUrl: "mailto:support@olera.care?subject=Help%20with%20next%20steps", alternativesUrl: F.browseUrl,
      recommendedProviders: FAM_RECS.slice(0, 2), benefitsQuizUrl: F.quizUrl,
    }),
  },
  {
    id: "family_reach_out_nudge", audience: "family", group: "Family · Compare cascade",
    label: "R5 · Pending reach-out", subject: `${F.providerName} is waiting to hear from you`,
    emailType: "family_reach_out_nudge", cron: "family-comms-coordinator",
    render: () => familyPendingReachOutNudgeEmail({
      familyName: F.familyName, providerName: F.providerName, providerCity: "Killeen, TX",
      messagePreview: "Hi! We'd love to help with care for your mother — when's a good time to talk?",
      daysSinceReachOut: 3, viewUrl: F.inboxUrl,
    }),
  },
  {
    id: "family_nudge", audience: "family", group: "Family · Compare cascade",
    label: "R6 · Stuck → completion as value-exchange", subject: "See sharper matches near you — and how to pay for care",
    emailType: "family_nudge", cron: "family-comms-coordinator",
    render: () => familyNudgeEmail({
      unsubscribeId: "sample-id", familyName: F.familyName, providerName: F.providerName,
      missingFields: ["budget", "care timeline", "ZIP code"], completionPercent: 35, profileUrl: F.profileUrl,
      benefitsQuizUrl: F.quizUrl,
    }),
  },

  // ─────────────── Provider · Weekly digest (migrated) ───────────────
  {
    id: "provider_family_question", audience: "provider", group: "Provider · Weekly digest",
    label: "Digest · family question", subject: "A family has a question about Evergreen Home Care",
    emailType: "weekly_analytics_digest", cron: "weekly-provider-digest",
    render: () => providerWeeklyDigestEmail({
      ...SAMPLE_BASE, viewsThisWeek: 9, ctaClicks: 2, leadsReceived: 0, questionsReceived: 1,
      unansweredQuestion: { id: "sample", question: "Do you accept Medicaid, and is weekend care available for my mother?", totalCount: 1 },
      answerUrl: `${SAMPLE_LINK}?action=question`, marketRank: null,
    }),
  },
  {
    id: "provider_digest_rank", audience: "provider", group: "Provider · Weekly digest",
    label: "Digest · rank", subject: "You're #3 of 21 home care agencies in Austin",
    emailType: "weekly_analytics_digest", cron: "weekly-provider-digest",
    render: () => providerWeeklyDigestEmail({
      ...SAMPLE_BASE, viewsThisWeek: 12, ctaClicks: 3, leadsReceived: 1, questionsReceived: 0,
      marketRank: { rank: 3, outOf: 21, cityLabel: "Austin", careLabel: "home care", flattering: true },
    }),
  },
  {
    id: "provider_referral_teaser", audience: "provider", group: "Provider · Weekly digest",
    label: "Digest · referral teaser", subject: "3 Austin-area places families may ask about care",
    emailType: "weekly_analytics_digest", cron: "weekly-provider-digest",
    render: () => providerWeeklyDigestEmail({
      ...SAMPLE_BASE, viewsThisWeek: 4, ctaClicks: 1, leadsReceived: 0, questionsReceived: 0,
      marketRank: { rank: 3, outOf: 21, cityLabel: "Austin", careLabel: "home care", flattering: true },
      referralTeaser: {
        totalSources: 18, starterTotal: 5, workedCount: 0, respondedCount: 0, referringCount: 0,
        targets: [
          { name: "St. David's South Austin Medical Center", category: "hospital", distanceMiles: 2.4 },
          { name: "Austin Wellness & Rehabilitation", category: "skilled_nursing", distanceMiles: 3.1 },
          { name: "AGE of Central Texas", category: "senior_resource", distanceMiles: 4.8 },
        ],
      },
      marketUrl: `${SAMPLE_LINK}?action=market`,
    }),
  },
  {
    id: "provider_digest_plain", audience: "provider", group: "Provider · Weekly digest",
    label: "Digest · plain", subject: "9 families viewed your page this week",
    emailType: "weekly_analytics_digest", cron: "weekly-provider-digest",
    render: () => providerWeeklyDigestEmail({
      ...SAMPLE_BASE, viewsThisWeek: 9, ctaClicks: 2, leadsReceived: 0, questionsReceived: 0, marketRank: null,
    }),
  },
  {
    id: "provider_completion", audience: "provider", group: "Provider · Lifecycle",
    label: "Profile completion", subject: "See what families see on Evergreen Home Care",
    emailType: "provider_profile_completion",
    render: () => providerProfileCompletionEmail({ providerName: "Evergreen Home Care", providerSlug: "evergreen-home-care", ctaUrl: SAMPLE_LINK }),
  },
  {
    id: "provider_cold_rank", audience: "provider", group: "Provider · Lifecycle",
    label: "Cold rank (quiet week)", subject: "Families in Austin rank you #3 of 21",
    emailType: "cold_provider_rank",
    render: () => coldProviderRankEmail({ rank: 3, outOf: 21, cityLabel: "Austin", careLabel: "home care", ctaUrl: SAMPLE_LINK, manageUrl: SAMPLE_LINK, removeUrl: `${SAMPLE_LINK}/remove`, unsubscribeUrl: `${SAMPLE_LINK}/unsubscribe` }),
  },
  {
    id: "provider_leads", audience: "provider", group: "Provider · Lifecycle",
    label: "Lead digest", subject: "2 families reached out about Evergreen Home Care this week",
    emailType: "provider_lead_digest",
    render: () => providerLeadDigestEmail({ providerName: "Evergreen Home Care", providerSlug: "evergreen-home-care", leadCount: 2, ctaUrl: SAMPLE_LINK, manageUrl: SAMPLE_LINK, unsubscribeUrl: `${SAMPLE_LINK}/unsubscribe` }),
  },
  {
    id: "provider_managed_ads", audience: "provider", group: "Provider · Lifecycle",
    label: "Managed ads", subject: "140 families searched for care near Austin this week",
    emailType: "provider_managed_ads",
    render: () => providerManagedAdsEmail({ providerName: "Evergreen Home Care", providerSlug: "evergreen-home-care", ctaUrl: `${SAMPLE_LINK}?action=ads`, city: "Austin", category: "home_care_agency", localDemand: 140 }),
  },
];

export function getVariant(id: string): EmailVariant | undefined {
  return EMAIL_VARIANTS.find((v) => v.id === id);
}

/** Variants sent by a given cron/registry id (for the per-job automations preview). */
export function variantsForCron(cronId: string): EmailVariant[] {
  return EMAIL_VARIANTS.filter((v) => v.cron === cronId);
}
