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
    <div className="hidden md:block bg-blue-50/60 border border-blue-100 rounded-xl -mx-1">
      <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3 px-4">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`whitespace-nowrap text-[15px] rounded-lg px-3 py-1.5 transition-all cursor-pointer border ${
                isActive
                  ? "text-gray-900 font-semibold bg-white shadow-sm border-gray-200"
                  : "text-gray-500 border-transparent hover:text-gray-900 hover:bg-white/80 hover:border-gray-200 hover:shadow-sm"
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
