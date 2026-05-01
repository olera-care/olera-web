"use client";

/**
 * BenefitsDiscoveryModule (V3 — 2-step embedded SBF on provider pages).
 *
 * Replaces the V2 5-step intake. Two steps only: care need → contact
 * (email or SMS). On submit, the API silently creates the family profile
 * (auth.users + accounts + business_profiles type='family' + token), then
 * the ResultsSheet overlay opens in place — no redirect.
 *
 * Why this exists: V2 was at 8.2% completion / 39% step-1 pickup. The
 * structural friction (visible 5-step form on a provider page) was the
 * killer. V3 removes everything between the first care-need pick and the
 * email field. Targets: 55%+ step-1 pickup, 15%+ contact completion.
 *
 * 3-arm A/B on entry-point copy (lib/analytics/variant.ts):
 *   - availability — "There's help paying for care in {state}." (positive)
 *   - loss         — "Most {state} families miss out…" + dollar floor (loss)
 *   - empathic     — "Care is expensive." (shared truth)
 *
 * Per-card pickup tracking added: benefits_step_completed for step
 * "care-need" carries `care_need_selected` so we can see which card pulls.
 *
 * Standalone /benefits/finder is intentionally untouched — different
 * surface, different intent. Don't copy V3's structural bet there.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  House,
  Coin,
  Brain,
  HandHeart,
  Spinner,
} from "@phosphor-icons/react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { trackBenefitsEvent, type BenefitsStepEvent } from "@/lib/analytics/track-step";
import { assignBenefitsVariant, type BenefitsVariant } from "@/lib/analytics/variant";
import { matchesCareNeed, type CareNeed } from "@/lib/benefits/match-care-need";
import type { MatchableProvider } from "@/lib/benefits/provider-tie-in";
import type { WaiverProgram } from "@/data/waiver-library";
import ResultsSheet from "@/components/benefits/ResultsSheet";

/** Minimal program shape passed from the provider page server component. */
export interface BenefitsProgram {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  savingsRange?: string;
  programType?: string;
  structuredEligibility?: {
    ageRequirement?: string;
    incomeTable?: Array<{ householdSize: number; monthlyLimit: number }>;
  };
}

interface BenefitsDiscoveryModuleProps {
  providerState: string; // 2-letter abbreviation (e.g., "TX")
  stateId: string;       // slug (e.g., "texas")
  stateName: string;
  topPrograms: BenefitsProgram[];   // retained for back-compat; unused in V3 layout
  allPrograms: BenefitsProgram[];
  providerName?: string;
  providerSlug?: string;
  /** care_types array for the provider tie-in helper. */
  providerCareTypes?: string[] | null;
  /** category string for the provider tie-in helper. */
  providerCategory?: string | null;
}

// ─── Care need cards — order matters. "Paying for care" first because it's
//     the most-universal pain across senior-care provider visitors and creates
//     instant fluency with all 3 H2 arms (each mentions "paying for care").
const CARE_NEED_OPTIONS: Array<{
  value: CareNeed;
  label: string;
  description: string;
  icon: typeof House;
}> = [
  { value: "payingForCare", label: "Paying for care", description: "Medicare savings, cash benefits, food help", icon: Coin },
  { value: "stayingAtHome", label: "In-home care", description: "Personal care, daily tasks, mobility", icon: House },
  { value: "memoryHealth", label: "Memory & medical care", description: "Dementia care, doctor visits, prescriptions", icon: Brain },
  { value: "companionship", label: "Caregiver & social support", description: "Respite breaks, social programs", icon: HandHeart },
];

// ─── 3-arm copy: H2 + sub for step 1.
//     Strings live here AND in the SBF Copy Variants Notion DB. When you
//     change copy, update both — the Notion DB is the durable record of
//     what each arm earned.
const VARIANT_COPY: Record<BenefitsVariant, { h2: (state: string) => string; sub: (state: string) => string }> = {
  availability: {
    h2: (state) => `There's help paying for care in ${state}.`,
    sub: () => "Tell us what's needed — we'll show what fits.",
  },
  loss: {
    h2: (state) => `Most ${state} families miss out on help paying for care.`,
    sub: () => "$400–$900/month often goes unclaimed. Tell us what's needed.",
  },
  empathic: {
    h2: () => "Care is expensive.",
    sub: (state) => `Tell us what's needed and we'll show ${state} programs that fit.`,
  },
};

