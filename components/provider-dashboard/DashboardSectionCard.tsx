import type { ReactNode } from "react";

interface DashboardSectionCardProps {
  title: string;
  icon?: ReactNode;
  completionPercent?: number;
  children: ReactNode;
  id?: string;
  onEdit?: () => void;
}

export default function DashboardSectionCard({
  title,
  icon,
  completionPercent,
  children,
  id,
  onEdit,
}: DashboardSectionCardProps) {
  return (
    <section
      id={id}
      className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300"
    >
      {/* Header row — hidden when no title and no icon (e.g. ProfileOverviewCard) */}
      {(title || icon) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-display font-bold text-gray-900 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Edit icon */}
            <button
              type="button"
              onClick={onEdit}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
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
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                completionPercent >= 100
                  ? "bg-success-50 text-success-700"
                  : "bg-primary-50 text-primary-700"
              }`}>
                {completionPercent}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </section>
  );
}
