"use client";

import Image from "next/image";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import {
  getTrackLabel,
  formatHoursPerWeek,
  formatDuration,
  formatAvailability,
} from "@/lib/medjobs-helpers";

/**
 * CandidateDetailPanel — inline profile preview that replaces the map
 * on the Hire Caregivers board when a candidate card is clicked. The single
 * action is "Schedule interview" (the interview-scheduling MVP); the old
 * post-a-job / invite-to-posting machinery has been removed.
 */
export default function CandidateDetailPanel({
  candidate,
  onClose,
  onSchedule,
}: {
  candidate: CandidateData;
  onClose: () => void;
  /** Open the schedule-interview flow for this candidate. */
  onSchedule: () => void;
}) {
  const meta = candidate.metadata;
  const firstName = candidate.display_name.split(" ")[0];
  const trackLabel = getTrackLabel(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const availabilityLabel = formatAvailability(meta);
  const isDemo = candidate.slug.startsWith("sample-");

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <a
          href={`/medjobs/candidates/${candidate.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors"
        >
          Open full profile &rarr;
        </a>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Identity */}
        <div className="flex items-start gap-4">
          {candidate.image_url ? (
            <Image
              src={candidate.image_url}
              alt={candidate.display_name}
              width={72}
              height={72}
              className="w-[72px] h-[72px] rounded-full object-cover shadow-sm ring-2 ring-white shrink-0"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm ring-2 ring-white shrink-0">
              <span className="text-2xl font-bold text-primary-600">
                {candidate.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">{firstName}</h2>
                {meta.university && (
                  <p className="text-sm text-gray-600 font-medium mt-0.5">{meta.university}</p>
                )}
                <p className="text-sm text-gray-500 mt-0.5">
                  {[trackLabel, candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={onSchedule}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Schedule interview
              </button>
            </div>
            {isDemo && (
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 mt-1.5">
                Demo
              </span>
            )}
            {!isDemo && meta.seeking_status === "actively_looking" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ready to Start
              </span>
            )}
          </div>
        </div>

        {/* Availability */}
        {(hoursLabel || durationLabel || availabilityLabel) && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Availability</h3>
            <div className="grid grid-cols-2 gap-3">
              {hoursLabel && (
                <div>
                  <p className="text-xs text-gray-500">Hours/week</p>
                  <p className="text-sm font-semibold text-gray-900">{hoursLabel}</p>
                </div>
              )}
              {durationLabel && (
                <div>
                  <p className="text-xs text-gray-500">Commitment</p>
                  <p className="text-sm font-semibold text-gray-900">{durationLabel}</p>
                </div>
              )}
            </div>
            {availabilityLabel && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{availabilityLabel}</p>
              </div>
            )}
          </div>
        )}

        {/* Qualifications */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Qualifications</h3>
          <div className="space-y-2.5">
            {meta.major && (
              <div>
                <p className="text-xs text-gray-500">Major</p>
                <p className="text-sm font-medium text-gray-900">{meta.major}</p>
              </div>
            )}
            {meta.years_caregiving != null && meta.years_caregiving > 0 && (
              <div>
                <p className="text-xs text-gray-500">Caregiving Experience</p>
                <p className="text-sm font-medium text-gray-900">{meta.years_caregiving}+ years</p>
              </div>
            )}
            {(meta.languages?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-gray-500">Languages</p>
                <p className="text-sm font-medium text-gray-900">{meta.languages!.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Certifications */}
        {(meta.certifications?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Certifications</h3>
            <div className="flex flex-wrap gap-1.5">
              {meta.certifications!.map((cert) => (
                <span key={cert} className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold border border-primary-100">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Care experience types */}
        {(meta.care_experience_types?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Care Experience</h3>
            <div className="flex flex-wrap gap-1.5">
              {meta.care_experience_types!.map((type) => (
                <span key={type} className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-100">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why caregiving */}
        {(meta.why_caregiving || candidate.description) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              About {firstName}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
              {meta.why_caregiving || candidate.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
