import { getInitials, formatCategory } from "@/lib/provider-utils";
import type { ProfileCategory } from "@/lib/types";

interface ProviderHeroGalleryProps {
  images: string[];
  providerName: string;
  category: ProfileCategory | null;
}

export default function ProviderHeroGallery({ images, providerName, category }: ProviderHeroGalleryProps) {
  const categoryLabel = formatCategory(category);

  // 0 images — gradient placeholder with initials
  if (images.length === 0) {
    return (
      <div className="h-[280px] rounded-xl bg-gradient-to-br from-primary-100 via-primary-50 to-warm-50 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-primary-300 mb-2">
          {getInitials(providerName)}
        </span>
        {categoryLabel && (
          <span className="text-sm font-medium text-primary-400">{categoryLabel}</span>
        )}
      </div>
    );
  }

  // 1 image — single image
  if (images.length === 1) {
    return (
      <div className="h-[280px] rounded-xl overflow-hidden">
        <img
          src={images[0]}
          alt={providerName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 2+ images — grid layout: main ~65% + thumbnails ~35%
  const mainImage = images[0];
  const thumbs = images.slice(1, 4);
  const remaining = images.length - 4;

  return (
    <div className="h-[280px] rounded-xl overflow-hidden grid grid-cols-3 gap-1.5">
      {/* Main image — spans 2 columns */}
      <div className="col-span-2 h-full">
        <img
          src={mainImage}
          alt={providerName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails stack */}
      <div className="col-span-1 h-full flex flex-col gap-1.5">
        {thumbs.map((src, i) => {
          const isLast = i === thumbs.length - 1 && remaining > 0;
          return (
            <div key={i} className="relative flex-1 min-h-0">
              <img
                src={src}
                alt={`${providerName} ${i + 2}`}
                className="w-full h-full object-cover"
              />
              {isLast && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">+{remaining} more</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
