"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Benefits-outcome landing page — where the check-in email chips land
 * (Benefits Cascade rung B2).
 *
 * Reached with a signed token (?tok=) carrying the family + their answer
 * ('moving' | 'wants_help' | 'wrong_program'). Works for guests with no
 * login. The answer is recorded via a client-side POST on mount — one tap
 * for a real person, but safe from email-security scanners (they issue GETs
 * and don't run JS).
 *
 * Every path helps forward:
 *   moving        → encouragement + the program guide to keep going.
 *   wants_help    → a real person will follow up, plus an optional ZIP field
 *                   that reveals their local Area Agency on Aging.
 *   wrong_program → one-tap "what didn't fit" + their other matches.
 */

interface OutcomeResult {
  value: "moving" | "wants_help" | "wrong_program";
  firstName?: string | null;
  state?: string | null;
  programName?: string | null;
  programUrl?: string;
  matchesUrl?: string;
}

interface AaaAgency {
  name: string;
  phone: string;
  website: string | null;
  city: string | null;
  whatToSay: string | null;
}

const REASON_CHIPS: { reason: string; label: string }[] = [
  { reason: "already_enrolled", label: "We already have this one" },
  { reason: "did_not_qualify", label: "We didn't qualify" },
  { reason: "too_complicated", label: "It was too complicated" },
  { reason: "other", label: "Something else" },
];

const ELDERCARE_LOCATOR_PHONE = "1-800-677-1116";

function BenefitsOutcomeInner() {
  const params = useSearchParams();
  const tok = params.get("tok");

  const [status, setStatus] = useState<"loading" | "done" | "error">(tok ? "loading" : "error");
  const [result, setResult] = useState<OutcomeResult | null>(null);

  // wants_help ZIP flow
  const [zip, setZip] = useState("");
  const [aaaStatus, setAaaStatus] = useState<"idle" | "loading" | "found" | "none" | "error">("idle");
  const [agency, setAgency] = useState<AaaAgency | null>(null);

  // wrong_program reason flow
  const [reasonSent, setReasonSent] = useState<string | null>(null);

  // wants_help phone capture
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const phoneValid = /^\d{10}$/.test(phoneVal.replace(/\D/g, "").replace(/^1/, "")) || /^1\d{10}$/.test(phoneVal.replace(/\D/g, ""));

  const record = useCallback(async () => {
    if (!tok) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/families/benefits-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tok }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setResult((await res.json()) as OutcomeResult);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [tok]);

  useEffect(() => {
    void record();
  }, [record]);

  const lookupAgency = useCallback(async () => {
    if (!/^\d{5}$/.test(zip.trim())) return;
    setAaaStatus("loading");
    try {
      const res = await fetch("/api/families/benefits-outcome/aaa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tok, zip: zip.trim() }),
      });
      if (!res.ok) {
        setAaaStatus("error");
        return;
      }
      const data = (await res.json()) as { agency: AaaAgency | null };
      if (data.agency) {
        setAgency(data.agency);
        setAaaStatus("found");
      } else {
        setAaaStatus("none");
      }
    } catch {
      setAaaStatus("error");
    }
  }, [tok, zip]);

  const submitPhone = useCallback(async () => {
    if (!phoneValid) return;
    setPhoneStatus("sending");
    try {
      const res = await fetch("/api/families/benefits-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tok, phone: phoneVal.trim() }),
      });
      setPhoneStatus(res.ok ? "done" : "error");
    } catch {
      setPhoneStatus("error");
    }
  }, [tok, phoneVal, phoneValid]);

  const sendReason = useCallback(
    async (reason: string) => {
      setReasonSent(reason);
      try {
        await fetch("/api/families/benefits-outcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tok, reason }),
        });
      } catch {
        // Best-effort — the thank-you state stands either way.
      }
    },
    [tok],
  );

  const program = result?.programName || "your program";
  const programUrl = result?.programUrl || "/benefits/finder";
  const matchesUrl = result?.matchesUrl || "/benefits/finder";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {status === "loading" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Saving your answer&hellip;</h1>
            <p className="text-gray-500">One moment.</p>
          </div>
        ) : status === "done" && result?.value === "moving" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">That&apos;s great news</h1>
            <p className="text-gray-500 mb-6">
              You&apos;re further along than most families get. Keep going, and if anything stalls,
              we&apos;re here.
            </p>
            <div className="space-y-3">
              <Link
                href={programUrl}
                className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                See the full guide for {program}
              </Link>
              <Link
                href={matchesUrl}
                className="block w-full px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                See your other matched programs
              </Link>
            </div>
          </div>
        ) : status === "done" && result?.value === "wants_help" ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Help is on the way</h1>
              <p className="text-gray-500">
                A real person from Olera will reach out within a day or two to walk through{" "}
                {program} with you. You don&apos;t have to figure this out alone.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Want to talk to someone local today?</p>
              <p className="text-sm text-gray-500 mb-3">
                Every county has a free Area Agency on Aging whose job is helping with exactly
                this. Enter your ZIP and we&apos;ll find yours.
              </p>
              {aaaStatus === "found" && agency ? (
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{agency.name}</p>
                  {agency.city && <p className="text-sm text-gray-500">{agency.city}</p>}
                  <a
                    href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`}
                    className="block text-lg font-bold text-primary-700 mt-1"
                  >
                    {agency.phone}
                  </a>
                  {agency.whatToSay && (
                    <p className="text-sm text-gray-500 mt-2">
                      What to say: &ldquo;{agency.whatToSay}&rdquo;
                    </p>
                  )}
                </div>
              ) : aaaStatus === "none" || aaaStatus === "error" ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    We couldn&apos;t pin down your local agency from that ZIP. The national
                    Eldercare Locator can connect you in one call:
                  </p>
                  <a
                    href={`tel:${ELDERCARE_LOCATOR_PHONE.replace(/[^\d+]/g, "")}`}
                    className="block text-lg font-bold text-primary-700 mt-1"
                  >
                    {ELDERCARE_LOCATOR_PHONE}
                  </a>
                  <p className="text-xs text-gray-400 mt-1">Free, Monday to Friday, run by the U.S. Administration on Aging.</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                    placeholder="ZIP code"
                    className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={lookupAgency}
                    disabled={!/^\d{5}$/.test(zip) || aaaStatus === "loading"}
                    className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-gray-700 transition-colors shrink-0"
                  >
                    {aaaStatus === "loading" ? "Finding…" : "Find it"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-5 mb-4">
              {phoneStatus === "done" ? (
                <p className="text-sm text-gray-600 text-center py-1">
                  Done. We texted your plan. Reply if you want help choosing, qualifying, or
                  applying; Olera&apos;s care team replies within 48 hours.
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Prefer texts?</p>
                  <p className="text-sm text-gray-500 mb-3">
                    We&apos;ll text your plan now. Reply if you want help choosing, qualifying, or
                    applying; Olera&apos;s care team replies within 48 hours.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                      placeholder="Your mobile number"
                      className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={submitPhone}
                      disabled={!phoneValid || phoneStatus === "sending"}
                      className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-gray-700 transition-colors shrink-0"
                    >
                      {phoneStatus === "sending" ? "Sending…" : "Text me"}
                    </button>
                  </div>
                  {phoneStatus === "error" && (
                    <p className="text-xs text-red-600 mt-2">
                      That didn&apos;t go through. Check the number and try again.
                    </p>
                  )}
                  <p className="text-[11px] leading-relaxed text-gray-400 mt-2.5">
                    By adding your number you agree to receive care-related texts from Olera.
                    Reply STOP anytime.
                  </p>
                </>
              )}
            </div>

            <Link
              href={programUrl}
              className="block w-full text-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Revisit the guide for {program}
            </Link>
          </div>
        ) : status === "done" && result?.value === "wrong_program" ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Good to know, thank you</h1>
              <p className="text-gray-500">
                Not every program fits every family. Your other matches are below.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 mb-4">
              {reasonSent ? (
                <p className="text-sm text-gray-600 text-center py-1">
                  Thanks, that helps us point you somewhere better.
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    What didn&apos;t fit about {program}?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REASON_CHIPS.map((c) => (
                      <button
                        key={c.reason}
                        onClick={() => sendReason(c.reason)}
                        className="px-3.5 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href={matchesUrl}
                className="block w-full text-center px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                See your other matched programs
              </Link>
              <Link
                href="/benefits/finder"
                className="block w-full text-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Answer a few questions for a better match
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t save your answer. Please try the link again, or email{" "}
              <a href="mailto:support@olera.care" className="text-primary-600 hover:underline">
                support@olera.care
              </a>{" "}
              and a real person will help directly.
            </p>
            {tok ? (
              <button
                onClick={record}
                className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                Try again
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BenefitsOutcomePage() {
  return (
    <Suspense fallback={null}>
      <BenefitsOutcomeInner />
    </Suspense>
  );
}
