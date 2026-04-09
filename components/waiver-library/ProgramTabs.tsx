"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProgramTabsProps {
  basePath: string;
}

export function ProgramTabs({ basePath }: ProgramTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "About", href: basePath },
    { label: "Eligibility", href: `${basePath}/eligibility` },
    { label: "How to Apply", href: `${basePath}/apply` },
    { label: "Resources", href: `${basePath}/resources` },
  ];

  const activeIndex = Math.max(
    tabs.findIndex((tab) =>
      tab.href === basePath ? pathname === basePath : pathname === tab.href
    ),
    0
  );

  return (
    <div className="sticky top-0 z-30 bg-vanilla-100 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav>
          <ul className="flex gap-6 sm:gap-8 overflow-x-auto">
            {tabs.map((tab, i) => {
              const isActive = i === activeIndex;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    className={`relative inline-flex items-center py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? "text-primary-700"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary-600 rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
