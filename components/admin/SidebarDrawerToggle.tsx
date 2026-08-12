"use client";

interface SidebarDrawerToggleProps {
  direction: "open" | "close";
  onClick: () => void;
  floating?: boolean;
}

export default function SidebarDrawerToggle({
  direction,
  onClick,
  floating = false,
}: SidebarDrawerToggleProps) {
  const isOpening = direction === "open";
  const label = isOpening ? "Show admin navigation" : "Hide admin navigation";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400",
        "transition-[color,background-color,border-color,box-shadow,transform] duration-150",
        "hover:bg-gray-100 hover:text-gray-700 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        floating
          ? "border border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:bg-white hover:shadow-md"
          : "border border-transparent",
      ].join(" ")}
    >
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        aria-hidden="true"
      >
        <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
        <path d="M9 4v16" />
        <path
          d={isOpening ? "m13.5 9 3 3-3 3" : "m16.5 9-3 3 3 3"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
