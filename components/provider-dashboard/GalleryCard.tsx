import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";

interface GalleryCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
  onEdit?: () => void;
}

export default function GalleryCard({
  metadata,
  completionPercent,
  onEdit,
}: GalleryCardProps) {
  const images = metadata.images || [];

  return (
    <DashboardSectionCard
      title="Gallery"
      completionPercent={completionPercent}
      id="gallery"
      onEdit={onEdit}
    >
      {images.length === 0 ? (
        <button
          type="button"
          onClick={onEdit}
          className="group w-full flex items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-primary-300 hover:bg-primary-25 transition-all duration-200 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[15px] font-semibold text-gray-800">Add photos</p>
            <p className="text-sm text-gray-400">Upload images to showcase your facility</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Gallery photo ${i + 1}`}
              className="rounded-lg object-cover aspect-square w-full shadow-xs hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            />
          ))}
          {/* Add more */}
          <button
            type="button"
            onClick={onEdit}
            className="group rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center aspect-square hover:border-primary-300 hover:bg-primary-25 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      )}
    </DashboardSectionCard>
  );
}
