/**
 * Comms journeys — the declarative "which message comes before which" map that
 * /admin/automations/[id] renders as a sequence timeline.
 *
 * WHY THIS EXISTS: the benefits cascade is ONE family experience executed by
 * TWO crons — the daily coordinator composes B1 drafts and sends B2, while the
 * hourly navigator scheduler fires the TJ-approved letters — so no single cron
 * page can show the whole picture from its own registry entry. This module is
 * the journey-level source both pages share: each page highlights the steps it
 * owns and dims (and links) the ones another automation runs.
 *
 * DRIFT GUARD: timings and gates here are hand-authored mirrors of the real
 * ladder in app/api/cron/family-comms-coordinator/route.ts and the send path
 * in lib/family-comms/benefits-navigator-send.server.ts. If you change a time
 * band, gate, or rung order there, update the matching step here (grep for
 * "journey.ts" — both files carry a pointer comment).
 *
 * Pure data + pure functions, client-safe (the detail page imports directly).
 */

export interface JourneyStep {
  key: string;
  /** Step name, e.g. "B1 · Letter sent (+ companion text)". */
  title: string;
  /** When it fires relative to the journey anchor, e.g. "Intake +2–10d". */
  timing: string;
  /** What happens, in plain terms. */
  description: string;
  /** email_log email_type(s) sent at this step — display string, may list several. */
  emailType?: string;
  /** Consent-gated text sent alongside (email_log channel='sms'), if any. */
  smsType?: string;
  /** Registry id of the automation that executes this step. Absent = event-driven. */
  ownedBy?: string;
  /** Shown instead of an owner link when the step isn't cron-driven. */
  ownerNote?: string;
  /** One-line gate note shown under the step. */
  gate?: string;
  /** Product phase used to group long journeys into scannable chapters. */
  phase?: string;
  /** Small, plain-language traits such as "Conditional" or "Repeats per lead". */
  traits?: string[];
  /** Exact email sample selected by the family-journey preview link. */
  emailSampleId?: string;
  /** Exact text sample selected by the family-journey preview link. */
  smsSampleId?: string;
}

export interface CommsJourney {
  key: string;
  title: string;
  /** "time" = a dated sequence; "priority" = a ladder where the highest
   *  matching rung wins each cycle (order = priority, not chronology). */
  ordering: "time" | "priority";
  description: string;
  /** Eyebrow label. Defaults to "Family journey" for time-ordered journeys. */
  audienceLabel?: string;
  steps: JourneyStep[];
}

const BENEFITS_CASCADE: CommsJourney = {
  key: "benefits_cascade",
  title: "Benefits cascade — the family's sequence",
  ordering: "time",
  description:
    "One guidance journey across the channels a family chose: results arrive first, the daily coordinator drafts B1 and sends B2, and the hourly scheduler (or TJ's button) fires the approved first step. Text replies update the same living plan.",
  steps: [
    {
      key: "intake_results",
      title: "Results email delivered (when email is provided)",
      timing: "Day 0 · New-family intake completed",
      description:
        "A new family completes the benefits finder with an email. Olera identifies the strongest matches, adds them to the family's private plan, and emails the living /m plan link.",
      emailType: "benefits_results_saved",
      emailSampleId: "benefits_results_saved",
      ownedBy: "benefits-results-texts",
    },
    {
      key: "intake_results_sms",
      title: "Results link texted (optional)",
      timing: "Day 0 · When a phone is provided",
      description:
        "A new family who enters a phone under the SMS disclosure immediately receives the same living /m plan link. That choice is stored as sms_consent for the later navigator and check-in, so the text thread does not break after Day 0.",
      smsType: "benefits_results_sms",
      smsSampleId: "sms_benefits_match",
      ownedBy: "benefits-results-texts",
      gate: "Requires a valid phone entered with the SMS disclosure; skipped when no phone is provided",
    },
    {
      key: "b1_draft",
      title: "B1 · Navigator guidance drafted",
      timing: "Intake +2–10d",
      description:
        "The coordinator composes personal TJ-signed first-step guidance: an email when available and a reply-enabled text for consented families. It parks the draft in /admin/benefits for review.",
      ownedBy: "family-comms-coordinator",
      gate: "Draft only — nothing reaches the family until TJ approves it in the queue",
    },
    {
      key: "b1_send",
      title: "B1 · First step sent (email and/or text)",
      timing: "When TJ sends, or at the scheduled hour",
      description:
        "TJ's Send-as-TJ button and the hourly scheduler run one shared send path. Email families receive the reviewed letter; consented text families receive the first step in the same thread. Text-only families keep moving without being forced into email.",
      emailType: "benefits_first_step",
      smsType: "benefits_first_step_sms",
      emailSampleId: "benefits_first_step",
      smsSampleId: "sms_benefits_first_step",
      ownedBy: "benefits-navigator-scheduler",
      gate: "At least one reachable consented channel is required; an after-hours companion text queues for morning, while a text-only B1 stays pending and reschedules to the next legal window",
    },
    {
      key: "b2",
      title: "B2 · Progress check (email and/or text)",
      timing: "First step +3–14d",
      description:
        "Three to fourteen days after B1, Olera asks what happened next. Email offers the existing outcome choices; text understands CALLED, NO ANSWER, APPLIED, NEED DOCS, WAITING, NOT ELIGIBLE, or STUCK and writes that status back to the living plan. Text-only families receive B2 by text.",
      emailType: "benefits_check_in",
      smsType: "benefits_check_in_sms",
      emailSampleId: "benefits_check_in",
      smsSampleId: "sms_benefits_check_in",
      ownedBy: "family-comms-coordinator",
      gate: "One-shot; skipped once an outcome is reported; STUCK alerts the Olera team without promising an unstaffed response time",
    },
    {
      key: "suppression",
      title: "Completion track paused",
      timing: "While the cascade is in flight (~21d)",
      description:
        "Benefits families are excluded from generic profile-completion nudges while their cascade is active. They rejoin after an outcome is recorded or the 21-day window ends; the window ending is not treated as proof the problem was resolved.",
      ownedBy: "family-comms-coordinator",
    },
  ],
};

