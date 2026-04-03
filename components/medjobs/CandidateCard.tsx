"use client";

import Link from "next/link";
import Image from "next/image";
import type { CandidateData } from "./CandidateRow";
import {
  getTrackLabel,
  formatAvailability,
  formatHoursPerWeek,
  formatDuration,
  hasVideo,
} from "@/lib/medjobs-helpers";

const GRADIENTS = [
  "from-primary-400 to-teal-500",
  "from-teal-400 to-emerald-500",
  "from-primary-500 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-primary-500",
  "from-teal-500 to-primary-400",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface CandidateCardProps {
  candidate: CandidateData;
  basePath: string;
  /** Blur PII for unverified providers */
  blurPII?: boolean;
}

export default function CandidateCard({
  candidate,
  basePath,
  blurPII = false,
}: CandidateCardProps) {
  const meta = candidate.metadata;
  const trackLabel = getTrackLabel(meta);
  const availLabel = formatAvailability(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const certs = meta.certifications || [];
  const videoAvailable = hasVideo(meta);
  const location = [candidate.city, candidate.state].filter(Boolean).join(", ");
  const verifiedHours = meta.total_verified_hours ?? 0;

  const profileUrl = `${basePath}/${candidate.slug}`;

  return (
    <Link
      href={profileUrl}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${getGradient(candidate.id)}`} />

      <div className="flex flex-col p-5 pt-4 flex-1">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3.5 mb-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
            {candidate.image_url ? (
              <Image
                src={candidate.image_url}
                alt={candidate.display_name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${getGradient(candidate.id)} flex items-center justify-center`}
              >
                <span className="text-lg font-semibold text-white/90">
                  {candidate.display_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className={`text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate ${blurPII ? "blur-[5px] select-none" : ""}`}>
              {candidate.display_name}
            </h3>
            <p className={`text-sm text-gray-500 truncate ${blurPII ? "blur-[5px] select-none" : ""}`}>
              {meta.university || "University not specified"}
            </p>
          </div>
        </div>

        {/* Track + Location */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {trackLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              {trackLabel}
            </span>
          )}
          {location && (
            <span className={`inline-flex items-center gap-1 text-xs text-gray-500 ${blurPII ? "blur-[5px] select-none" : ""}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {location}
            </span>
          )}
        </div>

        {/* Availability details */}
        {(availLabel || hoursLabel || durationLabel) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 mb-3">
            {availLabel && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {availLabel}
              </span>
            )}
            {hoursLabel && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
                {hoursLabel}
              </span>
            )}
            {durationLabel && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {durationLabel}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push badges to bottom */}
        <div className="flex-1" />

        {/* Certs + trust badges */}
        {(certs.length > 0 || videoAvailable || verifiedHours > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-gray-50">
            {certs.slice(0, 3).map((cert) => (
              <span
                key={cert}
                className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-[11px] font-medium"
              >
                {cert.split(" (")[0]}
              </span>
            ))}
            {certs.length > 3 && (
              <span className="text-[11px] text-gray-400 font-medium">
                +{certs.length - 3}
              </span>
            )}
            {videoAvailable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                </svg>
                Video
              </span>
            )}
            {verifiedHours > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {verifiedHours} hrs verified
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover CTA overlay */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-primary-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-end justify-center pb-2">
        <span className="text-xs font-medium text-primary-600">
          View Profile →
        </span>
      </div>
    </Link>
  );
}
