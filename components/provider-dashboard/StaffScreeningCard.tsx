import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface StaffScreeningCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
}

const SCREENING_ITEMS = [
  { key: "background_checked" as const, label: "Background Checked" },
  { key: "licensed" as const, label: "Licensed" },
  { key: "insured" as const, label: "Insured" },
];

export default function StaffScreeningCard({
  metadata,
  completionPercent,
}: StaffScreeningCardProps) {
  const screening = metadata.staff_screening;

  return (
    <DashboardSectionCard
      title="Staff Screening"
      completionPercent={completionPercent}
      id="screening"
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
            const isActive = screening.includes(key);
            return (
              <div
                key={key}
                className={`flex items-center gap-3 rounded-xl p-4 ${
                  isActive
                    ? "bg-primary-50 border border-primary-100"
                    : "bg-gray-50 border border-gray-100"
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
