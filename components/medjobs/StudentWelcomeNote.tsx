"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * A note from Dr. DuBose — the universal anchor at the top of the student
 * families board, the mirror of DrDuBoseWelcome on the provider board.
 *
 * One component, two state-specific variants, each giving exactly one next step:
 *   not_live → profile not yet live: "Finish your profile to go live" (primary)
 *              + "Read the internship agreement" (secondary). Families below are
 *              the FOMO; going live is the action.
 *   live     → profile is live: "Families can find you — request interviews
 *              below," agreement available as a secondary link.
 */

export type StudentNoteVariant = "not_live" | "live";

const HEADSHOT = "/images/for-providers/team/logan.jpg";
const AGREEMENT_URL = "/docs/internship-agreement-sample.pdf";

export default function StudentWelcomeNote({
  variant,
  campusName,
  firstName,
  completeness,
}: {
  variant: StudentNoteVariant;
  campusName?: string | null;
  firstName?: string | null;
  /** Profile completeness 0-100, shown subtly on the not_live note. */
  completeness?: number | null;
}) {
  const campus = campusName || "your campus";
  const hi = firstName ? `, ${firstName}` : "";

  const lead = variant === "live" ? `You're live${hi}.` : `You're in${hi}.`;

  const body =
    variant === "live" ? (
      <>
        Families near {campus} can find you now. Browse who&apos;s hiring below and
        request an interview when you find a fit. There&apos;s no commitment until
        you and the family confirm.
      </>
    ) : (
      <>
        Finish your profile so families near {campus} can reach you. These are the
        families hiring near you right now &mdash; once you&apos;re live, you can
        request interviews with any of them.
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
            &mdash; Dr. Logan DuBose, MD &middot; geriatric-focused physician, NIA researcher
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {variant === "not_live" ? (
              <>
                <Link
                  href="/portal/medjobs"
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Finish your profile to go live
                  {typeof completeness === "number" ? ` · ${completeness}%` : ""} →
                </Link>
                <a
                  href={AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  Read the internship agreement ↗
                </a>
              </>
            ) : (
              <a
                href={AGREEMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                Read the internship agreement ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