type Step = "care-need" | "contact";
const STEP_NUMBERS: Record<Step, number> = {
  "care-need": 1,
  contact: 2,
};

// Phone normalization helper — UI-side only. Server re-validates with normalizeUSPhone.
function isPlausiblePhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

export default function BenefitsDiscoveryModule({
  providerState,
  stateId,
  stateName,
  topPrograms,
  allPrograms,
  providerName,
  providerSlug,
  providerCareTypes,
  providerCategory,
}: BenefitsDiscoveryModuleProps) {
  // ─── Step + form state ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>("care-need");
  const [careNeed, setCareNeed] = useState<CareNeed | null>(null);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Tracking refs ───────────────────────────────────────────────────
  const startTrackedRef = useRef(false);
  const entryTrackedRef = useRef(false);
  const viewedStepsRef = useRef<Set<Step>>(new Set());
  const stepEnterTimeRef = useRef<number>(Date.now());

  // ─── Spotlight echo from Q&A section (preserved from V2) ──────────────
  const [quotedQuestion, setQuotedQuestion] = useState<string | null>(null);
  const [echoVisible, setEchoVisible] = useState(false);

  // ─── Session + variant — deferred to useEffect to avoid SSR hydration ──
  // mismatch. Default to "availability" so the SSR HTML matches client's
  // first render; useEffect computes the real variant after mount.
  const [sessionId, setSessionId] = useState<string>("");
  const [variant, setVariant] = useState<BenefitsVariant>("availability");
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    setVariant(assignBenefitsVariant(sid));
  }, []);

  function fireFunnelEvent(
    event: BenefitsStepEvent,
    extras?: { stepNumber?: number; stepName?: string; timeOnStepMs?: number; careNeedSelected?: CareNeed | null },
  ) {
    trackBenefitsEvent({
      event,
      sessionId,
      stateCode: providerState,
      stateName,
      providerName: providerName || null,
      providerSlug: providerSlug || null,
      variant,
      ...extras,
    });
  }

  function trackStepCompleted(stepKey: Step, careNeedSelected?: CareNeed | null) {
    fireFunnelEvent("benefits_step_completed", {
      stepNumber: STEP_NUMBERS[stepKey],
      stepName: stepKey,
      timeOnStepMs: Date.now() - stepEnterTimeRef.current,
      careNeedSelected,
    });
  }

  // ─── Spotlight handoff from Q&A section ───────────────────────────────
  // When a caregiver submits a question, the room quiets around us. Move
  // preserved verbatim from V2 — Perena/Wispr Flow vibe.
  useEffect(() => {
    let pendingTimeouts: number[] = [];
    function clearPending() {
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
      pendingTimeouts = [];
    }
    function handleQuestionSubmitted(e: Event) {
      const detail = (e as CustomEvent<{ question: string }>).detail;
      if (!detail?.question) return;
      clearPending();
      setEchoVisible(false);
      setQuotedQuestion(detail.question);
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === "function") active.blur();
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        const el = document.getElementById("benefits");
        if (el) el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        document.body.classList.add("benefits-spotlight-active");
      });
      pendingTimeouts.push(window.setTimeout(() => setEchoVisible(true), 450));
      pendingTimeouts.push(
        window.setTimeout(() => document.body.classList.remove("benefits-spotlight-active"), 2700),
      );
    }
    window.addEventListener("olera:question-submitted", handleQuestionSubmitted);
    return () => {
      window.removeEventListener("olera:question-submitted", handleQuestionSubmitted);
      clearPending();
      document.body.classList.remove("benefits-spotlight-active");
    };
  }, []);

  // ─── Funnel: entry_viewed (mount, gated on sessionId) ─────────────────
  useEffect(() => {
    if (!sessionId || entryTrackedRef.current) return;
    entryTrackedRef.current = true;
    fireFunnelEvent("benefits_entry_viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ─── Funnel: step_viewed + entry-time reset ────────────────────────────
  useEffect(() => {
    stepEnterTimeRef.current = Date.now();
    if (!sessionId) return;
    if (viewedStepsRef.current.has(step)) return;
    viewedStepsRef.current.add(step);
    fireFunnelEvent("benefits_step_viewed", {
      stepNumber: STEP_NUMBERS[step],
      stepName: step,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId]);

  // Fire-and-forget: notify Slack + log that a user started the intake.
  function trackStart(selectedCareNeed: CareNeed) {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;
    const label = CARE_NEED_OPTIONS.find((o) => o.value === selectedCareNeed)?.label || selectedCareNeed;
    try {
      fetch("/api/benefits/track-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careNeedLabel: label,
          stateCode: providerState,
          stateName,
          providerName: providerName || null,
          providerSlug: providerSlug || null,
          sessionId,
          variant,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // swallow — tracking must never block the UX
    }
  }

  // ─── Match list — recomputed when careNeed changes. Used both for the
  //     "matchedPrograms" payload sent to the server AND for the post-submit
  //     overlay (passed via overlayMatches state below).
  const matchingPrograms = useMemo(() => {
    if (!careNeed) return [];
    return allPrograms.filter((p) => matchesCareNeed(p, careNeed));
  }, [allPrograms, careNeed]);

  // ─── Post-submit overlay state ────────────────────────────────────────
  // Set on successful submit, opens the ResultsSheet. Snapshotted because
  // the matchingPrograms upstream could change if the user later flips
  // careNeed (they shouldn't be able to in V3, but defensive).
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMatches, setOverlayMatches] = useState<WaiverProgram[]>([]);
  const [overlayMatchCount, setOverlayMatchCount] = useState(0);
  const [overlayContactDest, setOverlayContactDest] = useState<string | null>(null);
  const [overlayContactChannel, setOverlayContactChannel] = useState<"email" | "sms">("email");

  if (topPrograms.length === 0) return null;

  // ─── Handle submit ────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);

    // Client-side validation gate — server re-validates strictly.
    if (channel === "email") {
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email.");
        return;
      }
    } else {
      if (!isPlausiblePhone(phone)) {
        setError("Please enter a valid US phone number.");
        return;
      }
    }

    trackStepCompleted("contact");
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
          stateCode: providerState,
          contactChannel: channel,
          email: channel === "email" ? email.trim().toLowerCase() : undefined,
          phone: channel === "sms" ? phone : undefined,
          providerSlug: providerSlug || undefined,
          matchedPrograms: matchingPrograms.map((p) => ({
            programId: p.id,
            stateId,
            name: p.name,
            shortName: p.shortName,
            programType: p.programType,
            savingsRange: p.savingsRange,
          })),
          matchCount: matchingPrograms.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The server returns { error, suggestion?, suggestedEmail?, code? }
        const msg = data?.suggestion || data?.error || "Something went wrong. Please try again.";
        setError(msg);
        setSaving(false);
        return;
      }

      // Success — open the ResultsSheet overlay in place.
      setOverlayMatches(matchingPrograms as unknown as WaiverProgram[]);
      setOverlayMatchCount(typeof data.matchCount === "number" ? data.matchCount : matchingPrograms.length);
      setOverlayContactDest(channel === "email" ? email.trim().toLowerCase() : phone);
      setOverlayContactChannel(channel);
      setSaving(false);
      setOverlayOpen(true);
    } catch (err) {
      console.error("[BenefitsDiscoveryModule] Submit failed:", err);
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  const v = VARIANT_COPY[variant];
  const allProgramsCount = allPrograms.length;

  // Progress dots — 2 segments. First fills on care-need pick, second
  // pulses when waiting on contact, fills on success.
  const ProgressDots = () => (
    <div className="flex items-center gap-1.5 mb-6">
      {[0, 1].map((i) => {
        const filled = i === 0 ? !!careNeed : false; // step 2 fill happens via overlay open
        const pulse = i === 1 && step === "contact";
        return (
          <div key={i} className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden relative">
            <div
              className={`h-full bg-gray-900 rounded-full transition-all duration-300 ${pulse ? "animate-pulse opacity-60" : ""}`}
              style={{ width: filled ? "100%" : pulse ? "12%" : "0%" }}
            />
          </div>
        );
      })}
    </div>
  );

  const provider: MatchableProvider | null = providerName
    ? {
        display_name: providerName,
        care_types: providerCareTypes,
        category: providerCategory,
      }
    : null;

  return (
    <section
      id="benefits"
      className="benefits-discovery-module rounded-3xl border border-gray-100 bg-white px-5 py-6 sm:px-7 sm:py-8 shadow-sm"
    >
      {/* Quoted-question echo from Q&A section (preserved) */}
      {quotedQuestion && (
        <p
          className={`benefits-echo-line ${echoVisible ? "is-visible" : ""} font-display italic text-[15px] text-gray-500 mb-3 leading-relaxed`}
        >
          You just asked: <span className="text-gray-700">&ldquo;{quotedQuestion}&rdquo;</span>
        </p>
      )}

      {/* Back button (only on step 2) */}
      {step === "contact" && (
        <button
          onClick={() => {
            setStep("care-need");
            setError(null);
          }}
          aria-label="Go back"
          className="mb-3 -ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <ProgressDots />

      {step === "care-need" && (
        <>
          <h2 className="font-display text-2xl font-bold text-gray-900 leading-tight">{v.h2(stateName)}</h2>
          <p className="mt-1 mb-3 text-sm text-gray-500">{v.sub(stateName)}</p>

          <p className="mb-6 text-xs leading-relaxed text-gray-400">
            <span>Free</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>Under a minute</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>Never sold to insurers</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>{allProgramsCount} {stateName} programs</span>
          </p>

          <div className="space-y-2 mb-2">
            {CARE_NEED_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = careNeed === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCareNeed(opt.value);
                    trackStart(opt.value);
                    trackStepCompleted("care-need", opt.value);
                    setTimeout(() => setStep("contact"), 180);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" weight="regular" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[15px] font-semibold leading-tight ${isSelected ? "text-white" : "text-gray-900"}`}>
                      {opt.label}
                    </div>
                    <div className={`mt-0.5 text-[13px] leading-snug ${isSelected ? "text-white/70" : "text-gray-500"}`}>
                      {opt.description}
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-white/60" : "text-gray-300"}`} weight="bold" />
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === "contact" && (
        <>
          <h2 className="font-display text-2xl font-bold text-gray-900 leading-tight">
            {careNeed && `Where should we send your ${matchingPrograms.length} ${matchingPrograms.length === 1 ? "match" : "matches"}?`}
          </h2>
          <p className="mt-1 mb-5 text-sm text-gray-500">
            Real {stateName} programs you may qualify for. Takes a moment to look up your contact info.
          </p>

          {/* Channel toggle */}
          <div className="mb-3 flex items-center justify-end text-[13px]">
            <button
              type="button"
              onClick={() => {
                setChannel(channel === "email" ? "sms" : "email");
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700 transition underline-offset-2 hover:underline"
            >
              {channel === "email" ? "Or text me instead →" : "Or use email →"}
            </button>
          </div>

          {/* Input */}
          <label className="block">
            <span className="sr-only">{channel === "email" ? "Email address" : "Phone number"}</span>
            {channel === "email" ? (
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                disabled={saving}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[16px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition disabled:opacity-50"
              />
            ) : (
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="(555) 123-4567"
                autoComplete="tel-national"
                inputMode="tel"
                disabled={saving}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[16px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-0 transition disabled:opacity-50"
              />
            )}
          </label>

          {/* Channel-specific consent text */}
          <p className="mt-2.5 text-[12px] leading-relaxed text-gray-400">
            {channel === "email"
              ? "We'll send your matches and a magic link to come back. We never sell your info."
              : "By tapping See my matches, you agree to receive a one-time text from Olera at this number. Reply STOP to opt out. Msg & data rates may apply."}
          </p>

          {error && (
            <p className="mt-2 text-[13px] text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" weight="bold" />
                Saving…
              </>
            ) : (
              <>
                See my matches
                <ArrowRight className="h-4 w-4" weight="bold" />
              </>
            )}
          </button>
        </>
      )}

      {/* Post-submit overlay — same component as /m/{token}, mode="overlay" */}
      {careNeed && (
        <ResultsSheet
          mode="overlay"
          isOpen={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          matches={overlayMatches}
          matchCount={overlayMatchCount}
          careNeed={careNeed}
          state={{ name: stateName, slug: stateId }}
          provider={provider}
          providerSlug={providerSlug || null}
          contactChannel={overlayContactChannel}
          contactDestination={overlayContactDest}
        />
      )}
    </section>
  );
}
