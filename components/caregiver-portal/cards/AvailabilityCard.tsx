import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";

interface AvailabilityCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-warm-25 border border-warm-100/60 px-4 py-2.5 min-w-[80px]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-[17px] font-bold text-gray-900 mt-0.5">{value}</span>
    </div>
  );
}

export default function AvailabilityCard({ meta, onEdit }: AvailabilityCardProps) {
  const hasCommitment = !!(
    meta.hours_per_week_range &&
    meta.commitment_statement &&
    meta.commitment_statement.length >= 50
  );

  const hasHours = !!meta.hours_per_week_range;
  const hasStatement = !!(meta.commitment_statement && meta.commitment_statement.length >= 50);
  const hasDuration = !!meta.duration_commitment;

  // Format duration for display
  const formatDuration = (d: string) => {
    return d.replace(/_/g, " ").replace(/less than/, "<").replace(/to/g, "–").replace(/ months?/, "mo");
  };

  return (
    <CaregiverSectionCard
      title="Availability & Commitment"
      isComplete={hasCommitment}
      id="availability"
      onEdit={onEdit}
    >
      {!hasHours && !hasStatement ? (
        <EmptyState
          message="No availability info"
          subMessage="Tell providers about your commitment to caregiving."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Detail pills */}
          {(hasHours || hasDuration) && (
            <div className="flex flex-wrap gap-2.5">
              {meta.hours_per_week_range && (
                <DetailPill label="Hours/Week" value={meta.hours_per_week_range} />
              )}
              {meta.duration_commitment && (
                <DetailPill label="Commitment" value={formatDuration(meta.duration_commitment)} />
              )}
            </div>
          )}

          {/* Commitment statement preview */}
          {meta.commitment_statement && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[15px] text-gray-600 line-clamp-2">
                {meta.commitment_statement}
              </p>
              {!hasStatement && (
                <p className="text-xs text-amber-500 mt-1.5">
                  Needs at least 50 characters ({meta.commitment_statement.length}/50)
                </p>
              )}
            </div>
          )}

          {/* Pledges */}
          {(meta.prn_willing || meta.advance_notice_pledge) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {meta.prn_willing && (
                <span className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">PRN willing</span>
              )}
              {meta.advance_notice_pledge && (
                <span className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">Schedule pledge</span>
              )}
            </div>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
