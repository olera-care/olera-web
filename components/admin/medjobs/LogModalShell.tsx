"use client";

/**
 * v9.0 Phase 7 Commit F: canonical Log modal chrome.
 *
 * Shared shell for the operational Log modals (LogCall, LogMeeting,
 * ReplyClassifier, AddStakeholderTask, MarkPartner). Backdrop +
 * centered card + header (title + entity subtitle) + scrollable
 * body + footer slot. Inline error rendering at the top of the body.
 *
 * Each modal supplies:
 *   - title:    short verb ("Log call outcome", "Log meeting", "Add step")
 *   - subtitle: entity context line ("Org · Contact · Phone")
 *   - error:    inline error string (shown above body if present)
 *   - footer:   action buttons (Cancel + primary, sometimes plus a
 *               secondary like "Mark as partner")
 *   - children: form fields
 *
 * Width defaults to max-w-lg (most modals); pass `size="md"` for the
 * narrower max-w-md variant (used by the lighter AddStakeholderTask
 * modal).
 *
 * The shell handles backdrop click → onCancel and prevents propagation
 * from the inner card. ESC handling is left to each modal (most don't
 * need it since the backdrop click pattern covers exit).
 */

import type { ReactNode } from "react";

interface LogModalShellProps {
  title: string;
  subtitle?: ReactNode;
  error?: string | null;
  footer: ReactNode;
  children: ReactNode;
  onCancel: () => void;
  size?: "md" | "lg";
}

export function LogModalShell({
  title,
  subtitle,
  error,
  footer,
  children,
  onCancel,
  size = "lg",
}: LogModalShellProps) {
  const widthClass = size === "md" ? "max-w-md" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className={`w-full ${widthClass} rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </header>

        <div className="space-y-3 px-6 py-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {children}
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          {footer}
        </footer>
      </div>
    </div>
  );
}
