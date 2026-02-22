"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "olera-saved-programs";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useSavedPrograms() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setSavedIds(readIds());

    // Cross-tab sync
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setSavedIds(readIds());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const savedCount = savedIds.length;

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setSavedIds([]);
  }, []);

  return { savedIds, savedCount, isSaved, toggle, clear };
}