const HELP_CASCADE_LADDER: CommsJourney = {
  key: "help_cascade_ladder",
  title: "Help-cascade ladder — how the daily pick works",
  ordering: "priority",
  description:
    "Each family gets at most ONE governed email per daily run; the first matching rung from the top wins. Global stops come first: unsubscribed, self-reported \"yes they got back to me\", or an active live thread means nothing sends.",
  steps: [
    {
      key: "r1",
      title: "R1 · Outcome check (sensor)",
      timing: "Inquiry 48–72h old, provider silent",
      description: "\"Did they get back to you?\" — the ground-truth sensor that catches stalled connections early.",
      emailType: "family_outcome_check",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "archetype",
      title: "First touch · Archetype (intent self-sort)",
      timing: "Any recent inquiry, once ever",
      description: "One question, three scenarios — captures where the family is so tone and cadence are tailored.",
      emailType: "family_archetype",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r2",
      title: "R2 · Provider silent → alternatives",
      timing: "Provider still silent after the outcome check",
      description: "Compare-led rescue: responsive alternatives near them, one-tap introductions.",
      emailType: "family_provider_silent",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r3",
      title: "R3 · Never engaged → compare / guide",
      timing: "Family never engaged with their inquiry",
      description: "Guide fallback when the market is thin (<3 alternatives), compare otherwise.",
      emailType: "family_never_engaged",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r4",
      title: "R4 · Provider responded → compare + choose",
      timing: "~Day 10, family hasn't chosen",
      description: "The provider replied but the family stalled — help them compare and decide.",
      emailType: "day_10_awaiting",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "r5",
      title: "R5 · Pending reach-out",
      timing: "Reach-out delivered, family hasn't acted",
      description: "Nudges the family back to a provider's waiting reach-out message.",
      emailType: "family_reach_out_nudge",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "b1_draft",
      title: "B1 · Navigator draft (benefits cascade)",
      timing: "Benefits intake +2–10d",
      description: "Composes the TJ-signed first-step letter into the /admin/benefits queue — see the Benefits cascade sequence below for the full journey.",
      ownedBy: "family-comms-coordinator",
      gate: "Composes a draft; the send is TJ-gated and fired by the navigator scheduler",
    },
    {
      key: "b2",
      title: "B2 · Benefits check-in",
      timing: "First step +3–14d",
      description: "The forward-looking check-in, with its consent-gated mirror text.",
      emailType: "benefits_check_in",
      smsType: "benefits_check_in_sms",
      ownedBy: "family-comms-coordinator",
    },
    {
      key: "completion",
      title: "Completion track (Track 2)",
      timing: "Signup days 0/2/6/13, then monthly",
      description: "The single owner of the \"finish your profile\" ask, for any incomplete family the higher rungs didn't claim. Suppressed while a benefits cascade is in flight.",
      emailType: "completion_nudge_1–4, completion_maintenance",
      ownedBy: "family-comms-coordinator",
    },
  ],
};

