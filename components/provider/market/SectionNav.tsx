"use client";

import { useEffect, useState } from "react";

/**
 * Sticky section nav with scroll-spy — wayfinding for the long diagnostic.
 * Desktop only; highlights the section nearest the top of the viewport.
 */
export default function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24 space-y-0.5">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block text-[13px] py-1.5 pl-3 border-l-2 transition-colors ${
              active === s.id
                ? "border-[#199087] text-stone-900 font-medium"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
