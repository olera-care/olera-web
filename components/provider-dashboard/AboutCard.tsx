import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import ExpandableText from "@/components/providers/ExpandableText";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface AboutCardProps {
  profile: Profile;
  metadata: ExtendedMetadata;
  completionPercent: number;
}

export default function AboutCard({
  profile,
  metadata,
  completionPercent,
}: AboutCardProps) {
  const description = profile.description || null;

  const yearFounded = metadata.year_founded;
  const bedCount = metadata.bed_count;
  const staffCount = metadata.staff_count;
  const licenseNumber = metadata.license_number;

  const hasDetails = yearFounded || bedCount || staffCount || licenseNumber;

  return (
    <DashboardSectionCard
      title="About"
      completionPercent={completionPercent}
      id="about"
    >
      {!description && !hasDetails ? (
        <SectionEmptyState
          icon="info"
          message="No about information"
          subMessage="Tell families what makes your organization special."
        />
      ) : (
        <div className="space-y-4">
          {description && (
            <ExpandableText text={description} maxLength={200} />
          )}
          {hasDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {yearFounded && (
                <DetailPill label="Founded" value={String(yearFounded)} />
              )}
              {bedCount && (
                <DetailPill label="Beds" value={String(bedCount)} />
              )}
              {staffCount && (
                <DetailPill label="Staff" value={String(staffCount)} />
              )}
              {licenseNumber && (
                <DetailPill label="License" value={licenseNumber} />
              )}
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{value}</p>
    </div>
  );
}
