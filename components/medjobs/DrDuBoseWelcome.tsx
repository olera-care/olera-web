"use client";

import Image from "next/image";

/**
 * The welcome banner on the Hire Caregivers board, shown to a signed-in
 * provider. One bold line, one subline, and one CTA in the bottom-right that
 * highlights the first candidate card. Anonymous visitors see the page hero
 * instead (which carries the "Tell us your hiring needs" capture CTA).
 */

const HEADSHOT = "/images/for-providers/team/logan.jpg";

export default function DrDuBoseWelcome({
  campusName,
  onReviewCandidates,
}: {
  campusName?: string | null;
  onReviewCandidates?: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-sm">
          <Image src={HEADSHOT} alt="Dr. Logan DuBose" fill className="object-cover" sizes="56px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-gray-900">Hire more caregivers.</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            Review, interview, and hire candidates now{campusName ? ` near ${campusName}` : ""}.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            — Dr. Logan DuBose, MD, MBA · General Practitioner · Co-Founder of Olera
          </p>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onReviewCandidates}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Review candidates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
