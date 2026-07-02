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
    <div className="hidden md:block bg-gray-50/80 border border-gray-200 rounded-xl">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2.5 px-4">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`whitespace-nowrap text-sm px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "text-gray-900 font-semibold bg-white shadow-sm"
                  : "text-gray-500 font-medium hover:text-gray-900"
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
