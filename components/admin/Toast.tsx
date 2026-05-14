"use client";

/**
 * Toast — shared bottom-right notification surface for admin actions.
 *
 * E1: every Log outcome produces a meaningful progression message
 * ("Cadence stopped · row moved to Replies", "Became a Client —
 * Partner Prospects unlocked"). The toast renders briefly then
 * auto-dismisses, making the invisible state movement visible.
 *
 * Usage:
 *   const toast = useToast();
 *   toast("Row moved to Replies");
 *
 * Provider wraps the admin layout; useToast() falls back to a no-op
 * (logged to console) when called outside the provider, so optional
 * use sites don't crash.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastMessage {
  id: number;
  text: string;
}

type ToastFn = (text: string) => void;

const ToastContext = createContext<ToastFn | null>(null);

const NOOP_TOAST: ToastFn = (text) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[toast outside provider]", text);
  }
};

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback<ToastFn>((text) => {
    if (!text) return;
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-emerald-700/20"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
