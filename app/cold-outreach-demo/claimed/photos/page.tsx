"use client";

import Image from "next/image";
import Link from "next/link";

// Same mock images as the main claimed page
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
  "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=80",
  "https://images.unsplash.com/photo-1576765974257-b414b9e8f8ce?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
];

const MOCK_PROVIDER = {
  name: "Emerald Oaks Senior Living",
};

export default function PhotosGalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/cold-outreach-demo/claimed"
              className="flex items-center gap-2 text-gray-900 hover:bg-gray-100 rounded-full p-2 -ml-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
                </svg>
                Share
              </button>
              <button className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Photos of {MOCK_PROVIDER.name}
        </h1>

        {/* 3-column grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MOCK_IMAGES.map((src, index) => (
            <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image
                src={src}
                alt={`${MOCK_PROVIDER.name} photo ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
