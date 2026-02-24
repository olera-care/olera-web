import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface GalleryCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
}

export default function GalleryCard({
  metadata,
  completionPercent,
}: GalleryCardProps) {
  const images = metadata.images || [];

  return (
    <DashboardSectionCard
      title="Gallery"
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
      completionPercent={completionPercent}
      id="gallery"
    >
      {images.length === 0 ? (
        <SectionEmptyState
          icon="clipboard"
          message="No photos yet"
          subMessage="Add images to showcase your facility and attract more families."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Gallery photo ${i + 1}`}
              className="rounded-xl object-cover aspect-square w-full shadow-xs hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            />
          ))}
          {/* Add new photos placeholder */}
          <div className="group/upload rounded-xl border-2 border-dashed border-primary-200/50 flex flex-col items-center justify-center aspect-square hover:border-primary-300 hover:bg-primary-25 transition-all duration-300 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mb-2 group-hover/upload:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-primary-500">
              Add new photos
            </span>
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
