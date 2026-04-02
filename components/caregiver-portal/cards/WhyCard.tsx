import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";

interface WhyCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

export default function WhyCard({ meta, onEdit }: WhyCardProps) {
  const hasWhy = !!(meta.why_caregiving && meta.why_caregiving.length >= 100);
  const charCount = meta.why_caregiving?.length || 0;

  return (
    <CaregiverSectionCard
      title="Why I Want to Be a Caregiver"
      isComplete={hasWhy}
      id="why"
      onEdit={onEdit}
    >
      {!meta.why_caregiving ? (
        <EmptyState
          message="No statement yet"
          subMessage="Share what draws you to caregiving."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-4">
            {meta.why_caregiving}
          </p>
          {charCount < 100 && (
            <p className="text-xs text-amber-500">
              {100 - charCount} more characters needed
            </p>
          )}
          {charCount >= 100 && (
            <p className="text-xs text-gray-400">
              {charCount} characters
            </p>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
