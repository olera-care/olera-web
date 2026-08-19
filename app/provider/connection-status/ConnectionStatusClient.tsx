"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Client component for /provider/connection-status.
 * POSTs the signed token on mount (scanner-safe — link-scanners that fetch
 * every href via GET never write). On success, shows a brief confirmation
 * then auto-redirects to the provider dashboard.
 */

type StatusValue = "connected" | "not_a_fit" | "no_capacity";

interface StatusResponse {
  ok: boolean;
  value?: StatusValue;
  already_reported?: boolean;
  error?: string;
}

function getSuccessMessage(value: StatusValue, alreadyReported: boolean): string {
  if (alreadyReported) {
    return "Already recorded";
  }
  switch (value) {
    case "connected":
      return "Marked as connected";
    case "not_a_fit":
      return "Noted — not a good fit";
    case "no_capacity":
      return "Noted — no capacity";
    default:
      return "Response recorded";
  }
}

export default function ConnectionStatusClient({ tok }: { tok: string }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "error" | "redirecting">("loading");
  const [successMessage, setSuccessMessage] = useState<string>("");
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

      // Show brief success message then redirect
      const message = getSuccessMessage(json.value || "connected", json.already_reported || false);
      setSuccessMessage(message);
      setState("redirecting");

      // Redirect to provider dashboard after brief delay
      setTimeout(() => {
        router.push("/provider");
      }, 1200);
    } catch {
      setErrorMsg("Failed to record your response. Please try again.");
      setState("error");
    }
  }, [tok, router]);

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

  // Loading or redirecting state - show spinner with message
  return (
    <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${
            state === "redirecting" ? "bg-green-100" : "bg-gray-100"
          }`}>
            {state === "redirecting" ? (
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </span>
        </div>
        <h1 className="font-serif text-2xl text-gray-900 mb-3">
          {state === "redirecting" ? successMessage : "Recording..."}
        </h1>
        <p className="text-gray-500">
          {state === "redirecting" ? "Taking you to your dashboard..." : "Please wait"}
        </p>
      </div>
    </div>
  );
}
