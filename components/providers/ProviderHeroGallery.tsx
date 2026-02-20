import { getInitials, formatCategory } from "@/lib/provider-utils";
import type { ProfileCategory } from "@/lib/types";

interface ProviderHeroGalleryProps {
  images: string[];
  providerName: string;
  category: ProfileCategory | null;
}

export default function ProviderHeroGallery({ images, providerName, category }: ProviderHeroGalleryProps) {
  const categoryLabel = formatCategory(category);

  // 0 images — gradient placeholder with avatar circle + hint
  if (images.length === 0) {
    return (
      <div className="w-full max-w-md aspect-[3/2] rounded-2xl bg-gradient-to-br from-primary-100 via-primary-50 to-warm-50 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-3 shadow-sm">
          <span className="text-3xl font-bold text-primary-400">
            {getInitials(providerName)}
          </span>
        </div>
        {categoryLabel && (
          <span className="text-sm font-medium text-primary-400">{categoryLabel}</span>
        )}
        <span className="text-xs text-primary-300 mt-1">No photos yet</span>
      </div>
    );
  }

  // 1+ images — single image with photo count badge
  return (
    <div className="relative w-full max-w-md aspect-[3/2] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
      <img
        src={images[0]}
        alt={providerName}
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          1/{images.length}
        </span>
      )}
    </div>
  );
}
