"use client";

import { useState } from "react";
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
  | "independent"
  | "languages";

export interface AmenityCategory {
  heading: string;
  icon: AmenityIcon;
  items: string[];
}

interface AmenitiesSectionProps {
  categories: AmenityCategory[];
  /** Optional highlight photo shown above the cards */
  highlightPhoto?: { src: string; alt: string; caption?: string };
  /** Optional action element rendered inline with the title (e.g. View Photos button) */
  headerAction?: React.ReactNode;
}

// ============================================================
// Icons — one per item row
// ============================================================

function ItemIcon({ icon, className }: { icon: AmenityIcon; className?: string }) {
  const cls = className ?? "w-5 h-5 text-white shrink-0";
  switch (icon) {
    case "fitness":
      // Dumbbell / weight
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h1.5v6h-1.5a1.5 1.5 0 01-1.5-1.5v-3A1.5 1.5 0 013.75 9zm15 0h1.5a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-1.5V9zM5.25 7.5h1.5v9h-1.5a1.5 1.5 0 01-1.5-1.5V9a1.5 1.5 0 011.5-1.5zm12 0h1.5A1.5 1.5 0 0120.25 9v6a1.5 1.5 0 01-1.5 1.5h-1.5v-9zM6.75 11.25h10.5v1.5H6.75v-1.5z" />
        </svg>
      );
    case "social":
    case "community":
      // People / group
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case "recreation":
      // Puzzle piece / game
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.657-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
      );
    case "services":
    case "concierge":
      // Concierge bell
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 3v1.5m0 0h1.5m-1.5 0h-1.5M4.5 18.75h15A2.25 2.25 0 0021.75 16.5v-.75a.75.75 0 00-.75-.75H3a.75.75 0 00-.75.75v.75a2.25 2.25 0 002.25 2.25zM3.75 15h16.5A8.25 8.25 0 0012 6.75 8.25 8.25 0 003.75 15z" />
        </svg>
      );
    case "safety":
    case "independent":
      // Shield check
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "pet":
      // Paw print
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.5 11.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-2.5 3c1.66 0 3 1.34 3 3 0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1 0-1.66 1.34-3 3-3zm-2-3c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
        </svg>
      );
    case "meals":
      // Fork and knife
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 3.75V16.5" />
        </svg>
      );
    case "housekeeping":
    case "maintenance":
      // Wrench / tool
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 5.1a2.121 2.121 0 01-3-3l5.1-5.1m2.998-2.998a6.002 6.002 0 018.485-1.06c.18.15.34.318.485.497m-9.97.563l2.998 2.998m4.787-7.243A5.96 5.96 0 0118 9.75c0 .88-.19 1.714-.531 2.465M18 9.75a5.97 5.97 0 00-1.785-4.257" />
        </svg>
      );
    case "transportation":
      // Bus / vehicle
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "languages":
      // Globe
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.777.515-3.43 1.404-4.822" />
        </svg>
      );
  }
}

// ============================================================
// Amenity Card — shows 4 items, expandable
// ============================================================

function AmenityCard({ cat }: { cat: AmenityCategory }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 6;
  const hasMore = cat.items.length > limit;
  const visible = expanded ? cat.items : cat.items.slice(0, limit);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden px-5 py-4">
      <div className="flex items-center gap-2.5 mb-3">
        <ItemIcon icon={cat.icon} className="w-5 h-5 text-teal-600 shrink-0" />
        <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">{cat.heading}</h3>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {visible.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[15px] text-gray-800">{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
        >
          {expanded ? "Show less" : `See all (${cat.items.length})`}
          <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================
// Main section
// ============================================================

export default function AmenitiesSection({ categories, highlightPhoto, headerAction }: AmenitiesSectionProps) {
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
      <AmenityCard key={cat.heading} cat={cat} />
    );

    return (
      <div id="amenities" className="py-8 scroll-mt-20 border-t border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Amenities & Lifestyle
          </h2>
          {headerAction}
        </div>

        {/* Highlight photo */}
        {highlightPhoto && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <div className="relative aspect-[16/5] w-full max-h-[220px]">
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