/**
 * One provider experience, implemented by three different delivery paths:
 * request/lifecycle events, the daily readiness + outcome worker, and the
 * hourly launch scheduler. The admin should teach the experience first and
 * expose those engines as supporting operational detail.
 *
 * DRIFT GUARD: mirrors app/api/provider/ad-boost/request/route.ts,
 * app/api/admin/ad-boost/route.ts, app/api/cron/ad-boost-profile-reminders,
 * and lib/ad-boost/{lead,outcome,lifecycle}-notifications.server.ts.
 */
export const AD_BOOST_PROVIDER_JOURNEY: CommsJourney = {
  key: "ad_boost_provider_journey",
  title: "Ad Boost campaign — the provider journey",
  ordering: "time",
  audienceLabel: "Provider journey",
  description:
    "One campaign story across request, launch, live results, and outcome follow-up. Branches are conditional; lead delivery and outcome checks repeat for each attributed inquiry.",
  steps: [
    {
      key: "request_queued",
      phase: "Request",
      title: "Request saved · profile needed",
      timing: "At request · if not launch-ready",
      description:
        "Olera saves the provider's requested setup week and budget before their profile is ready, then points them to the missing profile or verification work.",
      emailType: "ad_boost_queued",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_queued",
      traits: ["Conditional", "One-time"],
      gate: "Only when the profile is below the launch threshold or verification is incomplete",
    },
    {
      key: "request_ready",
      phase: "Request",
      title: "Request received · campaign review next",
      timing: "At request · if launch-ready",
      description:
        "A complete, verified provider gets an immediate confirmation: the request is saved, the starter promotion is clear, and the family-facing page enters campaign review before setup.",
      emailType: "ad_boost_requested",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_requested",
      traits: ["Conditional", "One-time"],
      gate: "Mutually exclusive with the queued email",
    },
    {
      key: "profile_reminder",
      phase: "Prepare",
      title: "Finish-profile reminder",
      timing: "Queued for 48+ hours",
      description:
        "If the request is still blocked, the daily worker sends one focused reminder naming the next useful profile or verification step.",
      emailType: "ad_boost_profile_reminder",
      ownedBy: "ad-boost-profile-reminders",
      emailSampleId: "ad_boost_profile_reminder",
      traits: ["Conditional", "One-time"],
      gate: "Skipped when the provider becomes launch-ready before the reminder is due",
    },
    {
      key: "promotion_ready",
      phase: "Prepare",
      title: "Queued profile becomes review-ready",
      timing: "When eligibility is re-checked",
      description:
        "The saved request advances without a second submission. The provider gets a clear confirmation and the concierge team is notified that final campaign review can begin.",
      emailType: "ad_boost_ready",
      ownedBy: "ad-boost-profile-reminders",
      emailSampleId: "ad_boost_ready",
      traits: ["Conditional", "One-time"],
      gate: "Only for a request that started in the queued path",
    },
    {
      key: "photo_review",
      phase: "Prepare",
      title: "Review campaign photos",
      timing: "Before concierge setup",
      description:
        "The concierge reviews the effective gallery at landing-page size. This is separate from profile completeness: image URLs can fill a profile without being useful paid-traffic creative.",
      ownerNote: "Human-reviewed in the Ad Boost concierge queue",
      traits: ["Silent step", "Paid-traffic gate"],
      gate: "Every pre-launch campaign must be marked photo-ready before it can move to scheduled or live",
    },
    {
      key: "photo_update_requested",
      phase: "Prepare",
      title: "One photo update requested",
      timing: "After concierge photo review · if needed",
      description:
        "The provider's request remains saved while one supportive email explains why clearer real-world photos protect campaign spend and deep-links to the gallery editor.",
      emailType: "ad_boost_photo_update",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_photo_update",
      traits: ["Conditional", "One-time"],
      gate: "Only when the concierge marks the landing-page gallery as needing an update",
    },
    {
      key: "photo_update_reminder",
      phase: "Prepare",
      title: "Photo-update reminder",
      timing: "After 3 business days · once",
      description:
        "If no new gallery has been saved, the daily worker sends one concise reminder. Saving photos stops the reminder immediately; there is no ongoing nag sequence.",
      emailType: "ad_boost_photo_reminder",
      ownedBy: "ad-boost-profile-reminders",
      emailSampleId: "ad_boost_photo_reminder",
      traits: ["Conditional", "One-time"],
      gate: "Only while the campaign is still waiting on the provider's photo update",
    },
    {
      key: "photos_ready",
      phase: "Prepare",
      title: "Updated photos approved",
      timing: "When concierge clears the photo gate",
      description:
        "After the provider saves a new gallery, the concierge re-reviews it. Approval closes the loop by confirming that setup is continuing without another Ad Boost request.",
      emailType: "ad_boost_photos_ready",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_photos_ready",
      traits: ["Conditional", "One-time"],
      gate: "Only sends when a campaign that received the photo-update request is later approved",
    },
    {
      key: "concierge_setup",
      phase: "Prepare",
      title: "Concierge setup and scheduling",
      timing: "Requested → scheduled",
      description:
        "After the profile, verification, and photo gates are clear, the team prepares the campaign, confirms the channel and budget, and chooses the flight and launch-email timing. This is an operational state, not a provider message.",
      ownerNote: "Managed in the Ad Boost concierge queue",
      traits: ["Silent step"],
      gate: "Requires photo readiness; no email is sent merely because the internal status becomes scheduled",
    },
    {
      key: "campaign_launched",
      phase: "Run",
      title: "Campaign launched",
      timing: "When the campaign goes live",
      description:
        "The provider learns that Find Families is live and where new inquiries will arrive. It sends immediately or at the chosen US Eastern hour through one deduplicated path.",
      emailType: "ad_boost_campaign_launched",
      ownedBy: "ad-boost-launch-scheduler",
      emailSampleId: "ad_boost_campaign_launched",
      traits: ["One-time"],
      gate: "Missing email, unsubscribe, or suppression blocks the send; transport failures retry when scheduled",
    },
    {
      key: "traction",
      phase: "Run",
      title: "Early traction update",
      timing: "First meaningful live metrics",
      description:
        "Once real spend or clicks are recorded, the provider gets a concrete progress note with campaign activity before the starter promotion closes.",
      emailType: "ad_boost_traction",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_traction",
      traits: ["Conditional", "One-time"],
      gate: "Requires a live campaign and non-zero spend or clicks",
    },
    {
      key: "lead_delivered",
      phase: "Prove value",
      title: "A new family is delivered",
      timing: "For every attributed inquiry",
      description:
        "At the moment a managed-campaign inquiry arrives, the provider receives one campaign-specific lead email with a direct path to the family.",
      emailType: "ad_boost_lead_delivered",
      ownedBy: "ad-boost-emails",
      emailSampleId: "ad_boost_lead_delivered",
      traits: ["Repeats per lead"],
      gate: "Deduplicated by connection; only inquiries carrying the campaign's managed attribution qualify",
    },
    {
      key: "lead_outcome",
      phase: "Prove value",
      title: "Lead outcome check",
      timing: "~7d, then ~21d if unresolved",
      description:
        "A one-tap check asks whether the family became a client, is still talking, or did not work out. Answers update the living campaign receipt.",
      emailType: "ad_boost_lead_outcome_check",
      ownedBy: "ad-boost-profile-reminders",
      emailSampleId: "ad_boost_lead_outcome_check",
      traits: ["Repeats per lead", "Up to twice"],
      gate: "At most one outcome email per provider per daily run; the second check stops after a final outcome",
    },
    {
      key: "promo_complete",
      phase: "Prove value",
      title: "Starter campaign complete",
      timing: "After the flight ends · next 10:15 AM ET business morning",
      description:
        "The flight ends automatically after its final serving day, or when the concierge closes it. The wrap-up then brings spend, clicks, engagement, inquiries, and known outcomes into one receipt. If Olera recorded no inquiry, the provider gets a version that asks whether anyone contacted them another way.",
      emailType: "ad_boost_promo_complete",
      ownedBy: "ad-boost-end-scheduler",
      emailSampleId: "ad_boost_promo_complete",
      traits: ["One-time", "Two result variants"],
      gate: "Requires an ended campaign and a due wrap-up schedule; outcome checks may continue for unresolved leads",
    },
    {
      key: "plan_decision",
      phase: "Continue",
      title: "Continue or pause with proof in hand",
      timing: "After the 3rd lead or campaign wrap-up",
      description:
        "The provider's living results page opens the paid-plan decision after demonstrated value. Stripe owns the subscription state; this step does not add another email.",
      ownerNote: "Provider results page + Stripe",
      traits: ["Value-gated", "Silent step"],
    },
  ],
};

