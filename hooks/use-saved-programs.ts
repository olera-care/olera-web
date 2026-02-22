"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "olera-saved-programs";

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getServerSnapshot(): string[] {
  return [];
}

// Module-level listeners for useSyncExternalStore
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  // Cross-tab sync
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function writeSavedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  emitChange();
}

export function useSavedPrograms() {
  const savedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const savedCount = savedIds.length;

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      const current = getSnapshot();
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      writeSavedIds(next);
    },
    []
  );

  const clear = useCallback(() => {
    writeSavedIds([]);
  }, []);

  return { savedIds, savedCount, isSaved, toggle, clear };
}
