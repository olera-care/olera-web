"use client";

/**
 * v9.0 Phase 3: MedjobsCard — the canonical card skeleton used by every
 * row card in the MedJobs surface. One typography scale, one spacing,
 * one chrome (white bg, gray-200 border, rounded-lg, px-4 py-3), one
 * pill tone (single slate), one CTA tone (emerald).
 *
 * Structure:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Title (sm font-medium gray-900)              ⋯ overflow │
 *   │ Subtitle (xs gray-500)                                  │
 *   │ Footnote (text-[11px] gray-400)                         │
 *   │ Pill (single-tone slate)                                │
 *   │                                              [Primary]  │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Specialty card variants (ClientCard, CandidateCard, etc.) compose
 * this by passing the title / subtitle / footnote / pill / cta /
 * overflow slots — never override the chrome itself. This keeps the
 * design language consistent and prevents per-tab drift.
 */

import type { ReactNode } from "react";

export interface MedjobsCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  footnote?: ReactNode;
  pill?: ReactNode;
  cta?: ReactNode;
  overflowMenu?: ReactNode;
  /** Optional accessory rendered inline next to the title (e.g. tel: link). */
  titleAccessory?: ReactNode;
  /** Whole-card click handler. Pass undefined for non-interactive cards. */
  onClick?: () => void;
  /** Tooltip on the card body. */
  hoverTitle?: string;
  /** When set, render the card as an <a> element (external links open new tab). */
  href?: string;
}

export function MedjobsCard({
  title,
  subtitle,
  footnote,
  pill,
  cta,
  overflowMenu,
  titleAccessory,
  onClick,
  hoverTitle,
  href,
}: MedjobsCardProps) {
  const baseClass =
    "rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
  const interactiveClass =
    onClick || href ? `${baseClass} cursor-pointer hover:bg-gray-50` : baseClass;

  const body = (
    <div className="flex items-stretch justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{title}</p>
          {titleAccessory}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
        )}
        {footnote && (
          <div className="mt-0.5 text-[11px] text-gray-400">{footnote}</div>
        )}
        {pill && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{pill}</div>
        )}
      </div>
      {(cta || overflowMenu) && (
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className="flex items-center">{overflowMenu}</div>
          <div className="flex items-center">{cta}</div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`block ${interactiveClass}`}
        title={hoverTitle}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {body}
      </a>
    );
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        title={hoverTitle}
        className={interactiveClass}
      >
        {body}
      </div>
    );
  }

  return <div className={interactiveClass}>{body}</div>;
}
