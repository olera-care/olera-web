"use client";

import Image from "next/image";
import Link from "next/link";

import { INTERNSHIP_AGREEMENT_URL } from "@/lib/medjobs/student-eligibility";

/**
 * A note from Dr. DuBose — the universal anchor at the top of the student
 * families board, the mirror of DrDuBoseWelcome on the provider board.
 *
 * One component, three state-specific variants, each giving exactly one next step
 * (CTA order: agreement link LEFT, primary action button RIGHT):
 *   anon     → not yet eligible: "Check your eligibility" (primary). The real
 *              families below are the demand; the eligibility check is the action.
 *   not_live → eligible, profile not yet complete: "Complete your application"
 *              (primary). Going live is the action.
 *   live     → profile is live: "Families can find you — request interviews
 *              below," agreement available as a secondary link.
 */

export type StudentNoteVariant = "anon" | "not_live" | "live";

const HEADSHOT = "/images/for-providers/team/logan.jpg";
const AGREEMENT_URL = INTERNSHIP_AGREEMENT_URL;

export default function StudentWelcomeNote({
  variant,
  campusName,
  firstName,
  completeness,
  onCheckEligibility,
}: {
  variant: StudentNoteVariant;
  campusName?: string | null;
  firstName?: string | null;
  /** Profile completeness 0-100, shown subtly on the not_live note. */
  completeness?: number | null;
  /** anon variant — opens the eligibility screener. */
  onCheckEligibility?: () => void;
}) {
  const campus = campusName || "your campus";
  const hi = firstName ? `, ${firstName}` : "";

  const lead =
    variant === "live" ? `You're live${hi}.` : variant === "not_live" ? "You're in!" : "Welcome.";

  const body =
    variant === "live" ? (
      <>
        Families near {campus} can find you now. Browse who&apos;s hiring below and
        request an interview when you find a fit. There&apos;s no commitment until
        you and the family confirm.
      </>
    ) : variant === "not_live" ? (
      <>
        Complete your application to get hired and start getting paid healthcare
        experience.
      </>
    ) : (
      <>
        Apply to the local healthcare agencies and families hiring student caregivers
        near you right now.
      </>
    );

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
            &mdash; Dr. Logan DuBose, MD, MBA &middot; General Practitioner &middot; Co-Founder of Olera
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {variant === "anon" ? (
              <>
                <Link href="/medjobs" className="text-sm font-medium text-primary-700 hover:underline">
                  How it works ↗
                </Link>
                <a
                  href={AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Eligibility requirements ↗
                </a>
                <button
                  type="button"
                  onClick={onCheckEligibility}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Apply Now →
                </button>
              </>
            ) : variant === "not_live" ? (
              <>
                <Link href="/medjobs" className="text-sm font-medium text-primary-700 hover:underline">
                  How it works ↗
                </Link>
                <a
                  href={AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Student Agreement ↗
                </a>
                <Link
                  href="/portal/medjobs"
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Complete your application
                  {typeof completeness === "number" ? ` · ${completeness}%` : ""} →
                </Link>
              </>
            ) : (
              <a
                href={AGREEMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                Student Agreement ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
