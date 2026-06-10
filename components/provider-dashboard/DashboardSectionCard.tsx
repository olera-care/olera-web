import type { ReactNode } from "react";

interface DashboardSectionCardProps {
  title: string;
  completionPercent?: number;
  children: ReactNode;
  id?: string;
  onEdit?: () => void;
}

export default function DashboardSectionCard({
  title,
  completionPercent,
  children,
  id,
  onEdit,
}: DashboardSectionCardProps) {
  return (
    <section
      id={id}
      // Mobile: chromeless — no box, no border, no rounding. Sections are
      // delineated by whitespace + a hairline (the parent's divide-y), the way
      // a narrow screen already separates content (Airbnb trip / Apple Settings
      // / Notion). py gives each section its breathing room. Desktop keeps the
      // carded surface where the two-column layout has room for it.
      className="py-7 lg:p-6 lg:bg-white lg:rounded-2xl lg:border lg:border-gray-200/80 lg:hover:border-gray-300 lg:transition-all lg:duration-300"
    >
      {/* Header row — hidden when no title (e.g. ProfileOverviewCard) */}
      {title && (
        <div className="flex items-center justify-between mb-4 lg:mb-5">
          <h3 className="text-[22px] lg:text-[24px] font-display font-bold text-gray-900 truncate min-w-0">{title}</h3>
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Edit — a quiet "Edit" text link on mobile (one less box), the
                circular pencil button on desktop. */}
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center text-gray-900 transition-all min-h-[44px] px-1.5 active:opacity-70 lg:min-h-0 lg:px-0 lg:w-8 lg:h-8 lg:rounded-full lg:border lg:border-gray-200 lg:hover:text-primary-600 lg:hover:border-primary-300 lg:hover:bg-primary-50"
              aria-label={`Edit ${title}`}
            >
              <span className="lg:hidden text-sm font-semibold text-primary-600">Edit</span>
              <svg
                className="hidden lg:block w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </button>
            {/* Completion status — a "Done" check reads as progress while
                scrolling the card stack; incomplete sections keep the teal % so
                the eye lands on what's left to do. */}
            {completionPercent != null && (
              completionPercent >= 100 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-success-50 text-success-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700">
                  {completionPercent}%
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </section>
  );
}
