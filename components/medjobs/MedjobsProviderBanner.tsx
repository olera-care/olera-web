"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * MedjobsProviderBanner — the provider mirror of the student portal welcome
 * banner. Shows on the provider dashboard (/provider) for a provider who has
 * completed the MedJobs needs quiz (eligible), giving the next step:
 *   fallback (no candidates yet) → book a call with Dr. DuBose
 *   happy   (candidates near you) → browse + read the provider agreement
 * Renders nothing for non-MedJobs providers.
 */

const PROVIDER_AGREEMENT_URL = "/docs/host-agreement-sample.pdf";
const BROWSE_URL = "/provider/medjobs/candidates";

export default function MedjobsProviderBanner() {
  const { profiles, isLoading } = useAuth();
  const providerProfile = profiles?.find((p) => p.type === "organization");
  const eligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null,
  );
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!eligible) return;
    let cancelled = false;
    fetch("/api/medjobs/candidates?page=0&pageSize=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.total === "number") setCount(d.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eligible]);

  if (isLoading || !eligible) return null;
  const happy = typeof count === "number" && count > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="rounded-2xl border border-primary-100/60 bg-gradient-to-r from-primary-50 to-vanilla-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <Image
              src="/images/for-providers/team/logan.jpg"
              alt="Dr. Logan DuBose"
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">You&apos;re set.</p>
              <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                {happy
                  ? `${count} student caregiver${count === 1 ? "" : "s"} near you are ready to interview.`
                  : "Let's talk — book a call so I can recruit students for your shifts."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
            {happy ? (
              <>
                <Link
                  href={BROWSE_URL}
                  className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Browse candidates →
                </Link>
                <a
                  href={PROVIDER_AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-700 hover:underline"
                >
                  Read provider agreement ↗
                </a>
              </>
            ) : (
              <>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Book a call →
                </a>
                <Link href={BROWSE_URL} className="text-sm font-semibold text-primary-700 hover:underline">
                  Browse candidates ↗
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
