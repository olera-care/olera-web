import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import ExpandableText from "@/components/providers/ExpandableText";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface AboutCardProps {
  profile: Profile;
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function AboutCard({
  profile,
  metadata,
  completionPercent,
  onEdit,
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
      onEdit={onEdit}
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
            <div className={`flex flex-wrap gap-2.5 ${description ? "pt-3 border-t border-gray-100" : ""}`}>
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
    <div className="flex flex-col items-center justify-center rounded-xl bg-warm-25 border border-warm-100/60 px-4 py-2.5 min-w-[80px]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-[17px] font-bold text-gray-900 mt-0.5">{value}</span>
    </div>
  );
}
