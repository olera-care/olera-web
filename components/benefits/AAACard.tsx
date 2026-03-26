"use client";

import type { AreaAgency } from "@/lib/types/benefits";

interface AAACardProps {
  agency: AreaAgency;
}

export default function AAACard({ agency }: AAACardProps) {
  return (
    <div className="border border-vanilla-300 bg-vanilla-100 rounded-2xl p-6 lg:p-8">
      <p className="text-xs font-medium text-gray-400 mb-3 tracking-widest uppercase">
        Recommended first step
      </p>

      <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
        {agency.name}
      </h3>
      {agency.region_name && (
        <p className="text-sm text-gray-500">
          Serving {agency.region_name}
          {agency.city ? `, ${agency.city}` : ""}
        </p>
      )}

      <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-xl">
        A real person who can walk you through every benefit you qualify
        for — for free.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <a
          href={`tel:${agency.phone}`}
          aria-label={`Call ${agency.name} at ${agency.phone}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-gray-900 text-white rounded-full text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
        >
          Call {agency.phone}
        </a>
        {agency.website && (
          <a
            href={agency.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${agency.name} website (opens in new tab)`}
            className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
          >
            Visit website
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}
