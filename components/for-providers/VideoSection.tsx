"use client";

import { useState } from "react";
import Image from "next/image";

const YOUTUBE_ID = "kbKOG8vmJl0";

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900 text-center mb-4">
          See how it works
        </h2>
        <p className="text-center text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
          Watch how providers use Olera to reach families and grow their business.
        </p>

        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-900 shadow-xl shadow-gray-900/10">
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
              title="See how Olera works for providers"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full cursor-pointer group"
            >
              <Image
                src={`https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
                alt="Watch: See how Olera works for providers"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 896px, 100vw"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary-600/90 group-hover:bg-primary-700/90 flex items-center justify-center transition-colors shadow-lg">
                  <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
