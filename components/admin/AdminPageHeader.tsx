import Link from "next/link";
import { Fragment, type ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned slot for page-level actions (buttons, search, date pickers). */
  actions?: ReactNode;
  /** Optional breadcrumb links rendered above the title. */
  breadcrumbs?: Breadcrumb[];
}

/**
 * Shared admin page header — serif display title over a muted sans
 * description, with a right-aligned actions slot. Matches the Benefits
 * page heading style (the design direction for the admin dashboard).
 */
export default function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.href}>
                {i > 0 && <span>·</span>}
                <Link href={crumb.href} className="hover:text-gray-600">
                  {crumb.label}
                </Link>
              </Fragment>
            ))}
          </div>
        )}
        <h1 className="text-display-xs font-bold text-gray-900 font-serif">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
