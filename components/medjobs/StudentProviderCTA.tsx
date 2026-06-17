"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";

/**
 * StudentProviderCTA — the student-context action region on the provider page
 * (replaces the family CTA when ?ctx=medjobs-student). A hiring banner + a
 * "Request interview" button, gated on the student having a live application
 * (so agencies never receive an empty profile). For a directory-only provider
 * (no business_profile yet) the request resolves/creates one first
 * (materialize-on-request) — student demand pulls providers into the program.
 */

export default function StudentProviderCTA({
  surface,
  providerId,
  providerName,
  providerSlug,
  providerSource,
  city,
  state,
  campus,
}: {
  surface: "sidebar" | "mobile";
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerSource: "ios" | "bp";
  city?: string | null;
  state?: string | null;
  campus?: string | null;
}) {
  const { profiles, isLoading } = useAuth();
  const studentProfile = profiles?.find((p) => p.type === "student");
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentProfile?.id) return;
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb
          .from("business_profiles")
          .select("is_active")
          .eq("id", studentProfile.id)
          .single();
        setIsLive(!!data?.is_active);
      } catch {
        setIsLive(null);
      }
    })();
  }, [studentProfile?.id]);

  const locationLabel = campus
    ? `near ${campus}`
    : [city, state].filter(Boolean).join(", ") || "in your area";

  async function handleRequest() {
    setError(null);
    // Not signed in / not a student → go check eligibility.
    if (!studentProfile?.id) {
      window.location.href = "/medjobs/families?screener=1";
      return;
    }
    // Resolve the provider's business_profile id (materialize directory rows).
    setResolving(true);
    try {
      if (providerSource === "bp") {
        setResolvedId(providerId);
      } else {
        const res = await fetch("/api/medjobs/resolve-provider", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: providerSlug, providerId }),
        });
        const data = await res.json();
        if (!res.ok || !data.providerProfileId) {
          setError("Couldn't open this request. Please try again.");
          return;
        }
        setResolvedId(data.providerProfileId);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResolving(false);
    }
  }

  const wrapClass =
    surface === "sidebar"
      ? "rounded-2xl border border-primary-200 bg-white p-5 shadow-sm"
      : "fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden";

  // Gate: student must be live before requesting.
  const needsApplication = studentProfile?.id && isLive === false;

  return (
    <>
      <div className={wrapClass}>
        {surface === "sidebar" && (
          <>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Hiring student caregivers {locationLabel}
            </p>
            <p className="mt-2 font-serif text-lg text-gray-900">{providerName}</p>
            <p className="mt-1 text-sm text-gray-600">
              Request an interview to explore working with them this semester.
            </p>
          </>
        )}

        {requested ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600">
            ✓ Interview requested
          </p>
        ) : needsApplication ? (
          <div className={surface === "mobile" ? "" : "mt-3"}>
            <Link
              href="/portal/medjobs"
              className="block w-full rounded-xl bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-700"
            >
              Complete your application first →
            </Link>
            <p className="mt-1.5 text-center text-xs text-gray-500">
              So {providerName} sees who you are before your interview.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRequest}
            disabled={isLoading || resolving}
            className={
              (surface === "mobile" ? "" : "mt-3 ") +
              "w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            }
          >
            {resolving ? "Opening…" : "Request interview"}
          </button>
        )}
        {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
      </div>

      {resolvedId && (
        <ScheduleInterviewModal
          providerProfileId={resolvedId}
          otherName={providerName}
          onClose={() => setResolvedId(null)}
          onScheduled={() => {
            setRequested(true);
            setResolvedId(null);
          }}
        />
      )}
    </>
  );
}
