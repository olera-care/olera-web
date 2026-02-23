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
              className="rounded-lg object-cover aspect-square w-full"
            />
          ))}
          {/* Add new photos placeholder */}
          <div className="rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center aspect-square hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-gray-400"
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
            <span className="text-xs text-gray-400 font-medium">
              Add new photos
            </span>
          </div>
        </div>
      )}
    </DashboardSectionCard>
  );
}
