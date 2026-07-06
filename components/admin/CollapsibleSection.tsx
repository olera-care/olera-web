"use client";

/**
 * CollapsibleSection — uniform header + collapse mechanism for the
 * /admin/analytics page sections. Each section's open/closed state
 * persists in localStorage so the operator's curation survives page
 * reloads. The page-level Expand-all / Collapse-all toolbar dispatches
 * a window event that every mounted section listens for, so the
 * mechanic stays per-section (no shared store) without sacrificing
 * one-click bulk control.
 *
 * forceOpen: when truthy on first mount, the section opens regardless of
 * stored state — used to keep a deep-linked drill-in (e.g. ?variant=outreach)
 * visible even if the operator had previously collapsed that section. The
 * collapse toggle remains clickable after mount; otherwise URL params that
 * the section itself maintains (e.g. ?comms_filter=) would lock the section
 * open as soon as the operator interacts with any in-section control.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: ReactNode;
  storageKey: string;
  defaultCollapsed: boolean;
  loading?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
}

const STORAGE_PREFIX = "olera.adminAnalytics.collapsed.";
const BULK_EVENT = "olera:analytics-collapse-bulk";

export default function CollapsibleSection({
  title,
  storageKey,
  defaultCollapsed,
  loading,
  forceOpen,
  children,
}: CollapsibleSectionProps) {
  // SSR-safe: render with the prop-supplied default until the first effect
  // reads localStorage. Hydration mismatch is avoided because the initial
  // render matches what the server produces (default), and the localStorage
  // override only applies post-mount. forceOpen wins on the initial state
  // too, so deep-linked sections don't flash closed before opening.
  const [collapsed, setCollapsed] = useState(forceOpen ? false : defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);
  // Capture forceOpen at first mount only — if the prop later flips truthy
  // (e.g. dropdown writes a URL param the section reads via searchParams),
  // we don't want to override the user's subsequent collapse choice.
  const forceOpenOnMountRef = useRef(!!forceOpen);

  useEffect(() => {
    if (forceOpenOnMountRef.current) {
      // Already rendered open via the useState initializer; skip localStorage
      // so a deep-link arrival doesn't get the user's prior collapsed choice
      // dragged on top of it mid-render.
      setHydrated(true);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (stored !== null) setCollapsed(stored === "1");
    } catch {
      // localStorage may be blocked (private mode, embedded webviews) —
      // fall through with the prop default.
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist on change. Skip the first run pre-hydration so we don't write
  // the default back over the user's stored choice.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, collapsed ? "1" : "0");
    } catch {
      // silent — same fallback as above
    }
  }, [collapsed, hydrated, storageKey]);

  // Bulk control: window event from the page-level toolbar tells every
  // section to collapse or expand at once.
  useEffect(() => {
    const onBulk = (e: Event) => {
      const ev = e as CustomEvent<{ collapsed: boolean }>;
      if (typeof ev.detail?.collapsed === "boolean") {
        setCollapsed(ev.detail.collapsed);
      }
    };
    window.addEventListener(BULK_EVENT, onBulk);
    return () => window.removeEventListener(BULK_EVENT, onBulk);
  }, []);

  const isOpen = !collapsed;

  return (
    <div id={storageKey} className="rounded-2xl border border-gray-100 bg-white mb-6 scroll-mt-24">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50/40 transition-colors"
      >
        <span
          className={`inline-block text-gray-400 text-sm transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        >
          ›
        </span>
        <span className="text-base font-semibold text-gray-900 flex-1 truncate">
          {title}
        </span>
        {loading && (
          <span className="text-[11px] text-gray-400 animate-pulse">
            refreshing…
          </span>
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

/**
 * Bulk-control trigger for the page-level Expand-all / Collapse-all
 * toolbar. Emits a window event that every mounted CollapsibleSection
 * listens for — each section then updates and persists its own state.
 */
export function bulkCollapse(collapsed: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BULK_EVENT, { detail: { collapsed } }),
  );
}

/**
 * Expand-all / Collapse-all toolbar — two text buttons aligned right,
 * minimal chrome. Sits above the first CollapsibleSection so it reads as
 * section-level control rather than page-level chrome. Shared by every
 * admin page built on CollapsibleSection (/admin/analytics, /admin/family-comms).
 */
export function BulkCollapseToolbar() {
  return (
    <div className="flex justify-end gap-3 mb-3 -mt-1">
      <button
        type="button"
        onClick={() => bulkCollapse(false)}
        className="text-[11px] text-gray-500 hover:text-gray-900 underline underline-offset-2"
      >
        Expand all
      </button>
      <button
        type="button"
        onClick={() => bulkCollapse(true)}
        className="text-[11px] text-gray-500 hover:text-gray-900 underline underline-offset-2"
      >
        Collapse all
      </button>
    </div>
  );
}
