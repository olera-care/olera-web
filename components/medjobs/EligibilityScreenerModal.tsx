"use client";

import { useState, useRef } from "react";
import type { DemandProfile } from "@/lib/medjobs/eligibility";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { createAuthClient } from "@/lib/supabase/auth-client";

/**
 * EligibilityScreenerModal — the provider eligibility screener.
 *
 * Authed provider: Q1 → Q2 → Q3 → writes eligibility → onComplete.
 *
 * Anonymous provider (no providerProfileId): Q1 → Q2 → Q3 → a "You're a fit!"
 * step that creates OR claims their agency + signs them in instantly (the
 * `claim-instant` no-code flow, the same mechanism /provider/onboarding uses),
 * then writes the captured eligibility — all in this one modal, no redirect.
 * This is what lets a cold-email visitor go anon → eligible without bouncing to
 * /welcome (no OAuth round-trip).
 */

type Step = "q1" | "q2" | "q3" | "loading" | "claim" | "provisioning";
type Shape = DemandProfile["demand_shape"];
type Prn = DemandProfile["prn_open"];
type Bucket = DemandProfile["coverage_buckets"][number];

const Q1: { value: Shape; label: string; reassure: string }[] = [
  { value: "regular", label: "Regular and recurring", reassure: "Great. A student can take your recurring shifts all term." },
  { value: "varies", label: "Varies week to week", reassure: "Good. You'll know each student's hours and use them when you need them." },
  { value: "unpredictable", label: "Unpredictable", reassure: "That's fine. Keep a student PRN and call them in only when a shift comes up." },
];
const Q2: { value: Prn; label: string; reassure: string }[] = [
  { value: "yes", label: "Yes", reassure: "Great. You call them in only when you have a shift." },
  { value: "maybe", label: "Maybe", reassure: "We'll show you both: regular and on-call students." },
  { value: "no", label: "Not now", reassure: "Got it. We'll focus on regular shifts." },
];
const Q3: { value: Bucket; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "evening", label: "Evenings" },
  { value: "overnight", label: "Overnights" },
  { value: "weekend", label: "Weekends" },
];

const btnPrimary =
  "mt-2 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40";
const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent";

const EMAIL_RE = /\S+@\S+\.\S+/;