/**
 * Provider outreach journey — the claim funnel from enrollment through
 * follow-up channels to re-engagement cycles.
 *
 * DRIFT GUARD: mirrors the provider-outreach-send 4-email cadence (Day 0/3/7/14),
 * the provider-outreach-sequence-check stage transitions, and the follow-up channel
 * queue in /admin/provider-outreach. Channel progression and Cycle 2 are manual.
 */
export const PROVIDER_OUTREACH_JOURNEY: CommsJourney = {
  key: "provider_outreach_journey",
  title: "Provider outreach — the claim journey",
  ordering: "time",
  audienceLabel: "Provider journey",
  description:
    "One outreach journey from enrollment to claim: provider-outreach-send fires the 4-email " +
    "sequence (Day 0/3/7/14), the sequence check moves non-claimers to Follow Up, and manual " +
    "channels (fax, direct mail) offer alternative touchpoints. LinkedIn discovery helps admins " +
    "find contact info. Admins can fix emails inline and send claim links at any stage.",
  steps: [
    // ── Email Sequence ──────────────────────────────────────────────────
    {
      key: "intro_email",
      phase: "Email Sequence",
      title: "Introduction email sent",
      timing: "Day 0 · Provider enrolled",
      description:
        "Provider is added to outreach sequence. First email explains Olera, " +
        "shows their free profile exists, and invites them to claim it.",
      emailType: "provider_outreach_sequence",
      emailSampleId: "provider_outreach_intro",
      ownedBy: "provider-outreach-send",
    },
    {
      key: "followup_email",
      phase: "Email Sequence",
      title: "Family Confidence email",
      timing: "Day 3",
      description:
        "Follow-up emphasizing how a complete profile helps families feel " +
        "confident choosing this provider.",
      emailType: "provider_outreach_sequence",
      emailSampleId: "provider_outreach_followup",
      ownedBy: "provider-outreach-send",
    },
    {
      key: "demand_loss_email",
      phase: "Email Sequence",
      title: "Why It's Free email",
      timing: "Day 7",
      description:
        "Explains the free model — no referral fees, no pay-per-lead, " +
        "direct family connections.",
      emailType: "provider_outreach_sequence",
      emailSampleId: "provider_outreach_demand_loss",
      ownedBy: "provider-outreach-send",
    },
    {
      key: "final_email",
      phase: "Email Sequence",
      title: "Get Verified email",
      timing: "Day 14",
      description:
        "Final push focusing on the verified badge as a trust signal for families.",
      emailType: "provider_outreach_sequence",
      emailSampleId: "provider_outreach_final",
      ownedBy: "provider-outreach-send",
    },
    // ── Follow Up ───────────────────────────────────────────────────────
    {
      key: "sequence_exhausted",
      phase: "Follow Up",
      title: "Provider enters Follow Up queue",
      timing: "Day 14+ · No claim",
      description:
        "Sequence complete without a claim. Provider moves to needs_call stage " +
        "with reason: clicked_not_claimed (engaged) or sequence_exhausted (no engagement).",
      ownedBy: "provider-outreach-sequence-check",
      gate: "Only if provider hasn't claimed by end of sequence",
    },
    {
      key: "fax_attempt",
      phase: "Follow Up",
      title: "Fax sent",
      timing: "Manual · When fax number available",
      description:
        "Admin sends fax via ClickSend. Useful when emails aren't reaching " +
        "the decision maker.",
      ownerNote: "Triggered from Follow Up tab",
      traits: ["Manual", "Conditional"],
      gate: "Requires valid fax number (auto-discovered or manually added)",
    },
    {
      key: "fix_email",
      phase: "Follow Up",
      title: "Email fixed inline",
      timing: "Manual · Fix Email button",
      description:
        "Admin clicks 'Fix Email' to update a bounced or incorrect email address inline. " +
        "Provider stays in Follow Up (not moved to Needs Email), and admin can immediately send a claim link.",
      ownerNote: "Inline editing in Follow Up tab",
      traits: ["Manual"],
      gate: "Used when email bounced or contact info was wrong",
    },
    {
      key: "linkedin_discovery",
      phase: "Follow Up",
      title: "LinkedIn discovered",
      timing: "Manual · Find LinkedIn button",
      description:
        "Admin clicks 'Find LinkedIn' to discover provider's LinkedIn page from their website. " +
        "LinkedIn is a discovery tool for manual outreach, not a channel providers are moved to.",
      ownerNote: "Discovery tool in Follow Up tab",
      traits: ["Manual", "Discovery"],
      gate: "Requires provider website; admins manually reach out via LinkedIn",
    },
    {
      key: "fax_discovery",
      phase: "Follow Up",
      title: "Fax number discovered",
      timing: "Manual · Find Fax button",
      description:
        "Admin clicks 'Find Fax' to discover provider's fax number from their website. " +
        "Once found, the fax channel becomes available for that provider.",
      ownerNote: "Discovery tool in Follow Up tab",
      traits: ["Manual", "Discovery"],
      gate: "Requires provider website; found fax is saved to provider record",
    },
    {
      key: "directmail_attempt",
      phase: "Follow Up",
      title: "Direct mail sent",
      timing: "Manual · When address available",
      description:
        "Physical letter sent to provider. Last resort when digital " +
        "channels aren't working.",
      ownerNote: "Triggered from Follow Up tab",
      traits: ["Manual", "Has cost"],
      gate: "Requires valid mailing address",
    },
    // ── Re-engagement ───────────────────────────────────────────────────
    {
      key: "re_engage_wait",
      phase: "Re-engagement",
      title: "Provider in Alternative Channels",
      timing: "After Follow Up attempts",
      description:
        "Provider moved to re_engage stage with a selected channel (fax or direct mail). " +
        "Admins can send claim links or manually restart the sequence when ready.",
      ownerNote: "Manual admin decision from Follow Up tab",
      traits: ["Manual"],
    },
    {
      key: "cycle_2",
      phase: "Re-engagement",
      title: "Cycle 2 (manual)",
      timing: "Admin decision",
      description:
        "Admin clicks 'Re-engage now' to restart the email sequence for Cycle 1 providers. " +
        "Cycle 2 providers can be moved to not_interested or have claim links sent manually.",
      ownerNote: "Triggered via 'Re-engage now' button in Alternative Channels tab",
      traits: ["Manual"],
      gate: "Admin decides when to restart; no automatic progression",
    },
  ],
};

