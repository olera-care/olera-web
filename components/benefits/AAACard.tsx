"use client";

import type { AreaAgency } from "@/lib/types/benefits";

interface AAACardProps {
  agency: AreaAgency;
}

export default function AAACard({ agency }: AAACardProps) {
  return (
    <div className="bg-vanilla-100 border-2 border-primary-300 rounded-2xl p-5 lg:p-6">
      {/* Recommended badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-600 text-white text-[11px] font-semibold rounded-full uppercase tracking-wide">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          #1 First Step
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{agency.name}</h3>
          {agency.region_name && (
            <p className="text-sm text-gray-600 mt-0.5">
              Serving {agency.region_name}
              {agency.city ? `, ${agency.city}` : ""}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        Talk to a real person who can walk you through every benefit
        you qualify for — for free. This is the single best action you
        can take right now.
      </p>

      {/* Services */}
      {agency.services_offered && agency.services_offered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agency.services_offered.slice(0, 6).map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 bg-white/80 rounded-full text-xs text-gray-600 border border-vanilla-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* What to say */}
      {agency.what_to_say && (
        <div className="bg-white border border-vanilla-200 rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">
            What to say when you call
          </p>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            &ldquo;{agency.what_to_say}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${agency.phone}`}
          aria-label={`Call ${agency.name} at ${agency.phone}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-500 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          Call {agency.phone}
        </a>
        {agency.website && (
          <a
            href={agency.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${agency.name} website (opens in new tab)`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium no-underline hover:bg-gray-50 transition-colors"
          >
            Visit Website
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
