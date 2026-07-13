"use client";

import { useState } from "react";

interface StaffScreeningListProps {
  items: string[];
  initialCount?: number;
}

// ── Icon components (thin-line, 24×24 viewBox) ──

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconMedical({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconEducation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c-.025.399.18.78.52.97a47.834 47.834 0 0 1 8.713 5.466 1.502 1.502 0 0 0 1.744 0 47.834 47.834 0 0 1 8.713-5.466c.34-.19.545-.571.52-.97a23.838 23.838 0 0 0-1.012-5.434m-15.186 0A23.92 23.92 0 0 1 12 6c2.95 0 5.764.533 8.37 1.507" />
    </svg>
  );
}

// ── Screening → Icon mapping (case-insensitive keyword match) ──

type IconComponent = ({ className }: { className?: string }) => React.JSX.Element;

const SCREENING_ICON_MAP: [RegExp, IconComponent][] = [
  // Background checks
  [/(background|criminal|record)/i, IconShield],
  // Drug testing
  [/(drug|substance|test)/i, IconMedical],
  // Reference checks
  [/(reference|work history|employment)/i, IconDocument],
  // Licensing / certification
  [/(licens|certif|credential)/i, IconBadge],
  // Training / education
  [/(train|educat|orient|competenc)/i, IconEducation],
  // Insured / bonded
  [/(insur|bond|liab)/i, IconShield],
  // Verified / identity
  [/(verif|identity|id check)/i, IconUser],
  // Health / TB / COVID
  [/(health|tb|covid|immuniz|vaccin)/i, IconMedical],
];

function getScreeningIcon(item: string): IconComponent {
  for (const [pattern, Icon] of SCREENING_ICON_MAP) {
    if (pattern.test(item)) return Icon;
  }
  return IconCheck;
}

// ── Component ──

export default function StaffScreeningList({
  items,
  initialCount = 6,
}: StaffScreeningListProps) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = items.length > initialCount;
  const visible =
    needsExpand && !expanded ? items.slice(0, initialCount) : items;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
        {visible.map((item) => {
          const Icon = getScreeningIcon(item);
          return (
            <div key={item} className="flex items-center gap-4 py-1.5">
              <Icon className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <span className="text-[15px] text-gray-700">{item}</span>
            </div>
          );
        })}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full md:w-auto mt-6 px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${items.length} screening methods`}
        </button>
      )}
    </div>
  );
}
