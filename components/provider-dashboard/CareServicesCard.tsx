import type { Profile } from "@/lib/types";
import DashboardSectionCard from "./DashboardSectionCard";
import CareServicesList from "@/components/providers/CareServicesList";
import SectionEmptyState from "@/components/providers/SectionEmptyState";
import { getCategoryServices } from "@/lib/provider-utils";

interface CareServicesCardProps {
  profile: Profile;
  completionPercent: number;
}

export default function CareServicesCard({
  profile,
  completionPercent,
}: CareServicesCardProps) {
  // Build services: real data first, then pad with category-inferred
  const services: string[] = [...(profile.care_types ?? [])];
  if (profile.category) {
    const inferred = getCategoryServices(profile.category);
    const existing = new Set(services.map((s) => s.toLowerCase()));
    for (const s of inferred) {
      if (!existing.has(s.toLowerCase())) services.push(s);
    }
  }

  return (
    <DashboardSectionCard
      title="Care Services"
      completionPercent={completionPercent}
      id="services"
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
