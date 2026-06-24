"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Connection-outcome landing page — the dating-app "Did you meet?" check.
 *
 * Reached from the one-click outcome email, keyed by the connection id (?cid=)
 * and the family's answer (?v=yes|no|not_yet). Works for guests with no login.
 * The answer is recorded via a client-side POST on mount — one-click for a real
 * person, but safe from email-security scanners (they issue GETs and don't run JS).
 *
 * yes        → warm confirmation + light "anything else?" links.
 * no/not_yet → the help cascade: matched alternative providers + benefits finder.
 */

interface Alternative {
  name: string;
  slug: string;
  url: string;
  priceRange: string | null;
  /** Enhancement fields from findAlternativeProviders — mirror the email compare cards. */
  imageUrl?: string;
  rating?: number | null;
  reviewCount?: number | null;
  distanceMi?: number | null;
}

interface OutcomeResult {
  value: "yes" | "no" | "not_yet";
  providerName?: string;
  alternatives?: Alternative[];
  browseUrl?: string;
  benefitsUrl?: string;
}

function ConnectionOutcomeInner() {
  const params = useSearchParams();
  const cid = params.get("cid");
  const value = params.get("v");

  const valid = cid && (value === "yes" || value === "no" || value === "not_yet");
  const [status, setStatus] = useState<"loading" | "done" | "error">(valid ? "loading" : "error");
  const [result, setResult] = useState<OutcomeResult | null>(null);

  const record = useCallback(async () => {
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/families/connection-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, value }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as OutcomeResult;
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, [valid, cid, value]);

  useEffect(() => {
    void record();
  }, [record]);

  const isYes = result?.value === "yes";
  const provider = result?.providerName || "the provider";
  const alternatives = result?.alternatives || [];

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
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Saving your answer…</h1>
            <p className="text-gray-500">One moment.</p>
          </div>
        ) : status === "done" && isYes ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">That&apos;s great to hear</h1>
            <p className="text-gray-500 mb-6">
              Glad {provider} got back to you. We&apos;re here if you need anything else along the way.
            </p>
            <div className="space-y-3">
              <Link
                href="/benefits/finder"
                className="block w-full px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                See what benefits you may qualify for
              </Link>
              <Link href="/" className="block text-primary-600 hover:text-primary-700 font-medium text-sm pt-1">
                Go to Olera
              </Link>
            </div>
          </div>
        ) : status === "done" ? (
          // no / not_yet → help cascade
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Let&apos;s find you a faster response</h1>
              <p className="text-gray-500">
                Thanks for letting us know. The good thing about Olera is you&apos;re never limited to one —
                here are other providers near you who are ready to help.
              </p>
            </div>

            {alternatives.length > 0 && (
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4 overflow-hidden">
                {alternatives.map((p) => {
                  const meta = [
                    p.rating != null
                      ? `★ ${p.rating.toFixed(1)}${p.reviewCount ? ` (${p.reviewCount})` : ""}`
                      : null,
                    p.distanceMi != null
                      ? `${p.distanceMi < 10 ? p.distanceMi.toFixed(1) : Math.round(p.distanceMi)} mi away`
                      : null,
                  ]
                    .filter(Boolean)
                    .join("  ·  ");
                  return (
                    <a
                      key={p.slug}
                      href={p.url}
                      className="flex items-start gap-3.5 bg-white px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block text-primary-700 font-semibold leading-tight truncate">{p.name}</span>
                        {meta && <span className="block text-[13px] text-gray-500 mt-0.5">{meta}</span>}
                        {p.priceRange && <span className="block text-[13px] text-gray-500 mt-0.5">{p.priceRange}</span>}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={result?.browseUrl || "/browse"}
                className="block w-full text-center px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                See more providers near you
              </Link>
              <Link
                href={result?.benefitsUrl || "/benefits/finder"}
                className="block w-full text-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Check what benefits you qualify for
              </Link>
            </div>

            <p className="text-sm text-gray-400 text-center mt-6">
              Want a hand choosing? A real person is here —{" "}
              <a href="mailto:support@olera.care" className="text-primary-600 hover:underline">
                support@olera.care
              </a>
              .
            </p>
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
              and we&apos;ll help directly.
            </p>
            {valid ? (
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

export default function ConnectionOutcomePage() {
  return (
    <Suspense fallback={null}>
      <ConnectionOutcomeInner />
    </Suspense>
  );
}
