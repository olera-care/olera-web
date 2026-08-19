"use client";

/**
 * ProgramBenefitsCard — the "soft lane" conversion card for benefit program
 * pages (the /benefits/[state]/[program] V3 surface).
 *
 * Mirrors the *mechanic* of the provider-page Connection Card (Door A):
 * value first → one email field → one button → trust line. But it's a
 * distinct, self-contained component, NOT the BenefitsDiscoveryModule. The
 * discovery module is question-driven (it infers care need from a Q&A that
 * program pages don't have) and is under active A/B on provider pages — we
 * deliberately don't touch it. Here we reuse only the load-bearing backend:
 *   - /api/benefits/save-results  (family-profile creation + welcome email
 *     that already ships the matched-program breakdown + a /m/{token} link)
 *   - matchesCareNeed             (filter the state's programs for the email)
 *   - trackBenefitsEvent          (funnel analytics, tagged variant="program_card")
 *
 * Post-email enrichment (7 steps):
 *   - After email submission, we show optional enrichment steps to
 *     improve profile completeness from ~21% to ~55%:
 *     1. Who needs care? (Self, Parent, Spouse, Other)
 *     2. How soon? (ASAP, Within a month, In a few months, Just researching)
 *     3. How will you pay? (Medicare, Medicaid, Private insurance, etc.)
 *     4. Want this by text? (phone capture — the SMS-reachability funnel;
 *        DELIBERATELY at this depth: phone is the one ask the dialogue can't
 *        continue without, so the Phase 3 facts go AFTER it, never before.
 *        Server texts the results link immediately so the promise is kept in
 *        seconds, and stores the consent stamp the SMS rungs gate on.)
 *     5-7. Age band / Medicaid / income band (Phase 3 real-situation facts —
 *        the bonus round riding the just-texted-you reciprocity. Each tap
 *        PATCHes immediately so a mid-round abandon loses nothing; Medicaid
 *        is skipped when payment=medicaid, the facts reader already infers
 *        alreadyHas from payment_methods.)
 *   - User can answer any/all or skip to see the success card
 *
 * Value-first display:
 *   - savingsRange present (~26% of programs) → lead with "Up to $X/mo"
 *   - empty (~74%)                            → eligibility-first "Could you qualify?"
 *
 * The care need is pre-derived from the program the user is reading (see
 * deriveProgramCareNeed in ProgramPageV3), so there's no care-need step —
 * landing on this program IS the care signal. One field, one tap.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowRight, CheckCircle, ShieldCheck, Spinner } from "@phosphor-icons/react";
import { trackBenefitsEvent } from "@/lib/analytics/track-step";
import { isPreviewMode } from "@/lib/analytics/preview-mode";
import { matchesCareNeed, type CareNeed } from "@/lib/benefits/match-care-need";
import { useAuth } from "@/components/auth/AuthProvider";
import { getOrCreateVisitId } from "@/lib/analytics/session";
import { trackGrowthEvent } from "@/lib/analytics/growth-attribution";
import {
  trackBenefitsEnrichmentStarted,
  trackBenefitsEnrichmentStepCompleted,
  trackBenefitsEnrichmentStepSkipped,
  trackBenefitsEnrichmentCompleted,
  type BenefitsEnrichmentStep,
} from "@/lib/analytics/benefits-enrichment-tracking";

/** Lightweight program shape returned by /api/benefits/programs. */
export interface BenefitsProgram {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  savingsRange?: string;
  programType?: string;
}

export interface ProgramBenefitsCardProps {
  programId: string;
  programName: string;
  programShortName?: string;
  savingsRange?: string;
  programType?: string;
  /** 2-letter state code, e.g. "TX". */
  stateCode: string;
  /** Display state name, e.g. "Texas". */
  stateName: string;
  /** State slug, e.g. "texas". */
  stateId: string;
  /** Care need pre-derived from the program (the page IS the care signal). */
  careNeed: CareNeed;
  /** The state's full program list, fetched once by the parent page (so the
   *  rail and the mobile sheet share one fetch and one entry-view event
   *  instead of each firing their own — see ProgramPageV3). Used to build the
   *  matched set for the welcome email. May be empty before the fetch lands;
   *  submit falls back to [this program]. */
  programs?: BenefitsProgram[];
  /** Anonymous session id, owned by the parent page. */
  sessionId?: string;
  /** Visual context. "bare" drops the card chrome (used inside the mobile sheet,
   *  which provides its own surface). */
  variant?: "rail" | "bare";
}

