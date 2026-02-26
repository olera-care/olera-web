import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";
import CareServicesList from "@/components/providers/CareServicesList";

interface StaffScreeningCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function StaffScreeningCard({
  metadata,
  completionPercent,
  onEdit,
}: StaffScreeningCardProps) {
  const screenings = Array.isArray(metadata.staff_screening) ? metadata.staff_screening : [];

  return (
    <DashboardSectionCard
      title="Staff Screening"
      completionPercent={completionPercent}
      id="screening"
      onEdit={onEdit}
    >
      {screenings.length === 0 ? (
        <SectionEmptyState
          icon="info"
          message="No staff screening information"
          subMessage="Add details about background checks, licensing, and insurance."
        />
      ) : (
        <CareServicesList services={screenings} initialCount={12} />
      )}
    </DashboardSectionCard>
  );
}
