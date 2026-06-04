"use client";

import Image from "next/image";
import { LOGAN_DEMO_CANDIDATE } from "@/lib/medjobs/demo-candidate";

/**
 * EmptyCandidatesLadder — fallback rendering when the candidate board
 * comes back empty for a cold-provider's catchment. Phase 2+3 Bullets
 * 10 + 11 (2026-06-04).
 *
 * Four-rung ladder per the master plan § 4.8:
 *   1. Real local students         (no fallback — board renders normally)
 *   2. Sample students from peers  (DEFERRED to Phase 2+3b — needs an API)
 *   3. Demo candidate              (THIS rung; Logan DuBose, clearly labeled)
 *   4. Recruiting-in-progress      (momentum banner with concrete language)
 *
 * For MVP we render rung 3 (demo profile) + rung 4 (recruiting banner)
 * together — admin sees Logan as the demo AND the "recruiting now"
 * messaging so the empty state always communicates progress. Rung 2
 * (sample students from peer campuses) needs an API to fetch + anonymize
 * profiles from other campuses; deferred.
 */
export default function EmptyCandidatesLadder() {
  return (
    <div className="space-y-8">
      <RecruitingMomentumBanner />
      <DemoCandidateCard />
    </div>
  );
}

function RecruitingMomentumBanner() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-6 py-6 sm:px-8 sm:py-7">
      <h2 className="font-serif text-2xl text-gray-900">
        Students are being recruited near you.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
        We&apos;re actively recruiting pre-nursing and pre-medical students
        from your local campus. As they complete vetting, their profiles
        will appear here. You can activate your pilot account now and we
        will notify you as students become available.
      </p>
    </section>
  );
}

function DemoCandidateCard() {
  const c = LOGAN_DEMO_CANDIDATE;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Sample profile · what a real student card looks like
        </h3>
      </div>
      <article className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white">
        <div className="bg-amber-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
          {c.demo_label} · This is not a real student
        </div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-gray-200">
              <Image
                src={c.photo_url}
                alt={c.display_name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold text-gray-900">
                {c.first_name} {c.last_name}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {c.program_track} · {c.city}, {c.state}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                  >
                    {cert}
                  </span>
                ))}
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  Available {c.hours_per_week} hrs/wk
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            {c.bio}
          </p>
        </div>
      </article>
    </section>
  );
}
