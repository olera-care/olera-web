"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only sticky scroll-spy chip strip for the long diagnostic (desktop uses the SectionNav
 * sidebar). Rendered *after* the competition hero so the headline leads; it sits in flow under
 * the hero, then sticks to the top once you scroll past it — in-page wayfinding for the four
 * sections without burying the hook. Translucent so content blurs behind it (iOS pattern).
 */
export default function MobileSectionNav({ sections }: { sections: { id: string; label: string }[] }) {
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
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <div className="lg:hidden sticky top-0 z-30 -mx-4 sm:-mx-6 my-6 border-y border-stone-200/70 bg-white/85 px-4 sm:px-6 py-2 backdrop-blur-md">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors active:scale-[0.97] ${
              active === s.id ? "bg-[#199087]/10 text-[#199087]" : "text-stone-500"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
