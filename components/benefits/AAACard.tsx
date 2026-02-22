"use client";

import type { AreaAgency } from "@/lib/types/benefits";

interface AAACardProps {
  agency: AreaAgency;
}

export default function AAACard({ agency }: AAACardProps) {
  return (
    <div className="border border-vanilla-300 bg-vanilla-100 rounded-2xl p-6 lg:p-8">
      <p className="text-text-xs font-medium text-gray-400 mb-3 tracking-widest uppercase">
        Recommended first step
      </p>

      <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
        {agency.name}
      </h3>
      {agency.region_name && (
        <p className="text-text-sm text-gray-500">
          Serving {agency.region_name}
          {agency.city ? `, ${agency.city}` : ""}
        </p>
      )}

      <p className="text-text-sm text-gray-600 mt-4 leading-relaxed max-w-xl">
        A real person who can walk you through every benefit you qualify
        for — for free.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <a
          href={`tel:${agency.phone}`}
          aria-label={`Call ${agency.name} at ${agency.phone}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
        >
          Call {agency.phone}
        </a>
        {agency.website && (
          <a
            href={agency.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${agency.name} website (opens in new tab)`}
            className="text-text-sm font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
          >
            Visit website &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
