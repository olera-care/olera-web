import { useEffect, useRef, type RefObject } from "react";

/**
 * Blur the active element if one exists (and it isn't <body>).
 * This prevents the browser's native focus management from scrolling
 * to the next focusable element when a portaled/dynamic element is
 * removed from the DOM.
 *
 * See: docs/POSTMORTEMS.md "2026-02-25: Modal close scrolls page to footer"
 */
function blurActiveElement() {
  const active = document.activeElement;
  if (active && active !== document.body) {
    (active as HTMLElement).blur();
  }
}

/**
 * Close a dropdown/popover/menu when the user clicks outside its container.
 *
 * - Uses `mousedown` (fires before `click`) so blur happens before React
 *   processes the state change.
 * - Blurs the active element before calling `handler` to prevent scroll-to-footer.
 * - Handler ref is stable — the listener is only registered once per `enabled` change.
 *
 * @param ref      - Ref to the container element
 * @param handler  - Called when a click lands outside the ref
 * @param enabled  - Only listens when true (default: true)
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        blurActiveElement();
        handlerRef.current();
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, enabled]);
}

/**
 * Same as `useClickOutside` but checks against multiple refs.
 * The handler fires only when the click is outside ALL provided refs.
 *
 * Useful for components with multiple independent dropdown areas
 * (e.g., a location picker + a care type picker in the same toolbar).
 *
 * @param refs     - Array of refs to container elements
 * @param handler  - Called when a click lands outside all refs
 * @param enabled  - Only listens when true (default: true)
 */
export function useClickOutsideMulti(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Stable ref for the refs array to avoid re-registering on every render
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const isInside = refsRef.current.some(
        (ref) => ref.current && ref.current.contains(target)
      );
      if (!isInside) {
        blurActiveElement();
        handlerRef.current();
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [enabled]);
}
