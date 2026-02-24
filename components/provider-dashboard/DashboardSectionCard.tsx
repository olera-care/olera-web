import type { ReactNode } from "react";

interface DashboardSectionCardProps {
  title: string;
  completionPercent?: number;
  children: ReactNode;
  id?: string;
}

export default function DashboardSectionCard({
  title,
  completionPercent,
  children,
  id,
}: DashboardSectionCardProps) {
  return (
    <section
      id={id}
      className="bg-white rounded-xl border border-gray-100 p-6"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2.5">
          {/* Pencil icon (non-functional in Phase 1) */}
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label={`Edit ${title}`}
          >
            <svg
              className="w-4 h-4"
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
          {/* Completion percentage */}
          {completionPercent != null && (
            <span className="text-xs font-semibold text-primary-600">
              {completionPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </section>
  );
}
