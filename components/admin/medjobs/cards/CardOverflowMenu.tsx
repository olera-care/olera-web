"use client";

/**
 * v9.0 Phase 7 Commit C: lightweight overflow menu for entity cards
 * (Site / Client / Candidate / ProviderProspect). The stakeholder
 * RowCard has its own richer OverflowMenu in StakeholderCard.tsx with
 * a two-step Stop Outreach picker — that lives there because it's
 * coupled to the stakeholder state machine.
 *
 * This menu is the simpler base case: a list of label/onClick items
 * with optional `tone` for visual differentiation (default | danger |
 * celebration). Click outside or Esc closes the menu.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface CardOverflowItem {
  label: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger" | "celebration";
}

export function CardOverflowMenu({ items }: { items: CardOverflowItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label="More actions"
        title="More actions"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs ${
                item.tone === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : item.tone === "celebration"
                    ? "text-primary-700 hover:bg-primary-50"
                    : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
