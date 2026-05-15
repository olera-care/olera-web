"use client";

import { useState, useEffect, useCallback } from "react";

export interface SectionItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  sections: SectionItem[];
  /** Distance (px) from top to consider a section "active". Defaults to 120. */
  offset?: number;
}

export default function SectionNav({
  sections,
  offset = 120,
}: SectionNavProps) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Show the section nav after the user scrolls past the identity / image area
  // We use 400px as threshold — roughly past the breadcrumbs + name + image
  const SCROLL_THRESHOLD = 400;

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;

    // Visibility
    setVisible(scrollY > SCROLL_THRESHOLD);

    // Active section detection — find the last section whose top is above the offset line
    let current: string | null = null;
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          current = section.id;
        }
      }
    }
    setActiveId(current);
  }, [sections, offset]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - (offset - 20);
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[51] transition-all duration-300 hidden md:block ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Section tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px h-full">
              {sections.map((section) => {
                const isSectionActive = activeId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`relative whitespace-nowrap px-3 py-2 text-[14px] font-medium transition-colors h-full flex items-center ${
                      isSectionActive
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {section.label}
                    {/* Active underline */}
                    {isSectionActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gray-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
