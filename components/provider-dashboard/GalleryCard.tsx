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
      icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>}
      completionPercent={completionPercent}
      id="gallery"
      onEdit={onEdit}
    >
      {images.length === 0 ? (
        <div className="group/dropzone cursor-pointer">
          {/* Upload drop zone — visual grid with main drop area + thumbnail placeholders */}
          <div className="grid grid-cols-3 gap-3">
            {/* Main upload area — spans 2 cols and 2 rows */}
            <div className="col-span-2 row-span-2 rounded-2xl border-2 border-dashed border-primary-200 bg-gradient-to-br from-primary-25 via-vanilla-50 to-warm-25 flex flex-col items-center justify-center py-14 px-6 transition-all duration-300 group-hover/dropzone:border-primary-400 group-hover/dropzone:bg-gradient-to-br group-hover/dropzone:from-primary-50 group-hover/dropzone:via-vanilla-50 group-hover/dropzone:to-warm-25 group-hover/dropzone:shadow-md group-hover/dropzone:shadow-primary-500/[0.06]">
              {/* Camera icon */}
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm border border-primary-100/60 transition-transform duration-300 group-hover/dropzone:scale-110">
                <svg className="w-7 h-7 text-primary-500 transition-colors duration-300 group-hover/dropzone:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-gray-800 mb-1">Upload photos</p>
              <p className="text-sm text-gray-500 text-center leading-relaxed">Drag and drop or click to browse</p>
              <div className="mt-4 px-4 py-2 rounded-lg bg-white border border-primary-200/60 text-sm font-medium text-primary-600 shadow-xs transition-all duration-200 group-hover/dropzone:bg-primary-50 group-hover/dropzone:border-primary-300 group-hover/dropzone:shadow-sm">
                Choose files
              </div>
            </div>

            {/* Placeholder thumbnail slots */}
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-vanilla-50/50 flex flex-col items-center justify-center aspect-square transition-colors duration-300 group-hover/dropzone:border-gray-300">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-vanilla-50/50 flex flex-col items-center justify-center aspect-square transition-colors duration-300 group-hover/dropzone:border-gray-300">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">PNG, JPG up to 10MB each</p>
        </div>
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
