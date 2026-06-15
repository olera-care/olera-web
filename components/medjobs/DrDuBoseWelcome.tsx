"use client";

import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * DrDuBoseWelcome — a warm, human welcome for the post-eligibility moment.
 * Placeholder until a real intro video exists: photo + message (+ optional
 * Calendly CTA, used in the no-students recruiting state). Phase B.
 */
export default function DrDuBoseWelcome({ withCalendly = false }: { withCalendly?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
          LD
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">A welcome from Dr. Logan DuBose</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Thanks for joining the pilot. I&apos;m a geriatric-focused physician,
            and I built this to connect pre-health students with agencies like
            yours. Browse your matches, meet a student by video, and only commit
            when it&apos;s a good fit.
          </p>
          {withCalendly && (
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Meet Dr. DuBose
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
