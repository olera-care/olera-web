import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { SEASON_LABELS, getSeasonalStatusLabel, getCurrentSeasonKey } from "@/lib/medjobs-helpers";

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

const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export default function AvailabilityCard({ meta, onEdit }: AvailabilityCardProps) {
  const hasStatement = !!(meta.commitment_statement && meta.commitment_statement.length >= 50);
  const hasSeasonalAvailability = meta.year_round_availability && Object.keys(meta.year_round_availability).length > 0;
  const hasPledges = meta.prn_willing || meta.advance_notice_pledge;
  const hasNotes = !!meta.availability_notes;

  // Consider complete if has statement OR has seasonal availability
  const hasCommitment = hasStatement || hasSeasonalAvailability;

  const currentSeason = getCurrentSeasonKey();

  // Get short status label for compact display
  const getShortStatus = (status: string) => {
    const map: Record<string, string> = {
      full_time: "Full-time",
      classes_see_schedule: "Classes",
      part_time: "Part-time",
      planning_classes: "TBD",
      out_of_town: "Away",
      graduating: "Graduating",
      pending: "Pending",
    };
    return map[status] || status;
  };

  return (
    <CaregiverSectionCard
      title="Availability & Commitment"
      isComplete={hasCommitment}
      id="availability"
      onEdit={onEdit}
    >
      {!hasStatement && !hasSeasonalAvailability ? (
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
          {/* Commitment statement preview */}
          {meta.commitment_statement && (
            <div>
              <p className="text-[15px] text-gray-600 line-clamp-3">
                {meta.commitment_statement}
              </p>
              {!hasStatement && (
                <p className="text-xs text-amber-500 mt-1.5">
                  Needs at least 50 characters ({meta.commitment_statement.length}/50)
                </p>
              )}
            </div>
          )}

          {/* Year-round availability */}
          {hasSeasonalAvailability && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2.5">Seasonal availability</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEASONS.map((season) => {
                  const data = meta.year_round_availability?.[season] as { status?: string; year?: number } | undefined;
                  const isCurrent = season === currentSeason;
                  return (
                    <div
                      key={season}
                      className={`rounded-lg px-3 py-2 ${
                        isCurrent ? "bg-gray-100 ring-1 ring-gray-300" : "bg-gray-50"
                      }`}
                    >
                      <p className={`text-[11px] font-medium ${
                        isCurrent ? "text-gray-700" : "text-gray-500"
                      }`}>
                        {SEASON_LABELS[season]}
                        {isCurrent && <span className="text-primary-600 ml-1">(now)</span>}
                      </p>
                      <p className={`text-sm font-semibold mt-0.5 ${
                        data?.status ? "text-gray-900" : "text-gray-400"
                      }`}>
                        {data?.status ? getShortStatus(data.status) : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pledges */}
          {hasPledges && (
            <div className="flex flex-wrap gap-2 pt-2">
              {meta.prn_willing && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">On-call available</span>
              )}
              {meta.advance_notice_pledge && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">Keeps schedule updated</span>
              )}
            </div>
          )}

          {/* Additional notes */}
          {hasNotes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {meta.availability_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
