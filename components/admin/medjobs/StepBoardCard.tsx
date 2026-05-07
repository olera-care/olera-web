"use client";

/**
 * v9.0 Phase 7 Commit F: StepBoardCard — canonical row card for the
 * Step Board section in any drawer (stakeholder or entity).
 *
 * One chrome, one typography scale. Matches the row-card MedjobsCard
 * shape (white bg, gray-200 border, rounded-lg, headline + subtitle
 * + footnote + pill on the left; overflow + CTA stacked on the
 * right). The `muted` variant fades the card for passive scheduled
 * items (stakeholder cadence steps).
 *
 * Both the stakeholder TaskBoardSection (Drawer.tsx) and the
 * EntityStepBoard (Site / Client / Candidate drawers) compose this —
 * each fills the slots with kind-specific content, but the chrome is
 * shared so the Step Board feels identical everywhere.
 */

import type { ReactNode } from "react";

interface StepBoardCardProps {
  headline: ReactNode;
  subtitle?: ReactNode;
  footnote?: ReactNode;
  pill?: ReactNode;
  overflow?: ReactNode;
  cta?: ReactNode;
  /** Lighter chrome for passive/scheduled items. Stakeholder mode
   *  uses this to render cadence steps below the actionable ones. */
  muted?: boolean;
}

export function StepBoardCard({
  headline,
  subtitle,
  footnote,
  pill,
  overflow,
  cta,
  muted,
}: StepBoardCardProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        muted ? "border-gray-100 bg-gray-50/60" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${muted ? "text-gray-700" : "text-gray-900"}`}>
            {headline}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
          )}
          {footnote && (
            <p className="mt-0.5 text-[11px] text-gray-400">{footnote}</p>
          )}
          {pill && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{pill}</div>
          )}
        </div>
        {(overflow || cta) && (
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            {overflow ?? <span />}
            {cta ?? <span />}
          </div>
        )}
      </div>
    </div>
  );
}
