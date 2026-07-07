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
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
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
    handleScroll();
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
    <div className="hidden md:block sticky top-0 z-30 bg-gray-50 border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 max-w-7xl mx-auto">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`whitespace-nowrap text-[15px] px-4 py-2 transition-all cursor-pointer border-b-2 ${
                isActive
                  ? "text-gray-900 font-semibold border-gray-900"
                  : "text-gray-900 font-medium border-transparent hover:border-gray-300"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