const COMMS_JOURNEYS: Record<string, CommsJourney> = {
  [BENEFITS_CASCADE.key]: BENEFITS_CASCADE,
  [HELP_CASCADE_LADDER.key]: HELP_CASCADE_LADDER,
  [AD_BOOST_PROVIDER_JOURNEY.key]: AD_BOOST_PROVIDER_JOURNEY,
  [PROVIDER_OUTREACH_JOURNEY.key]: PROVIDER_OUTREACH_JOURNEY,
};

/** Which journeys each automation page shows, in display order. */
const JOURNEYS_BY_CRON: Record<string, string[]> = {
  "family-comms-coordinator": [HELP_CASCADE_LADDER.key, BENEFITS_CASCADE.key],
  "benefits-navigator-scheduler": [BENEFITS_CASCADE.key],
  "benefits-results-texts": [BENEFITS_CASCADE.key],
  "ad-boost-profile-reminders": [AD_BOOST_PROVIDER_JOURNEY.key],
  "ad-boost-launch-scheduler": [AD_BOOST_PROVIDER_JOURNEY.key],
  "ad-boost-emails": [AD_BOOST_PROVIDER_JOURNEY.key],
  "provider-outreach-send": [PROVIDER_OUTREACH_JOURNEY.key],
  "provider-outreach-sequence-check": [PROVIDER_OUTREACH_JOURNEY.key],
  "provider-outreach-channel-lifecycle": [PROVIDER_OUTREACH_JOURNEY.key],
  "provider-outreach-auto-re-engage": [PROVIDER_OUTREACH_JOURNEY.key],
};

export function journeysForCron(cronId: string): CommsJourney[] {
  return (JOURNEYS_BY_CRON[cronId] ?? []).map((k) => COMMS_JOURNEYS[k]).filter(Boolean);
}
