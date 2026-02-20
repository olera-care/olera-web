"use client";

import type { AreaAgency } from "@/lib/types/benefits";

interface AAACardProps {
  agency: AreaAgency;
}

export default function AAACard({ agency }: AAACardProps) {
  return (
    <div className="border-2 border-primary-400 bg-primary-50/40 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-1">
            Your Local Resource
          </p>
          <h3 className="text-lg font-bold text-gray-900">{agency.name}</h3>
        </div>
        <span className="text-2xl">📞</span>
      </div>

      {agency.region_name && (
        <p className="text-sm text-gray-600 mb-2">
          Serving {agency.region_name}
          {agency.city ? `, ${agency.city}` : ""}
        </p>
      )}

      <p className="text-sm text-gray-700 mb-3">
        Talk to a real person who can walk you through every benefit
        you qualify for — for free.
      </p>

      {agency.services_offered && agency.services_offered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agency.services_offered.slice(0, 6).map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {agency.what_to_say && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            What to say when you call:
          </p>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            &ldquo;{agency.what_to_say}&rdquo;
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${agency.phone}`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold no-underline hover:bg-primary-500 transition-colors"
        >
          📞 Call {agency.phone}
        </a>
        {agency.website && (
          <a
            href={agency.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-sm font-medium no-underline hover:bg-gray-50 transition-colors"
          >
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
}
