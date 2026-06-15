"use client";

import { useState } from "react";
import type { DemandProfile } from "@/lib/medjobs/eligibility";

/**
 * EligibilityScreenerModal — the provider eligibility screener (Phase B).
 *
 * One question per screen (intro → Q1 demand → Q2 PRN → Q3 coverage →
 * loading), each with a short reassurance. On finish it persists the demand
 * profile + eligibility flag via POST /api/medjobs/eligibility, then calls
 * onComplete (the caller reloads so the board re-reads eligibility).
 */

type Step = "intro" | "q1" | "q2" | "q3" | "loading";
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

export default function EligibilityScreenerModal({
  providerProfileId,
  campusName,
  orgName,
  onClose,
  onComplete,
}: {
  providerProfileId?: string;
  campusName?: string | null;
  orgName?: string | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [shape, setShape] = useState<Shape | null>(null);
  const [prn, setPrn] = useState<Prn | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (v: Bucket) =>
    setBuckets((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const finish = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/medjobs/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: providerProfileId,
          demand_profile: { demand_shape: shape, prn_open: prn, coverage_buckets: buckets },
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Could not save your answers");
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your answers");
      setStep("q3");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {step === "intro" && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-gray-900">
                {orgName ? `Welcome, ${orgName}.` : "Welcome."}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                See if {campusName ? `${campusName} student caregivers` : "student caregivers near you"} fit
                your agency. About a minute, no commitment. You only commit when a student is the right fit.
              </p>
              <button type="button" onClick={() => setStep("q1")} className={btnPrimary}>
                See if I&apos;m a fit →
              </button>
            </div>
          )}

          {step === "q1" && (
            <QuestionFrame dots={1} title="How steady are your staffing needs?">
              {Q1.map((o) => (
                <Opt key={o.value} sel={shape === o.value} onClick={() => setShape(o.value)} label={o.label} />
              ))}
              {shape && <Reassure text={Q1.find((o) => o.value === shape)!.reassure} />}
              <button type="button" disabled={!shape} onClick={() => setStep("q2")} className={btnPrimary}>
                Next →
              </button>
            </QuestionFrame>
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

          {step === "loading" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
              <p className="text-sm text-gray-500">Finding your matches…</p>
            </div>
          )}
        </div>
      </div>
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