export default function EligibilityScreenerModal({
  providerProfileId,
  onClose,
  onComplete,
}: {
  providerProfileId?: string;
  /** Accepted for caller compatibility; the screener body no longer uses them. */
  campusName?: string | null;
  orgName?: string | null;
  onClose: () => void;
  onComplete: () => void | Promise<void>;
}) {
  const { refreshAccountData } = useAuth();
  const [step, setStep] = useState<Step>("q1");
  const [shape, setShape] = useState<Shape | null>(null);
  const [prn, setPrn] = useState<Prn | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Anon "claim" step state.
  const [orgQuery, setOrgQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<SelectedOrg | null>(null);
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [email, setEmail] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const { results: cityResults } = useCitySearch(city);
  useClickOutside(cityRef, () => setCityOpen(false));

  const toggle = (v: Bucket) =>
    setBuckets((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const demandProfile = () => ({
    demand_shape: shape,
    prn_open: prn,
    coverage_buckets: buckets,
  });

  // Write eligibility for an already-authed provider whose account owns an org.
  const writeEligibility = async (profileId?: string) => {
    const res = await fetch("/api/medjobs/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, demand_profile: demandProfile() }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(b.error || "Could not save your answers");
    }
  };

  // Q3 → finish. Authed: write + done. Anon: go collect agency + sign in.
  const finish = async () => {
    if (!providerProfileId) {
      setError(null);
      setStep("claim");
      return;
    }
    setStep("loading");
    setError(null);
    try {
      await writeEligibility(providerProfileId);
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answers");
      setStep("q3");
    }
  };

  // Anon claim/create + instant sign-in + eligibility write.
  const conflict = !!selectedOrg && selectedOrg.claimState !== "unclaimed";
  const creating = !selectedOrg;
  const emailValid = EMAIL_RE.test(email);
  const canContinue =
    emailValid &&
    !conflict &&
    (creating ? !!(orgQuery.trim() && city.trim() && stateCode.trim()) : true);

  const handleClaim = async () => {
    if (!canContinue) return;
    setStep("provisioning");
    setError(null);
    const emailNorm = email.trim().toLowerCase();
    try {
      // Email must be free for a provider account (mirrors onboarding).
      const checkRes = await fetch("/api/auth/check-email-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm, intendedType: "organization" }),
      });
      const check = await checkRes.json();
      if (!check.available) {
        throw new Error(
          check.alreadyHasProfile
            ? "This email already has a provider account — please sign in instead."
            : `This email is linked to a ${check.existingType} account. Use a different email.`,
        );
      }

      // Instant create-new or claim-unclaimed (no code; server mints the session).
      const payload = creating
        ? {
            email: emailNorm,
            isNewOrg: true,
            orgName: orgQuery.trim(),
            city: city.trim(),
            state: stateCode.trim(),
          }
        : {
            email: emailNorm,
            providerId: selectedOrg!.providerId,
            providerName: selectedOrg!.name,
            providerSlug: selectedOrg!.slug,
            providerEmail: selectedOrg!.email,
            city: selectedOrg!.city || city.trim(),
            state: selectedOrg!.state || stateCode.trim(),
          };
      const res = await fetch("/api/provider/claim-instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not set up your account.");

      // Establish the session from the returned token (implicit-flow client),
      // then transfer it to the SSR client for cookie persistence.
      const authClient = createAuthClient();
      const { data: verifyData, error: verifyError } = await authClient.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: "magiclink",
      });
      if (verifyError || !verifyData?.session) {
        throw new Error("Could not sign you in. Please try again.");
      }
      await createClient().auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      });
      await refreshAccountData(verifyData.session.user.id);

      // Now authed + owns an org → write the captured eligibility.
      await writeEligibility(result.profileId);
      await onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep("claim");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 animate-screener-backdrop"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl animate-screener-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {step === "q1" && (
            <div className="space-y-4">
              {/* Intro folded into Q1 so a magic-link arrival lands straight on
                  the first question (no extra "Check eligibility →" click). */}
              <div>
                <h3 className="font-serif text-xl text-gray-900">Check your eligibility</h3>
                <p className="mt-1 text-sm text-gray-500">
                  A quick check, about a minute. No commitment.
                </p>
              </div>
              <QuestionFrame dots={1} title="How steady are your staffing needs?">
                {Q1.map((o) => (
                  <Opt key={o.value} sel={shape === o.value} onClick={() => setShape(o.value)} label={o.label} />
                ))}
                {shape && <Reassure text={Q1.find((o) => o.value === shape)!.reassure} />}
                <button type="button" disabled={!shape} onClick={() => setStep("q2")} className={btnPrimary}>
                  Next →
                </button>
              </QuestionFrame>
            </div>
          )}

          {step === "q2" && (
            <QuestionFrame dots={2} title="Open to PRN students you call in only when needed?">
              {Q2.map((o) => (
                <Opt key={o.value} sel={prn === o.value} onClick={() => setPrn(o.value)} label={o.label} />
              ))}
              {prn && <Reassure text={Q2.find((o) => o.value === prn)!.reassure} />}
              <button type="button" disabled={!prn} onClick={() => setStep("q3")} className={btnPrimary}>
                Next →
              </button>
            </QuestionFrame>
          )}

          {step === "q3" && (
            <QuestionFrame dots={3} title="Which shifts are hardest to cover?">
              <p className="-mt-1 text-xs text-gray-400">
                Pick any. We&apos;ll only surface students who can cover these.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Q3.map((o) => (
                  <Opt key={o.value} sel={buckets.includes(o.value)} onClick={() => toggle(o.value)} label={o.label} />
                ))}
              </div>
              <button type="button" disabled={buckets.length === 0} onClick={finish} className={btnPrimary}>
                See my matches →
              </button>
            </QuestionFrame>
          )}

          {step === "claim" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl text-gray-900">You&apos;re a fit!</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Create or claim your account to hire caregivers near you.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Organization name</label>
                <OrganizationSearch
                  value={orgQuery}
                  onChange={(v) => {
                    setOrgQuery(v);
                    setSelectedOrg(null);
                  }}
                  onSelect={(org) => {
                    setSelectedOrg(org);
                    if (org) {
                      setOrgQuery(org.name);
                      if (org.city) setCity(org.city);
                      if (org.state) setStateCode(org.state);
                    }
                  }}
                  selected={!!selectedOrg}
                  placeholder="Your home care agency"
                />
                {conflict && (
                  <p className="text-xs text-amber-700">
                    That agency is already managed. Create a new one below, or email{" "}
                    <a href="mailto:logan@olera.care" className="underline">logan@olera.care</a>.
                  </p>
                )}
              </div>

              <div className="space-y-1.5" ref={cityRef}>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setStateCode("");
                      setCityOpen(true);
                    }}
                    onFocus={() => setCityOpen(true)}
                    placeholder="e.g. Houston"
                    className={fieldClass}
                    autoComplete="off"
                  />
                  {stateCode && (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {stateCode}
                    </span>
                  )}
                  {cityOpen && cityResults.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                      {cityResults.map((c) => (
                        <button
                          key={`${c.city}-${c.state}`}
                          type="button"
                          onClick={() => {
                            setCity(c.city);
                            setStateCode(c.state);
                            setCityOpen(false);
                          }}
                          className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-700">{c.city}, {c.state}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Business email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@youragency.com"
                  className={fieldClass}
                  autoComplete="email"
                />
              </div>

              <button type="button" disabled={!canContinue} onClick={handleClaim} className={btnPrimary}>
                Continue →
              </button>
            </div>
          )}

          {(step === "loading" || step === "provisioning") && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
              <p className="text-sm text-gray-500">
                {step === "provisioning" ? "Setting up your account…" : "Finding your matches…"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Entrance animation — backdrop fades, panel pops up (mirrors the
          CandidateFiltersModal convention). Makes the magic-link arrival feel
          like an intentional pop-up, not a hard cut. */}
      <style jsx>{`
        @keyframes screener-backdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes screener-pop {
          from {
            transform: scale(0.96) translateY(8px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .animate-screener-backdrop {
          animation: screener-backdrop 0.18s ease-out;
        }
        .animate-screener-pop {
          animation: screener-pop 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

function QuestionFrame({ dots, title, children }: { dots: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= dots ? "bg-primary-600" : "bg-gray-200"}`} />
        ))}
        <span className="ml-2 text-xs text-gray-400">Question {dots} of 3</span>
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function Opt({ sel, onClick, label }: { sel: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
        sel ? "border-primary-600 bg-primary-50 text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function Reassure({ text }: { text: string }) {
  return <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{text}</p>;
}
