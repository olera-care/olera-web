import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface CertificationsCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function CertificationsCard({
  metadata,
  completionPercent,
  onEdit,
}: CertificationsCardProps) {
  const certifications = metadata.certifications || [];

  return (
    <DashboardSectionCard
      title="Certifications"
      completionPercent={completionPercent}
      id="certifications"
      onEdit={onEdit}
    >
      {certifications.length === 0 ? (
        <SectionEmptyState
          icon="clipboard"
          message="No certifications added"
          subMessage="Add your certifications to build trust with families and organizations."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-secondary-50 text-secondary-700 border border-secondary-200"
            >
              <svg className="w-3.5 h-3.5 text-secondary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {cert}
            </span>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  );
}
