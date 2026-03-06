import type { Profile } from "@/lib/types";
import DashboardSectionCard from "./DashboardSectionCard";
import CareServicesList from "@/components/providers/CareServicesList";
import SectionEmptyState from "@/components/providers/SectionEmptyState";
import { CAREGIVER_SKILL_LABELS } from "@/lib/constants/caregiver-skills";

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
  const isCaregiver = profile.type === "caregiver";
  const rawServices: string[] = Array.isArray(profile.care_types) ? [...profile.care_types] : [];
  const services = rawServices.map((s) => CAREGIVER_SKILL_LABELS[s] || s);

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
          subMessage={isCaregiver ? "Add the services you offer." : "Add the services your organization provides."}
        />
      ) : (
        <CareServicesList services={services} initialCount={12} />
      )}
    </DashboardSectionCard>
  );
}
