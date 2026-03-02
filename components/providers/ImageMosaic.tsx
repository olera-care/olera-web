"use client";

import { useState } from "react";
import Image from "next/image";
import ImageGallery from "./ImageGallery";

interface ImageMosaicProps {
  images: string[];
  alt: string;
  initials?: string;
  className?: string;
}

export default function ImageMosaic({
  images,
  alt,
  initials = "?",
  className = "",
}: ImageMosaicProps) {
  const [showGallery, setShowGallery] = useState(false);

  // No images — subtle gradient fallback
  if (images.length === 0) {
    return (
      <div
        className={`h-[400px] rounded-xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center ${className}`}
      >
        <span className="text-display-lg font-bold text-gray-200 select-none">
          {initials}
        </span>
      </div>
    );
  }

  // 1 image — full width
  if (images.length === 1) {
    return (
      <>
        <div
          className={`h-[400px] rounded-xl overflow-hidden cursor-pointer group ${className}`}
          onClick={() => setShowGallery(true)}
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {showGallery && (
          <ImageGallery
            images={images}
            alt={alt}
            onClose={() => setShowGallery(false)}
          />
        )}
      </>
    );
  }

  // 2 images — 50/50 split
  if (images.length === 2) {
    return (
      <>
        <div
          className={`h-[400px] grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden cursor-pointer ${className}`}
          onClick={() => setShowGallery(true)}
        >
          {images.map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={img}
                alt={`${alt} ${i + 1}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-700"
                sizes="50vw"
              />
            </div>
          ))}
        </div>
        {showGallery && (
          <ImageGallery
            images={images}
            alt={alt}
            onClose={() => setShowGallery(false)}
          />
        )}
      </>
    );
  }

  // 3+ images — Airbnb-style asymmetric: 1 large left (50%) + 2 stacked right (50%)
  // 4+ images — 1 large left (50%) + 2x2 grid right (50%)
  return (
    <>
      <div
        className={`h-[420px] grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden cursor-pointer ${className}`}
        onClick={() => setShowGallery(true)}
      >
        {/* Hero image — left half, full height */}
        <div className="relative overflow-hidden">
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover hover:scale-[1.02] transition-transform duration-700"
            sizes="50vw"
          />
        </div>

        {/* Right half */}
        <div className={`grid ${images.length >= 4 ? "grid-cols-2 grid-rows-2" : "grid-rows-2"} gap-1.5`}>
          {images.slice(1, images.length >= 4 ? 5 : 3).map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={img}
                alt={`${alt} ${i + 2}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-700"
                sizes="25vw"
              />
              {/* Show count overlay on last image if there are more */}
              {i === (images.length >= 4 ? 3 : 1) && images.length > (images.length >= 4 ? 5 : 3) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors">
                  <span className="text-text-sm font-semibold text-white">
                    +{images.length - (images.length >= 4 ? 5 : 3)} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {showGallery && (
        <ImageGallery
          images={images}
          alt={alt}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
