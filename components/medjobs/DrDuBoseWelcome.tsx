"use client";

import Image from "next/image";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";
import { HOST_AGREEMENT_URL } from "@/lib/medjobs/eligibility";

/**
 * A note from Dr. DuBose — the universal anchor on the candidate board.
 *
 * One component, four state-specific variants. It replaces the old separate
 * "Check your eligibility to host" gate card: every board state now leads with
 * a note from Dr. DuBose that frames where the provider is and gives exactly
 * one next step.
 *
 *   anon          → logged-out visitor: "here's the caliber, check eligibility"
 *   not_eligible  → signed-in provider, screener not done: "one quick check"
 *   happy         → eligible + real students exist: "interview below"
 *   fallback      → eligible + no students yet: "read agreement + meet me"
 *
 * For anon/not_eligible the primary CTA is owned by the page (sign-in or open
 * the screener) via `onCheckEligibility`. For happy/fallback the two CTAs are
 * the hosting agreement (read-only link) and "Grab a time with me" (booking +
 * an "interested + eligible" team ping).
 */

export type NoteVariant = "anon" | "not_eligible" | "happy" | "fallback";

const HEADSHOT = "/images/for-providers/team/logan.jpg";

export default function DrDuBoseWelcome({
  variant,
  campusName,
  orgName,
  onCheckEligibility,
}: {
  variant: NoteVariant;
  campusName?: string | null;
  orgName?: string | null;
  onCheckEligibility?: () => void;
}) {
  const campus = campusName || "your campus";
  const agency = orgName || "your agency";

  const lead =
    variant === "happy" || variant === "fallback"
      ? "You're a fit."
      : variant === "not_eligible"
        ? "You're almost in."
        : "Welcome.";

  const body =
    variant === "anon" ? (
      <>
        These are the caliber of pre-health caregivers joining Olera near {campus}.
        Check your eligibility to host and you can start interviewing the ones who
        fit your clients.
      </>
    ) : variant === "not_eligible" ? (
      <>
        One quick check — about a minute — confirms {campus} caregivers fit{" "}
        {agency}, then you can start interviewing.
      </>
    ) : variant === "happy" ? (
      <>
        Read our hosting agreement first. If you&apos;re ready, start reviewing and
        interviewing candidates below to see who&apos;s a good fit for {agency}. If
        you&apos;d like me to walk through the requirements or answer questions, grab
        a time with me. There&apos;s no commitment until you and the student confirm
        a good fit.
      </>
    ) : (
      <>
        Read our hosting agreement and grab a time with me to go over host
        requirements. Let&apos;s get you set up so you&apos;re ready to interview{" "}
        {campus} candidates and see if any are a good fit for {agency}.
      </>
    );

  const showEligibilityCta = variant === "anon" || variant === "not_eligible";

  const fireInterest = () => {
    // Best-effort "interested + eligible" team ping; never blocks the booking.
    try {
      fetch("/api/medjobs/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "grab_time", campus: campusName ?? null }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-sm">
          <Image src={HEADSHOT} alt="Dr. Logan DuBose" fill className="object-cover" sizes="56px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-gray-900">{lead}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{body}</p>
          <p className="mt-2 text-xs text-gray-500">
            — Dr. Logan DuBose, MD · geriatric-focused physician, NIA researcher
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {showEligibilityCta ? (
              <>
                <button
                  type="button"
                  onClick={onCheckEligibility}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Check your eligibility to host →
                </button>
                <a
                  href={HOST_AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Read the hosting agreement ↗
                </a>
              </>
            ) : (
              <>
                <a
                  href={HOST_AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  Read the hosting agreement ↗
                </a>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={fireInterest}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Grab a time with me →
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
