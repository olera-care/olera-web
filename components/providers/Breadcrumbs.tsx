import Link from "next/link";
import type { Crumb } from "@/lib/provider-breadcrumbs";

/**
 * Visible breadcrumb trail on a provider page. The crumbs come from
 * lib/provider-breadcrumbs.ts, the same list the page's BreadcrumbList
 * JSON-LD is built from, so the two cannot drift apart.
 */

function Chevron() {
  return (
    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const last = crumbs.length - 1;
  return (
    <nav className="hidden md:flex items-center gap-2 text-sm mb-2 flex-wrap" aria-label="Breadcrumb">
      {crumbs.map((c, i) =>
        i === last ? (
          <span key={c.href} className="text-gray-900 font-medium truncate max-w-[300px]">
            {c.name}
          </span>
        ) : (
          <span key={c.href} className="contents">
            {i > 0 && <Chevron />}
            <Link href={c.href} className="text-gray-500 hover:text-gray-700 transition-colors">
              {c.name}
            </Link>
          </span>
        ),
      )}
      {crumbs.length > 1 && <Chevron />}
    </nav>
  );
}
