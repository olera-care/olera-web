"use client";

import { createContext, useContext, useMemo } from "react";
import {
  useBenefitsState,
  type BenefitsState,
  type BenefitsActions,
} from "@/hooks/use-benefits-state";

// ─── Context ────────────────────────────────────────────────────────────────

type CareProfileContextValue = BenefitsState & BenefitsActions;

const CareProfileContext = createContext<CareProfileContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function CareProfileProvider({ children }: { children: React.ReactNode }) {
  const state = useBenefitsState();

  // Memoize the context value to prevent unnecessary re-renders.
  // Only re-create when any state value changes.
  const value = useMemo<CareProfileContextValue>(
    () => state,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.answers,
      state.step,
      state.pageState,
      state.result,
      state.errorMsg,
      state.locationDisplay,
      state.previewCount,
    ]
  );

  return (
    <CareProfileContext.Provider value={value}>
      {children}
    </CareProfileContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCareProfile(): CareProfileContextValue {
  const ctx = useContext(CareProfileContext);
  if (!ctx) {
    throw new Error("useCareProfile must be used within a <CareProfileProvider>");
  }
  return ctx;
}
