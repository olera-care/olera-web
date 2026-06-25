"use client";

import Image from "next/image";

// ============================================================
// Types
// ============================================================

export type AmenityIcon =
  | "fitness"
  | "social"
  | "services"
  | "safety"
  | "pet"
  | "meals"
  | "housekeeping"
  | "transportation"
  | "maintenance"
  | "concierge"
  | "community"
  | "recreation"
  | "independent";

export interface AmenityCategory {
  heading: string;
  icon: AmenityIcon;
  items: string[];
}

interface AmenitiesSectionProps {
  categories: AmenityCategory[];
  /** Optional highlight photo shown above the cards */
  highlightPhoto?: { src: string; alt: string; caption?: string };
}

// ============================================================
// Icons — one per item row
// ============================================================

function ItemIcon({ icon, className }: { icon: AmenityIcon; className?: string }) {
  const cls = className ?? "w-5 h-5 text-white shrink-0";
  switch (icon) {
    case "fitness":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    case "social":
    case "community":
    case "recreation":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case "services":
    case "concierge":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      );
    case "safety":
    case "independent":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "pet":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.35 3c1.18 0 2.13.95 2.13 2.13 0 1.18-.95 2.13-2.13 2.13C7.17 7.26 6.22 6.31 6.22 5.13 6.22 3.95 7.17 3 8.35 3zm7.3 0c1.18 0 2.13.95 2.13 2.13 0 1.18-.95 2.13-2.13 2.13-1.18 0-2.13-.95-2.13-2.13C13.52 3.95 14.47 3 15.65 3zM4.57 8.3c1.18 0 2.13.95 2.13 2.13 0 1.18-.95 2.13-2.13 2.13C3.39 12.56 2.44 11.61 2.44 10.43 2.44 9.25 3.39 8.3 4.57 8.3zm14.86 0c1.18 0 2.13.95 2.13 2.13 0 1.18-.95 2.13-2.13 2.13-1.18 0-2.13-.95-2.13-2.13 0-1.18.95-2.13 2.13-2.13zM12 13.96c2.28 0 4.35 1.13 5.6 2.86.42.58.17 1.4-.5 1.68-1.6.68-3.33 1.06-5.1 1.06s-3.5-.38-5.1-1.06c-.67-.28-.92-1.1-.5-1.68 1.25-1.73 3.32-2.86 5.6-2.86z" />
        </svg>
      );
    case "meals":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 3.75V16.5" />
        </svg>
      );
    case "housekeeping":
    case "maintenance":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "transportation":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
  }
}

// ============================================================
// Main section
// ============================================================

export default function AmenitiesSection({ categories, highlightPhoto }: AmenitiesSectionProps) {
  if (categories.length === 0) return null;

  // Rich mode: at least one category has specific items
  const hasDetailedItems = categories.some((c) => c.items.length > 0);

  if (hasDetailedItems) {
    const visible = categories.filter((c) => c.items.length > 0);

    // Split into two columns for balanced layout
    const left: AmenityCategory[] = [];
    const right: AmenityCategory[] = [];
    let leftCount = 0;
    let rightCount = 0;
    for (const cat of visible) {
      if (leftCount <= rightCount) {
        left.push(cat);
        leftCount += cat.items.length;
      } else {
        right.push(cat);
        rightCount += cat.items.length;
      }
    }

    const renderCard = (cat: AmenityCategory) => (
      <div key={cat.heading} className="rounded-xl border border-gray-200 overflow-hidden px-5 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <ItemIcon icon={cat.icon} className="w-5 h-5 text-teal-600 shrink-0" />
          <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">{cat.heading}</h3>
        </div>
        <div>
          <ul className="space-y-3">
            {cat.items.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

    return (
      <div id="amenities" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">Amenities</h2>

        {/* Highlight photo */}
        {highlightPhoto && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <div className="relative aspect-[16/6] w-full">
              <Image
                src={highlightPhoto.src}
                alt={highlightPhoto.alt}
                fill
                className="object-cover" style={{ objectPosition: "center 20%" }}
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
            {highlightPhoto.caption && (
              <p className="text-sm text-gray-500 mt-2">{highlightPhoto.caption}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            {left.map(renderCard)}
          </div>
          <div className="space-y-4">
            {right.map(renderCard)}
          </div>
        </div>
      </div>
    );
  }

  // Sparse mode: no items, just category labels with icons
  return (
    <div id="amenities" className="py-8 scroll-mt-20 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Care Services</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {categories.map((cat) => (
          <div key={cat.heading} className="flex items-center gap-3">
            <ItemIcon icon={cat.icon} className="w-6 h-6 text-gray-400 shrink-0" />
            <span className="text-base text-gray-700">{cat.heading}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
