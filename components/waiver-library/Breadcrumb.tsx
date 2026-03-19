import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: "light" | "dark";
  centered?: boolean;
}

export function Breadcrumb({ items, variant = "light", centered = false }: BreadcrumbProps) {
  const isDark = variant === "dark";

  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex items-center flex-wrap gap-1 text-sm ${isDark ? "text-white/70" : "text-gray-500"} ${centered ? "justify-center" : ""}`}>
        {items.map((item, index) => {
          const isCurrent = item.current === true;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className={`${isDark ? "text-white/50" : "text-gray-400"} select-none`} aria-hidden="true">
                  ›
                </span>
              )}
              {isCurrent ? (
                <span
                  className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={`${isDark ? "hover:text-white" : "hover:text-primary-600"} transition-colors`}
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
