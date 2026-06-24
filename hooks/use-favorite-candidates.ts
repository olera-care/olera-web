"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "medjobs_favorite_candidates";

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function writeIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function useFavoriteCandidates() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIds(readIds());
  }, []);

  const isFavorited = useCallback((id: string) => ids.has(id), [ids]);

  const toggleFavorite = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeIds(next);
      return next;
    });
  }, []);

  return { isFavorited, toggleFavorite };
}
