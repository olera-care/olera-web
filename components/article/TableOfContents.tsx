"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticleHeading } from "@/lib/article-html";

interface TableOfContentsProps {
  headings: ArticleHeading[];
}

// ─── Desktop TOC (sticky sidebar) ───────────────────────────

export function DesktopTableOfContents({ headings }: TableOfContentsProps) {
  const activeId = useActiveHeading(headings);

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Table of Contents
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => smoothScroll(e, h.id)}
              className={`
                block text-sm py-1 border-l-2 transition-colors duration-200
                pl-3
                ${
                  activeId === h.id
                    ? "border-primary-600 text-gray-900 font-medium"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }
              `}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Mobile TOC (collapsible panel) ─────────────────────────

export function MobileTableOfContents({ headings }: TableOfContentsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8 border border-gray-200 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
      >
        <span>Table of Contents</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1 border-t border-gray-100">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  smoothScroll(e, h.id);
                  setOpen(false);
                }}
                className={`
                  block text-sm py-1.5 text-gray-500 hover:text-gray-900 transition-colors
                `}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Scroll tracking hook ───────────────────────────────────

function useActiveHeading(headings: ArticleHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    // Clean up previous observer
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-96px 0px -70% 0px",
      }
    );

    observerRef.current = observer;

    // Observe all heading elements
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

// ─── Smooth scroll helper ───────────────────────────────────

function smoothScroll(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    // Update URL hash without jumping
    window.history.replaceState(null, "", `#${id}`);
  }
}
