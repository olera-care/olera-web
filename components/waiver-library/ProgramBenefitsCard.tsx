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
 * Value-first display:
 *   - savingsRange present (~26% of programs) → lead with "Up to $X/mo"
 *   - empty (~74%)                            → eligibility-first "Could you qualify?"
 *
 * The care need is pre-derived from the program the user is reading (see
 * deriveProgramCareNeed in ProgramPageV3), so there's no care-need step —
 * landing on this program IS the care signal. One field, one tap.
 */

import { useState, useCallback } from "react";
import { ArrowRight, CheckCircle, ShieldCheck, Spinner } from "@phosphor-icons/react";
import { trackBenefitsEvent } from "@/lib/analytics/track-step";
import { isPreviewMode } from "@/lib/analytics/preview-mode";
import { matchesCareNeed, type CareNeed } from "@/lib/benefits/match-care-need";
import { useAuth } from "@/components/auth/AuthProvider";

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

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [resultToken, setResultToken] = useState<string | null>(null);

  const entrySource = `/benefits/${stateId}/${programId}`;
  const shortLabel = programShortName || programName;
  const savings = topSavingsLabel(savingsRange);

  const submittableEmail = (authedEmail ?? email).trim();
  const emailValid = EMAIL_RE.test(submittableEmail);

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
      setSaving(false);
      setSubmitted(true);
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

  // ─── Success state ─────────────────────────────────────────────────────
  if (submitted) {
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
        onClick={handleSubmit}
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
