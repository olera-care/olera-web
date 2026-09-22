import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { getActualCertifications, hasNoCertificationsMarker } from "@/lib/medjobs-helpers";

interface CertificationsCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

export default function CertificationsCard({ meta, onEdit }: CertificationsCardProps) {
  const actualCerts = getActualCertifications(meta.certifications);
  const hasNoCertsMarker = hasNoCertificationsMarker(meta.certifications);
  const hasCerts = actualCerts.length > 0;

  // Section is complete if they have certs OR explicitly marked "no certs"
  const isComplete = hasCerts || hasNoCertsMarker;

  return (
    <CaregiverSectionCard
      title="Certifications"
      isComplete={isComplete}
      id="certifications"
      onEdit={onEdit}
    >
      {hasNoCertsMarker && !hasCerts ? (
        // They explicitly said "no certifications"
        <p className="text-sm text-gray-500 italic">No certifications yet</p>
      ) : !hasCerts ? (
        <EmptyState
          message="No certifications added"
          subMessage="Add any certifications you have, or let us know if you don't have any yet."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {actualCerts.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
            >
              {cert}
            </span>
          ))}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
