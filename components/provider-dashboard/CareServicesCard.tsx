import type { Profile } from "@/lib/types";
import DashboardSectionCard from "./DashboardSectionCard";
import CareServicesList from "@/components/providers/CareServicesList";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface CareServicesCardProps {
  profile: Profile;
  completionPercent: number;
}

export default function CareServicesCard({
  profile,
  completionPercent,
}: CareServicesCardProps) {
  const services: string[] = [...(profile.care_types ?? [])];

  return (
    <DashboardSectionCard
      title="Care Services"
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>}
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
