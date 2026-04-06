import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";

interface BackgroundCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

const EXPERIENCE_LABELS: Record<number, string> = {
  0: "New to caregiving",
  1: "1-2 years experience",
  3: "3+ years experience",
};

export default function BackgroundCard({ meta, onEdit }: BackgroundCardProps) {
  const hasExperience = meta.years_caregiving != null;
  const hasCareTypes = (meta.care_experience_types?.length ?? 0) > 0;
  const hasLanguages = (meta.languages?.length ?? 0) > 0;
  const hasCerts = (meta.certifications?.length ?? 0) > 0;
  const isComplete = hasExperience && hasCareTypes && hasLanguages;

  const hasAnyData = hasExperience || hasCareTypes || hasLanguages || hasCerts;

  return (
    <CaregiverSectionCard
      title="Experience & Background"
      isComplete={isComplete}
      id="background"
      onEdit={onEdit}
    >
      {!hasAnyData ? (
        <EmptyState
          message="No background info"
          subMessage="Add your experience, certifications, and languages."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Experience level — single prominent line */}
          {hasExperience && (
            <p className="text-sm font-medium text-gray-900">
              {EXPERIENCE_LABELS[meta.years_caregiving as number] || `${meta.years_caregiving} years experience`}
            </p>
          )}

          {/* All tags in one flowing section — unified gray style */}
          <div className="flex flex-wrap gap-1.5">
            {/* Certifications first (most important) */}
            {hasCerts && meta.certifications!.map((cert) => (
              <span key={cert} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {cert}
              </span>
            ))}
            {/* Care types */}
            {hasCareTypes && meta.care_experience_types!.slice(0, 4).map((type) => (
              <span key={type} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                {type}
              </span>
            ))}
            {hasCareTypes && meta.care_experience_types!.length > 4 && (
              <span className="text-xs px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full">
                +{meta.care_experience_types!.length - 4} more
              </span>
            )}
          </div>

          {/* Languages — separate line with icon */}
          {hasLanguages && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
              <span>{meta.languages!.join(", ")}</span>
            </div>
          )}

          {/* Missing items indicator */}
          {!isComplete && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-amber-600">
                Missing: {!hasExperience && "experience level"}{!hasExperience && (!hasCareTypes || !hasLanguages) && ", "}
                {!hasCareTypes && "care types"}{!hasCareTypes && !hasLanguages && ", "}
                {!hasLanguages && "languages"}
              </p>
            </div>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
