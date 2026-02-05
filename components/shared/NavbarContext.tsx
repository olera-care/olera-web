"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface NavbarContextValue {
  /** Whether the navbar is currently visible (true by default) */
  visible: boolean;
  /** Call from a page to enable auto-hide on scroll-down behaviour */
  enableAutoHide: () => void;
  /** Call from a page to disable auto-hide (restore default always-visible) */
  disableAutoHide: () => void;
  /** Force-hide the navbar (e.g. map view) — overrides scroll logic */
  setForceHidden: (hidden: boolean) => void;
}

const NavbarContext = createContext<NavbarContextValue>({
  visible: true,
  enableAutoHide: () => {},
  disableAutoHide: () => {},
  setForceHidden: () => {},
});

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [autoHide, setAutoHide] = useState(false);
  const [forceHidden, setForceHidden] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const enableAutoHide = useCallback(() => setAutoHide(true), []);
  const disableAutoHide = useCallback(() => {
    setAutoHide(false);
    setForceHidden(false);
    setVisible(true);
  }, []);

  const handleSetForceHidden = useCallback((hidden: boolean) => {
    setForceHidden(hidden);
  }, []);

  // Scroll-based auto-hide (only when autoHide is on and not force-hidden)
  useEffect(() => {
    if (!autoHide || forceHidden) return;

    setVisible(true);
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        // Only update if scroll delta exceeds threshold
        if (Math.abs(delta) >= scrollThreshold) {
          if (delta > 0 && currentY > 80) {
            setVisible(false);
          } else if (delta < -scrollThreshold) {
            // Require more deliberate scroll-up to show navbar
            setVisible(true);
          }
          lastScrollY.current = currentY;
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autoHide, forceHidden]);

  // Derive final visibility: force-hidden always wins
  const finalVisible = forceHidden ? false : (autoHide ? visible : true);

  return (
    <NavbarContext.Provider value={{ visible: finalVisible, enableAutoHide, disableAutoHide, setForceHidden: handleSetForceHidden }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}
