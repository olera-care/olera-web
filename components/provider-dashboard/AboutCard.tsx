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
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-3">
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
  const isCapacity = label === "Beds" || label === "Staff";
  return (
    <div className={`rounded-xl px-4 py-3.5 text-center border transition-colors duration-200 ${
      isCapacity
        ? "bg-warm-25 border-warm-100/60 hover:border-warm-200"
        : "bg-primary-25 border-primary-100/40 hover:border-primary-200"
    }`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-display font-bold tracking-tight ${
        isCapacity ? "text-warm-700" : "text-primary-800"
      }`}>{value}</p>
    </div>
  );
}
