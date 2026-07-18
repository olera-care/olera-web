"use client";

/**
 * ReorderableSections — drag-and-reorder wrapper for a page's stack of
 * CollapsibleSections. The order persists in localStorage (per page) so the
 * operator can pin what matters most to the top — e.g. the by-type table —
 * and that curation survives reloads, same as the collapse state.
 *
 * Usage: wrap the sections directly — no per-item boilerplate. Each child's
 * identity is its `storageKey` prop (every CollapsibleSection already has
 * one), so conditional children ({flag && <Section/>}) stay stable.
 *
 * Mechanics: each section gets a grip that appears on hover (top-right of the
 * header). Only a drag that starts on the grip arms the wrapper's draggable —
 * so header clicks, text selection, and in-section controls keep working.
 * Native HTML5 drag events, no library; desktop-only by nature (admin page).
 *
 * New sections that aren't in the saved order slot in at their natural
 * position; removed sections simply drop out of the saved list.
 */

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

const STORAGE_PREFIX = "olera.adminSections.order.";

/** Saved order wins for keys it knows; unknown (new) keys keep their natural position. */
function mergeOrder(natural: string[], saved: string[]): string[] {
  const result = saved.filter((k) => natural.includes(k));
  natural.forEach((k, i) => {
    if (!result.includes(k)) result.splice(Math.min(i, result.length), 0, k);
  });
  return result;
}

export default function ReorderableSections({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  // SSR-safe: render natural order until the first effect reads localStorage
  // (same hydration pattern as CollapsibleSection).
  const [saved, setSaved] = useState<string[]>([]);
  const [dragKey, setDragKey] = useState<string | null>(null);
  // Key whose grip is currently pressed — only then is that wrapper draggable.
  const [armed, setArmed] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) {
          setSaved(parsed);
        }
      }
    } catch {
      // localStorage blocked — natural order stands.
    }
  }, [storageKey]);

  const kids = Children.toArray(children).filter((c): c is ReactElement => isValidElement(c));
  const keyOf = (el: ReactElement, i: number): string => {
    const sk = (el.props as Record<string, unknown>).storageKey;
    return typeof sk === "string" ? sk : `idx-${i}`;
  };
  const items = kids.map((el, i) => ({ key: keyOf(el, i), node: el }));
  const order = mergeOrder(items.map((it) => it.key), saved);
  const byKey = new Map(items.map((it) => [it.key, it]));

  // Persist on drop, not on every dragover reshuffle.
  const orderRef = useRef(order);
  orderRef.current = order;
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(orderRef.current));
    } catch {
      // silent — same fallback as above
    }
  };

  // Live reorder while dragging. Midpoint rule keeps heterogeneous heights
  // stable: moving down only swaps past a target's midpoint, moving up only
  // before it — otherwise tall sections oscillate under the cursor.
  const onDragOverItem = (e: React.DragEvent<HTMLDivElement>, overKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragKey || dragKey === overKey) return;
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    if (from < 0 || to < 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pastMidpoint = e.clientY > rect.top + rect.height / 2;
    if ((from < to && !pastMidpoint) || (from > to && pastMidpoint)) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    setSaved(next);
  };

  return (
    <div>
      {order.map((k) => {
        const item = byKey.get(k);
        if (!item) return null;
        return (
          <div
            key={k}
            className={`group/reorder relative transition-opacity ${dragKey === k ? "opacity-50" : ""}`}
            draggable={armed === k}
            onDragStart={(e) => {
              setDragKey(k);
              e.dataTransfer.effectAllowed = "move";
              try {
                e.dataTransfer.setData("text/plain", k);
              } catch {
                // some browsers throw on setData — cosmetic, drag still works
              }
            }}
            onDragEnd={() => {
              setDragKey(null);
              setArmed(null);
              persist();
            }}
            onDragOver={(e) => onDragOverItem(e, k)}
            onDrop={(e) => e.preventDefault()}
          >
            <div
              role="button"
              aria-label="Drag to reorder this section"
              title="Drag to reorder"
              onMouseDown={() => setArmed(k)}
              onMouseUp={() => setArmed(null)}
              className={`absolute right-4 top-4 z-10 cursor-grab active:cursor-grabbing rounded-md p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition ${
                dragKey === k ? "opacity-100" : "opacity-0 group-hover/reorder:opacity-100"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="9" cy="5" r="1.7" />
                <circle cx="15" cy="5" r="1.7" />
                <circle cx="9" cy="12" r="1.7" />
                <circle cx="15" cy="12" r="1.7" />
                <circle cx="9" cy="19" r="1.7" />
                <circle cx="15" cy="19" r="1.7" />
              </svg>
            </div>
            {item.node}
          </div>
        );
      })}
    </div>
  );
}
