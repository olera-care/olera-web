"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
}

interface ProgramTabsProps {
  tabs: Tab[];
}

export function ProgramTabs({ tabs }: ProgramTabsProps) {
  const pathname = usePathname();

  if (tabs.length <= 1) return null;

  return (
    <nav
      aria-label="Program sections"
      className="sticky top-0 z-30 bg-white border-b border-gray-200"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex gap-6 -mb-px overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const normalizedPath = pathname.replace(/\/$/, "");
            const normalizedHref = tab.href.replace(/\/$/, "");
            const isActive =
              normalizedPath === normalizedHref ||
              (tab.href !== tabs[0].href && normalizedPath.startsWith(normalizedHref + "/"));
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`inline-block py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
