"use client";

import type { ReactNode } from "react";

interface SplitViewLayoutProps {
  /** Master panel (list, tabs, etc.) */
  left: ReactNode;
  /** Detail panel — null shows the emptyState on desktop */
  right: ReactNode | null;
  /** Controls mobile view: non-null = show detail, null = show list */
  selectedId: string | null;
  /** Mobile back button handler */
  onBack: () => void;
  /** Shown on desktop when no item is selected */
  emptyState?: ReactNode;
  /** Mobile back button label. Default: "Back" */
  backLabel?: string;
  /** When true, left panel takes full width when nothing is selected (no empty state shown) */
  expandWhenEmpty?: boolean;
  /** When true, left and right panels share equal width (50/50) instead of 480px fixed left */
  equalWidth?: boolean;
}

export default function SplitViewLayout({
  left,
  right,
  selectedId,
  onBack,
  emptyState,
  backLabel = "Back",
  expandWhenEmpty = false,
  equalWidth = false,
}: SplitViewLayoutProps) {
  const hasSelection = selectedId !== null;
  const isExpanded = expandWhenEmpty && !hasSelection;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Left: Master / primary content ── */}
      <div
        className={`
          h-full overflow-y-auto
          ${hasSelection
            ? `hidden lg:block ${equalWidth ? "lg:w-1/2" : "lg:w-[480px]"} lg:shrink-0`
            : ""}
          ${isExpanded
            ? "w-full"
            : !hasSelection
              ? `w-full ${equalWidth ? "lg:w-1/2" : "lg:w-[480px]"} lg:shrink-0 lg:block`
              : ""}
        `}
      >
        {left}
      </div>

      {/* ── Right: Detail panel ── */}
      {!isExpanded && (
        <div
          className={`
            w-full ${equalWidth ? "lg:w-1/2" : "lg:flex-1"} lg:block
            h-full overflow-y-auto
            border-l border-gray-200
            bg-white
            ${hasSelection ? "block" : "hidden lg:block"}
          `}
        >
          {/* Mobile back button */}
          {hasSelection && (
            <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2.5">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {backLabel}
              </button>
            </div>
          )}

          {right ?? (
            <div className="hidden lg:flex h-full items-center justify-center">
              {emptyState ?? (
                <div className="text-center px-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Select a connection</p>
                  <p className="text-xs text-gray-500 mt-1">Choose a connection from the list to view details</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
