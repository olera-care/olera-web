"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/medjobs/assignments";

/**
 * Who owns this task type.
 *
 * Sits on a section header inside a university. A solid first name when
 * somebody owns it; a faint "+ assign" when nobody does, so an unowned
 * section is something the eye skips rather than something it stops on.
 *
 * The header row it lives in is a button — expand and collapse — so every
 * click here stops propagating. Without that, opening the menu also toggles
 * the section underneath it.
 */
export default function AssigneeChip({
  people,
  value,
  onChange,
  busy,
}: {
  /** The MedJobs team. Already narrowed and sorted by the board route. */
  people: Person[];
  /** Who owns it now, or null. */
  value: Person | null;
  /** Null unassigns. */
  onChange: (personId: string | null) => void;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (id: string | null) => {
    setOpen(false);
    // Picking who already owns it is not a change, and writing it anyway
    // would move assigned_at for nothing.
    if ((value?.id ?? null) === id) return;
    onChange(id);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        title={value ? `${value.name} owns this` : "Nobody owns this yet"}
        className={`rounded-full border px-2 py-0.5 text-[11.5px] transition-colors disabled:opacity-50 ${
          value
            ? "border-gray-200 bg-gray-50 font-medium text-gray-700 hover:bg-gray-100"
            : "border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
        }`}
      >
        {value ? value.name : "+ assign"}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-md border border-gray-200 bg-white py-0.5 shadow-lg">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                pick(p.id);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50 ${
                p.id === value?.id ? "font-semibold text-primary-700" : "text-gray-700"
              }`}
            >
              {p.name}
            </button>
          ))}
          {value && (
            <>
              <div className="my-0.5 border-t border-gray-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pick(null);
                }}
                className="block w-full px-3 py-1.5 text-left text-[12.5px] text-gray-500 hover:bg-gray-50"
              >
                Unassign
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
