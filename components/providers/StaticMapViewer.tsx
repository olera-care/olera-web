"use client";

import { useState } from "react";
import Image from "next/image";

interface StaticMapViewerProps {
  src: string;
  alt: string;
}

export default function StaticMapViewer({ src, alt }: StaticMapViewerProps) {
  const [scale, setScale] = useState(1);

  const zoomIn = () => setScale((s) => Math.min(s + 0.3, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.3, 1));

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-[240px]">
      {/* Map image with zoom */}
      <div className="w-full h-full overflow-hidden">
        <div
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
