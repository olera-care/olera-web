"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function DesktopToc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-96px 0px -80% 0px" }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        On this page
      </p>
      <ul className="space-y-2 border-l border-gray-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm transition-colors ${
                h.level === 3 ? "pl-6" : "pl-4"
              } ${
                activeId === h.id
                  ? "text-gray-900 font-medium border-l-2 border-primary-600 -ml-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileToc({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8 border border-gray-200 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
      >
        On this page
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1.5 border-t border-gray-100">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={() => setOpen(false)}
                className={`block text-sm text-gray-500 hover:text-gray-700 ${
                  h.level === 3 ? "pl-4" : ""
                }`}
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function useAutoHeadingIds(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [headings, setHeadings] = useState<TocHeading[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const nodes = el.querySelectorAll("h2, h3");
    const usedIds = new Map<string, number>();
    const extracted: TocHeading[] = [];

    nodes.forEach((node) => {
      const text = node.textContent?.trim() || "";
      let id = slugify(text) || "heading";

      const count = usedIds.get(id) ?? 0;
      usedIds.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;

      node.setAttribute("id", id);
      extracted.push({
        id,
        text,
        level: node.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(extracted);
  }, [containerRef]);

  return headings;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headings = useAutoHeadingIds(contentRef);
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-5 lg:flex lg:gap-16">
        {/* Left column */}
        <div className="flex-1 max-w-[680px]">
          <header className="pt-8 md:pt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>

            <h1 className="font-display text-display-sm md:text-display-md text-gray-900 tracking-[-0.02em] mb-3">
              {title}
            </h1>

            <div className="text-sm text-gray-400 mb-10">
              Last Updated: {lastUpdated}
            </div>
          </header>

          <article>
            <MobileToc headings={headings} />
            <div ref={contentRef} className="prose-editorial">
              {children}
            </div>
          </article>

          <div className="pb-16" />
        </div>

        {/* Desktop TOC sidebar */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0">
          <div className="sticky top-[96px] pt-4">
            <DesktopToc headings={headings} />
          </div>
        </aside>
      </div>
    </main>
  );
}