/** Pull the upper-bound dollar figure from a savings range string and format
 *  it as "Up to $X/mo" (or /yr). Returns null when there's no dollar value —
 *  which is the ~74% case that triggers the eligibility-first headline. */
function topSavingsLabel(range?: string): string | null {
  if (!range) return null;
  const matches = range.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const top = matches[matches.length - 1];
  const period = /\bmo\b|month/i.test(range) ? "/mo" : "/yr";
  return `Up to ${top}${period}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CardState =
  | "capture"
  | "enrichment_1"
  | "enrichment_2"
  | "enrichment_3"
  | "enrichment_4"
  | "enrichment_5"
  | "enrichment_6"
  | "enrichment_7"
  | "success";

/** Loose US phone check for the enrichment step — 10 digits (optionally with
 *  a leading 1). The server does the real E.164 normalization. */
function phoneLooksValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

const RECIPIENT_OPTIONS: { label: string; value: string }[] = [
  { label: "Myself", value: "self" },
  { label: "My parent", value: "parent" },
  { label: "My spouse", value: "spouse" },
  { label: "Someone else", value: "other" },
];

const TIMELINE_OPTIONS: { label: string; value: string }[] = [
  { label: "As soon as possible", value: "asap" },
  { label: "Within a month", value: "within_month" },
  { label: "In a few months", value: "few_months" },
  { label: "Just researching", value: "researching" },
];

// Payment options reframed 2026-07-28: live data showed "Medicare" winning
// at ~41% — families answering "what coverage do I have," not "how will I
// pay" (Medicare doesn't pay for long-term care). Medicare and private
// insurance are dropped as noise-generators; "Not sure yet" is the honest
// top answer for this funnel and stores as its own signal
// (metadata.payment_unsure), never into payment_methods.
const PAYMENT_OPTIONS: { label: string; value: string }[] = [
  { label: "Not sure yet, I need to find out what helps", value: "not_sure" },
  { label: "Medicaid", value: "medicaid" },
  { label: "Savings or family will pay", value: "private_pay" },
  { label: "Veterans benefits", value: "veterans_benefits" },
  { label: "Long-term care insurance", value: "long_term_care_insurance" },
];

// Phase 3 facts (steps 5-7). Age bands store the same representative numbers
// as the email micro-quiz (family-quiz allowlist) so every facts reader sees
// one vocabulary.
const AGE_OPTIONS: { label: string; value: string }[] = [
  { label: "Under 65", value: "60" },
  { label: "65 to 74", value: "70" },
  { label: "75 to 84", value: "80" },
  { label: "85 or older", value: "87" },
];

const MEDICAID_OPTIONS: { label: string; value: string }[] = [
  { label: "Yes, they have it", value: "alreadyHas" },
  { label: "Applying or not sure", value: "notSure" },
  { label: "No", value: "doesNotHave" },
];

const INCOME_OPTIONS: { label: string; value: string }[] = [
  { label: "Under $1,500 a month", value: "under1500" },
  { label: "$1,500 to $2,500", value: "under2500" },
  { label: "$2,500 to $4,000", value: "under4000" },
  { label: "Over $4,000", value: "over4000" },
  { label: "Prefer not to say", value: "preferNotToSay" },
];

export default function ProgramBenefitsCard({
  programId,
  programName,
  programShortName,
  savingsRange,
  programType,
  stateCode,
  stateName,
  stateId,
  careNeed,
  programs,
  sessionId,
  variant = "rail",
}: ProgramBenefitsCardProps) {
  const { user } = useAuth();
  const authedEmail = user?.email ?? null;

  const [cardState, setCardState] = useState<CardState>("capture");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [resultToken, setResultToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Enrichment data
  const [recipient, setRecipient] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [medicaidChoice, setMedicaidChoice] = useState<string | null>(null);
  const [incomeBand, setIncomeBand] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<BenefitsEnrichmentStep[]>([]);

  // Track enrichment start only once
  const hasTrackedEnrichmentStart = useRef(false);
  const hasTrackedCtaEngagement = useRef(false);

  const entrySource = `/benefits/${stateId}/${programId}`;
  const ctaSurface = variant === "bare" ? "mobile" : "desktop";
  const shortLabel = programShortName || programName;
  const savings = topSavingsLabel(savingsRange);

  const submittableEmail = (authedEmail ?? email).trim();
  const emailValid = EMAIL_RE.test(submittableEmail);

  const trackCtaEngagement = useCallback(() => {
    if (hasTrackedCtaEngagement.current) return;
    hasTrackedCtaEngagement.current = true;
    trackGrowthEvent({
      eventType: "cta_engaged",
      pagePath: entrySource,
      ctaId: "benefits_intake",
      ctaSurface,
    });
  }, [ctaSurface, entrySource]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (isPreviewMode()) {
      setError("Preview mode — submission disabled.");
      return;
    }
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    // Build the matched-program set for the welcome email. Filter the state
    // list (provided by the parent page) to this care need; if that's empty
    // — list not loaded yet, or nothing matched — fall back to just the
    // program the user is reading so we always save & email at least one.
    const thisProgram: BenefitsProgram = {
      id: programId,
      name: programName,
      shortName: shortLabel,
      tagline: "",
      savingsRange,
      programType,
    };
    const filtered = (programs ?? []).filter((p) => matchesCareNeed(p, careNeed));
    const matched = filtered.length > 0 ? filtered : [thisProgram];

    if (sessionId) {
      trackBenefitsEvent({
        event: "benefits_step_completed",
        sessionId,
        stateCode,
        stateName,
        providerName: null,
        providerSlug: null,
        variant: "program_card",
        entrySource,
        stepNumber: 1,
        stepName: "contact",
        careNeedSelected: careNeed,
      });
    }

    setSaving(true);
    try {
      const res = await fetch("/api/benefits/save-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careNeed,
          age: null,
          medicaidStatus: null,
          incomeRange: null,
          stateCode,
          contactChannel: "email",
          email: submittableEmail.toLowerCase(),
          entrySource,
          sessionId: sessionId || undefined,
          visitId: getOrCreateVisitId(),
          matchedPrograms: matched.map((p) => ({
            programId: p.id,
            stateId,
            name: p.name,
            shortName: p.shortName,
            programType: p.programType,
            savingsRange: p.savingsRange,
          })),
          matchCount: matched.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.suggestion || data?.error || "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      setResultCount(typeof data.matchCount === "number" ? data.matchCount : matched.length);
      setResultToken(typeof data.token === "string" ? data.token : null);
      setProfileId(typeof data.profileId === "string" ? data.profileId : null);
      setSaving(false);
      // Transition to enrichment flow
      setCardState("enrichment_1");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }, [
    emailValid,
    submittableEmail,
    careNeed,
    programs,
    sessionId,
    stateCode,
    stateName,
    stateId,
    entrySource,
    programId,
    programName,
    shortLabel,
    savingsRange,
    programType,
  ]);

  const shell =
    variant === "bare"
      ? ""
      : "rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm shadow-gray-900/[0.03]";

  // Track enrichment started when entering enrichment flow
  useEffect(() => {
    if (cardState === "enrichment_1" && !hasTrackedEnrichmentStart.current && profileId) {
      hasTrackedEnrichmentStart.current = true;
      trackBenefitsEnrichmentStarted({
        programId,
        stateCode,
        profileId,
        ctaSurface,
      });
    }
  }, [cardState, profileId, programId, stateCode, ctaSurface]);

  // All update-enrichment PATCHes run through one chain: the route does a
  // read-merge-write on profile metadata, so two in-flight requests can
  // interleave (the later read landing before the earlier write commits) and
  // silently drop a fact. Serializing client-side closes the window.
  const patchChain = useRef<Promise<unknown>>(Promise.resolve());
  const enqueuePatch = useCallback((body: Record<string, unknown>) => {
    const run = () =>
      fetch("/api/benefits/update-enrichment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {
        // Silent fail — enrichment is best-effort
      });
    const p = patchChain.current.then(run, run);
    patchChain.current = p;
    return p;
  }, []);

  // The phone checkpoint: saves steps 1-3 (+phone when given) in one PATCH,
  // then advances into the facts round (5-7) instead of ending the flow.
  // ALWAYS advances — a missing profileId skips the save, never strands the
  // card on the phone step.
  // Note: finalPayment/finalPhone are passed directly to avoid stale closure
  // issues (React state updates are async, so the state values may not be
  // updated yet when called from selectPayment / submitPhone)
  const saveEnrichmentData = useCallback(async (
    finalCompletedSteps: BenefitsEnrichmentStep[],
    finalPayment?: string,
    finalPhone?: string
  ) => {
    const payment = finalPayment ?? paymentMethod;
    const phoneToSave = finalPhone?.trim() || undefined;

    // Only call API if we have data to save
    if (profileId && (recipient || timeline || payment || phoneToSave)) {
      await enqueuePatch({
        profileId,
        token: resultToken,
        recipient,
        timeline,
        paymentMethod: payment,
        phone: phoneToSave,
        sessionId,
        completedSteps: finalCompletedSteps,
      });
    }

    setCardState("enrichment_5");
  }, [profileId, resultToken, recipient, timeline, paymentMethod, sessionId, enqueuePatch]);

  // End of the flow (after step 7, answered or skipped). The completion
  // marker rides the serialized chain, so it lands AFTER every fact PATCH —
  // the server composes its Slack summary from the finished picture.
  const finishFlow = useCallback((finalCompletedSteps: BenefitsEnrichmentStep[]) => {
    if (profileId) {
      trackBenefitsEnrichmentCompleted(
        { programId, stateCode, profileId, ctaSurface },
        finalCompletedSteps
      );
      void enqueuePatch({
        profileId,
        token: resultToken,
        source: "benefits_enrichment",
        sessionId,
        enrichmentComplete: true,
        completedSteps: finalCompletedSteps,
      });
    }
    setCardState("success");
  }, [profileId, programId, stateCode, ctaSurface, enqueuePatch, resultToken, sessionId]);

  // Facts round (5-7): every tap PATCHes immediately (through the serialized
  // chain) — a mid-round abandon loses nothing, and the /m gap chips are the
  // backstop for what's skipped. Fire-and-forget; best-effort by design.
  const patchFact = useCallback((fact: { ageBand?: string; medicaidStatus?: string; incomeRange?: string }) => {
    if (!profileId) return;
    void enqueuePatch({
      profileId,
      token: resultToken,
      source: "benefits_enrichment",
      sessionId,
      ...fact,
    });
  }, [profileId, resultToken, sessionId, enqueuePatch]);

  // Medicaid step is redundant when they already told us they'll pay with
  // Medicaid (the facts reader infers alreadyHas from payment_methods).
  const medicaidRedundant = paymentMethod === "medicaid";

  // Step 1: Select recipient
  const selectRecipient = useCallback((val: string) => {
    setRecipient(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 1];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(1, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    setTimeout(() => setCardState("enrichment_2"), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface]);

  // Step 2: Select timeline
  const selectTimeline = useCallback((val: string) => {
    setTimeline(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 2];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(2, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    setTimeout(() => setCardState("enrichment_3"), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface]);

  // Step 3: Select payment method
  const selectPayment = useCallback((val: string) => {
    setPaymentMethod(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 3];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(3, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    setTimeout(() => setCardState("enrichment_4"), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface]);

  // Step 4: Phone (the only typed step — last so it can't dampen the one-tap
  // streak). Submitting texts the results link right away, server-side.
  // phoneSaving guards the awaited save (~2-4s with the SMS): without it a
  // slow-connection double-tap would PATCH twice and send two texts.
  const submitPhone = useCallback(() => {
    if (!phoneLooksValid(phone) || phoneSaving) return;
    setPhoneSaving(true);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 4];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(4, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    // Pass phone directly to avoid stale closure (state won't be updated yet)
    saveEnrichmentData(newCompleted, undefined, phone);
  }, [phone, phoneSaving, completedSteps, programId, stateCode, profileId, ctaSurface, saveEnrichmentData]);

  // Step 5: Age band
  const selectAge = useCallback((val: string) => {
    setAgeBand(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 5];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(5, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    patchFact({ ageBand: val });
    setTimeout(() => setCardState(medicaidRedundant ? "enrichment_7" : "enrichment_6"), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface, patchFact, medicaidRedundant]);

  // Step 6: Medicaid status
  const selectMedicaid = useCallback((val: string) => {
    setMedicaidChoice(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 6];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(6, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    patchFact({ medicaidStatus: val });
    setTimeout(() => setCardState("enrichment_7"), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface, patchFact]);

  // Step 7: Income band
  const selectIncome = useCallback((val: string) => {
    setIncomeBand(val);
    const newCompleted: BenefitsEnrichmentStep[] = [...completedSteps, 7];
    setCompletedSteps(newCompleted);
    trackBenefitsEnrichmentStepCompleted(7, { programId, stateCode, profileId: profileId || undefined, ctaSurface });
    patchFact({ incomeRange: val });
    setTimeout(() => finishFlow(newCompleted), 150);
  }, [completedSteps, programId, stateCode, profileId, ctaSurface, patchFact, finishFlow]);

  // Skip current step
  const handleSkip = useCallback(() => {
    const stepMap: Record<string, BenefitsEnrichmentStep> = {
      enrichment_1: 1,
      enrichment_2: 2,
      enrichment_3: 3,
      enrichment_4: 4,
      enrichment_5: 5,
      enrichment_6: 6,
      enrichment_7: 7,
    };
    const currentStep = stepMap[cardState];
    if (currentStep) {
      trackBenefitsEnrichmentStepSkipped(
        currentStep,
        { programId, stateCode, profileId: profileId || undefined, ctaSurface },
        completedSteps
      );
    }

    switch (cardState) {
      case "enrichment_1":
        setTimeout(() => setCardState("enrichment_2"), 150);
        break;
      case "enrichment_2":
        setTimeout(() => setCardState("enrichment_3"), 150);
        break;
      case "enrichment_3":
        setTimeout(() => setCardState("enrichment_4"), 150);
        break;
      case "enrichment_4":
        saveEnrichmentData(completedSteps);
        break;
      case "enrichment_5":
        setTimeout(() => setCardState(medicaidRedundant ? "enrichment_7" : "enrichment_6"), 150);
        break;
      case "enrichment_6":
        setTimeout(() => setCardState("enrichment_7"), 150);
        break;
      case "enrichment_7":
        finishFlow(completedSteps);
        break;
    }
  }, [cardState, completedSteps, programId, stateCode, profileId, ctaSurface, saveEnrichmentData, finishFlow, medicaidRedundant]);

  // Current step number for progress dots (1-7)
  const currentStepNumber =
    cardState === "enrichment_1" ? 1
    : cardState === "enrichment_2" ? 2
    : cardState === "enrichment_3" ? 3
    : cardState === "enrichment_4" ? 4
    : cardState === "enrichment_5" ? 5
    : cardState === "enrichment_6" ? 6
    : 7;

  // ─── Success state ─────────────────────────────────────────────────────
  if (cardState === "success") {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" weight="fill" />
          <p className="font-serif text-[19px] font-semibold leading-tight text-gray-900">
            Sent — check your inbox.
          </p>
        </div>
        <p className="text-[14px] leading-relaxed text-gray-600">
          {resultCount > 0 ? (
            <>
              We emailed{" "}
              <span className="font-medium text-gray-900">
                {resultCount} {stateName} {resultCount === 1 ? "program" : "programs"}
              </span>{" "}
              you may qualify for — with eligibility and how to apply for each.
              {completedSteps.includes(4) && <> Your results link is also on its way by text.</>}
              {(completedSteps.includes(5) || completedSteps.includes(6) || completedSteps.includes(7)) && (
                <> We sorted your matches around what you shared.</>
              )}
            </>
          ) : (
            <>We saved your search and emailed you the eligibility details for {shortLabel}.</>
          )}
        </p>
        {resultToken && (
          <a
            href={`/m/${resultToken}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary-600 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary-700"
          >
            See your matches
            <ArrowRight className="h-4 w-4" weight="bold" />
          </a>
        )}
      </div>
    );
  }

  // ─── Enrichment states ─────────────────────────────────────────────────
  if (cardState.startsWith("enrichment_")) {
    return (
      <div className={shell}>
        {/* Success banner */}
        <div className="mb-4 bg-emerald-50/70 rounded-xl px-4 py-3 border border-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                Sent to your inbox
              </p>
              <p className="text-[12px] text-gray-600 truncate">
                {resultCount} {stateName} {resultCount === 1 ? "program" : "programs"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress dots (step 6 drops out when payment=medicaid) */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {(medicaidRedundant ? [1, 2, 3, 4, 5, 7] : [1, 2, 3, 4, 5, 6, 7]).map((i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i <= currentStepNumber
                  ? "bg-gray-900 w-6 h-1.5"
                  : "bg-gray-200 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Who needs care? */}
        {cardState === "enrichment_1" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Who needs care?
            </h3>
            <div className="space-y-2 mb-4">
              {RECIPIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectRecipient(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    recipient === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 2: How soon? */}
        {cardState === "enrichment_2" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How soon do you need care?
            </h3>
            <div className="space-y-2 mb-4">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectTimeline(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    timeline === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 4: Want this by text? (phone capture — SMS reachability) */}
        {cardState === "enrichment_4" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
              Want this by text?
            </h3>
            {/* Set the same care-team identity, 48h promise, number continuity,
                and reply affordance that the Day-0 text carries. */}
            <p className="text-[13px] text-gray-500 mb-4">
              We&apos;ll text your plan now. Olera&apos;s care team will review what you shared and
              text one next step within 48 hours from this same number. You can reply anytime.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phoneLooksValid(phone)) {
                  e.preventDefault();
                  submitPhone();
                }
              }}
              placeholder="Your mobile number"
              autoComplete="tel"
              inputMode="tel"
              className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[16px] text-gray-900 placeholder:text-gray-400 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
            <button
              onClick={submitPhone}
              disabled={!phoneLooksValid(phone) || phoneSaving}
              className="mt-3 w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold text-center transition-all duration-150 bg-gray-900 text-white disabled:opacity-40 disabled:cursor-default active:scale-[0.98] disabled:active:scale-100"
            >
              {phoneSaving ? "Sending…" : "Text me my results"}
            </button>
            <p className="mt-2.5 text-[11px] leading-relaxed text-gray-400">
              By adding your number you agree to receive care-related texts from Olera.
              Reply STOP anytime.
            </p>
            <button
              onClick={handleSkip}
              className="w-full py-2 mt-1 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 5: Age band (facts round — checks eligibility, sharpens matches) */}
        {cardState === "enrichment_5" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
              How old is the person needing care?
            </h3>
            <p className="text-[13px] text-gray-500 mb-4">
              Three quick taps left. These check eligibility so your matches get more accurate.
            </p>
            <div className="space-y-2 mb-4">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectAge(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    ageBand === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 6: Medicaid status (skipped when payment=medicaid) */}
        {cardState === "enrichment_6" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
              Do they have Medicaid?
            </h3>
            <p className="text-[13px] text-gray-500 mb-4">
              Several programs need Medicaid first. Knowing this sorts your list.
            </p>
            <div className="space-y-2 mb-4">
              {MEDICAID_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectMedicaid(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    medicaidChoice === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 7: Income band (rough is fine; band floors drive exclusions) */}
        {cardState === "enrichment_7" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
              About how much is their monthly income?
            </h3>
            <p className="text-[13px] text-gray-500 mb-4">
              Most programs have income limits. A rough range is all we need.
            </p>
            <div className="space-y-2 mb-4">
              {INCOME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectIncome(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    incomeBand === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 3: How will you pay? */}
        {cardState === "enrichment_3" && (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How are you thinking of covering the cost?
            </h3>
            <div className="space-y-2 mb-4">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectPayment(opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[15px] font-medium text-center transition-all duration-150 border ${
                    paymentMethod === opt.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 font-normal bg-transparent border-none transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Capture state ─────────────────────────────────────────────────────
  return (
    <div className={shell}>
      {/* Value first — the free thing, before the ask. Savings number when we
          have it; eligibility framing when we don't. */}
      <p className="text-[13px] font-medium text-gray-500">
        {shortLabel} · {stateName}
      </p>
      {savings ? (
        <>
          <p className="mt-0.5 font-serif text-[28px] font-bold leading-none tracking-tight text-gray-900">
            {savings}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-gray-600">
            Estimated benefit — your amount depends on income &amp; household
          </p>
        </>
      ) : (
        <>
          <p className="mt-0.5 font-serif text-[26px] font-bold leading-tight tracking-tight text-gray-900">
            Could you qualify?
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-gray-600">
            Most families who are eligible never apply.
          </p>
        </>
      )}

      <div className="my-4 border-t border-gray-100" />

      <p className="mb-3 text-[15px] font-semibold text-gray-900">See if you qualify &amp; how to apply</p>

      {authedEmail ? (
        <p className="mb-3 text-[13px] text-gray-500">Signed in as {authedEmail}</p>
      ) : (
        <input
          type="email"
          value={email}
          onFocus={trackCtaEngagement}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !saving && emailValid) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Your email address"
          autoComplete="email"
          inputMode="email"
          disabled={saving}
          className={`block w-full rounded-xl border bg-white px-3.5 py-3 text-[16px] text-gray-900 placeholder:text-gray-400 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:opacity-50 ${
            error ? "border-red-300" : "border-gray-200"
          }`}
        />
      )}

      {error && (
        <p className="mt-2 text-[13px] text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        onClick={() => {
          trackCtaEngagement();
          void handleSubmit();
        }}
        disabled={saving}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-700 hover:shadow-md active:scale-[0.98] disabled:cursor-default disabled:opacity-70 disabled:active:scale-100"
      >
        {saving && <Spinner className="h-4 w-4 animate-spin" weight="bold" />}
        {saving ? "Checking…" : "Check my eligibility"}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-medium text-gray-600">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary-600" weight="fill" />
        Free. No spam.
      </p>
    </div>
  );
}
