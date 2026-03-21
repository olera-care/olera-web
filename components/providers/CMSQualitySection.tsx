"use client";

import type { CMSData } from "@/lib/types";

interface CMSQualitySectionProps {
  cmsData: CMSData;
}

const SOURCE_LABELS: Record<string, string> = {
  home_health: "Home Health",
  nursing_home: "Nursing Home",
  hospice: "Hospice",
};

function StarRating({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${i <= rating ? "text-blue-600" : "text-gray-200"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{rating}/5</span>
      </div>
    </div>
  );
}

export default function CMSQualitySection({ cmsData }: CMSQualitySectionProps) {
  if (!cmsData.overall_rating) return null;

  const sourceLabel = SOURCE_LABELS[cmsData.source] || cmsData.source;

  return (
    <section id="quality" className="scroll-mt-24">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <h2 className="font-serif text-xl font-bold text-gray-900">
            Quality &amp; Safety
          </h2>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Medicare {sourceLabel} quality ratings from CMS
        </p>

        <div className="space-y-3">
          <StarRating rating={cmsData.overall_rating} label="Overall Quality" />

          {cmsData.source === "nursing_home" && (
            <>
              {cmsData.health_inspection_rating != null && (
                <StarRating rating={cmsData.health_inspection_rating} label="Health Inspections" />
              )}
              {cmsData.staffing_rating != null && (
                <StarRating rating={cmsData.staffing_rating} label="Staffing" />
              )}
              {cmsData.quality_rating != null && (
                <StarRating rating={cmsData.quality_rating} label="Quality Measures" />
              )}
            </>
          )}
        </div>

        {/* Safety flags for nursing homes */}
        {cmsData.source === "nursing_home" && (cmsData.deficiency_count ?? 0) > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              {cmsData.deficiency_count} health {cmsData.deficiency_count === 1 ? "deficiency" : "deficiencies"} noted
              {(cmsData.penalty_count ?? 0) > 0 && ` · ${cmsData.penalty_count} ${cmsData.penalty_count === 1 ? "fine" : "fines"}`}
              {(cmsData.total_fines ?? 0) > 0 && ` ($${cmsData.total_fines!.toLocaleString()})`}
            </p>
          </div>
        )}

        <a
          href="https://www.medicare.gov/care-compare/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          Data from Medicare.gov
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </section>
  );
}
