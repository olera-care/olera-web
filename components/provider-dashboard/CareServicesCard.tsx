import type { Profile } from "@/lib/types";
import DashboardSectionCard from "./DashboardSectionCard";
import CareServicesList from "@/components/providers/CareServicesList";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface CareServicesCardProps {
  profile: Profile;
  completionPercent: number;
  onEdit?: () => void;
}

export default function CareServicesCard({
  profile,
  completionPercent,
  onEdit,
}: CareServicesCardProps) {
  const services: string[] = Array.isArray(profile.care_types) ? [...profile.care_types] : [];

  return (
    <DashboardSectionCard
      title="Care Services"
      completionPercent={completionPercent}
      id="services"
      onEdit={onEdit}
    >
      {services.length === 0 ? (
        <SectionEmptyState
          icon="clipboard"
          message="No care services listed"
          subMessage="Add the services your organization provides."
        />
      ) : (
        <CareServicesList services={services} initialCount={12} />
      )}
    </DashboardSectionCard>
  );
}
