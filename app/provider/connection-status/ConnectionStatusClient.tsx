"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client component for /provider/connection-status.
 * POSTs the signed token on mount (scanner-safe — link-scanners that fetch
 * every href via GET never write). Displays appropriate confirmation based
 * on the reported status value.
 */

type StatusValue = "connected" | "not_a_fit" | "no_capacity";

interface StatusResponse {
  ok: boolean;
  value?: StatusValue;
  already_reported?: boolean;
  error?: string;
}

const fadeStyles = `
@keyframes csFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.cs-fade { opacity: 0; animation: csFadeUp 0.5s ease-out forwards; }
@media (prefers-reduced-motion: reduce) { .cs-fade { animation: none; opacity: 1; } }
`;

function getConfirmation(value: StatusValue, alreadyReported: boolean): {
  icon: "check" | "info";
  headline: string;
  subline: string;
  note?: string;
} {
  if (alreadyReported) {
    return {
      icon: "info",
      headline: "Already recorded",
      subline: "We got your response earlier. No further action needed.",
    };
  }

  switch (value) {
    case "connected":
      return {
        icon: "check",
        headline: "Great news!",
        subline: "We've marked this as connected. You won't receive further follow-ups about this family.",
        note: "Connections like this help families find the right care. Thank you for responding.",
      };
    case "not_a_fit":
      return {
        icon: "check",
        headline: "Got it",
        subline: "We've noted this wasn't a good fit. You won't receive further follow-ups about this family.",
        note: "Your feedback helps us improve which families we connect you with.",
      };
    case "no_capacity":
      return {
        icon: "check",
        headline: "Understood",
        subline: "We've noted you don't have capacity right now. You won't receive further follow-ups about this family.",
        note: "When you have availability again, new families will still be able to reach out.",
      };
    default:
      return {
        icon: "check",
        headline: "Response recorded",
        subline: "Thank you for letting us know.",
      };
  }
}

export default function ConnectionStatusClient({ tok }: { tok: string }) {
  const [state, setState] = useState<"loading" | "error" | "success">("loading");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const submitted = useRef(false);

  const submit = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/connection-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tok }),
      });
      const json: StatusResponse = await res.json().catch(() => ({ ok: false }));

      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || "Something went wrong");
        setState("error");
        return;
      }

      setData(json);
      setState("success");
    } catch {
      setErrorMsg("Failed to record your response. Please try again.");
      setState("error");
    }
  }, [tok]);

  useEffect(() => {
    if (submitted.current) return; // strict-mode double-mount guard
    submitted.current = true;

    if (!tok) {
      setErrorMsg("Invalid or missing link");
      setState("error");
      return;
    }

    submit();
  }, [tok, submit]);

  if (state === "error") {
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
          <h1 className="font-serif text-2xl text-gray-900 mb-3">That link didn&apos;t work</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {errorMsg === "Token has expired"
              ? "This link has expired. You can still manage your connections from your dashboard."
              : errorMsg || "Something went wrong. Please try again or contact support."}
          </p>
          <Link
            href="/provider"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 animate-pulse">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <div className="h-7 w-48 bg-[#F1E5D6]/70 rounded-xl animate-pulse mx-auto mb-4" />
          <div className="h-5 w-64 bg-[#F1E5D6]/50 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  // Success state
  const value = data?.value || "connected";
  const conf = getConfirmation(value, data?.already_reported || false);

  return (
    <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: fadeStyles }} />
      <div className="max-w-md w-full text-center">
        <div className="cs-fade flex items-center justify-center mb-6">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${
            conf.icon === "check" ? "bg-green-100" : "bg-blue-100"
          }`}>
            {conf.icon === "check" ? (
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </span>
        </div>
        <h1 className="cs-fade font-serif text-2xl text-gray-900 mb-3" style={{ animationDelay: "0.1s" }}>
          {conf.headline}
        </h1>
        <p className="cs-fade text-gray-600 mb-4 leading-relaxed" style={{ animationDelay: "0.2s" }}>
          {conf.subline}
        </p>
        {conf.note && (
          <p className="cs-fade text-sm text-gray-400 mb-8 leading-relaxed" style={{ animationDelay: "0.3s" }}>
            {conf.note}
          </p>
        )}
        <Link
          href="/provider"
          className="cs-fade inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
          style={{ animationDelay: "0.4s" }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
