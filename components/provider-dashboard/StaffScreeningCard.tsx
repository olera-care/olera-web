import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface StaffScreeningCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

const SCREENING_ITEMS = [
  { key: "background_checked" as const, label: "Background Checked" },
  { key: "licensed" as const, label: "Licensed" },
  { key: "insured" as const, label: "Insured" },
];

export default function StaffScreeningCard({
  metadata,
  completionPercent,
  onEdit,
}: StaffScreeningCardProps) {
  const screening = metadata.staff_screening;

  return (
    <DashboardSectionCard
      title="Staff Screening"
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
      completionPercent={completionPercent}
      id="screening"
      onEdit={onEdit}
    >
      {!screening ? (
        <SectionEmptyState
          icon="info"
          message="No staff screening information"
          subMessage="Add details about background checks, licensing, and insurance."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SCREENING_ITEMS.map(({ key, label }) => {
            const isActive = screening[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-xl p-4 ${
                  isActive
                    ? "bg-primary-50/80 border border-primary-200/50 shadow-xs shadow-primary-500/[0.03]"
                    : "bg-gray-50/80 border border-gray-200/50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isActive ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[15px] font-medium ${
                    isActive ? "text-primary-700" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
