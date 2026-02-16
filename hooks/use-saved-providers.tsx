"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getAnonSaves,
  addAnonSave,
  removeAnonSave,
  clearAnonSaves,
  type SavedProviderEntry,
} from "@/lib/saved-providers";

export type { SavedProviderEntry } from "@/lib/saved-providers";

export interface SaveProviderData {
  providerId: string;
  slug: string;
  name: string;
  location: string;
  careTypes: string[];
  image: string | null;
  rating?: number;
}

interface SavedProvidersContextValue {
  isSaved: (providerId: string) => boolean;
  toggleSave: (provider: SaveProviderData) => void;
  savedCount: number;
  anonSaves: SavedProviderEntry[];
  savedProviders: SavedProviderEntry[];
  /** True after the initial data load (anon + DB) has settled */
  hasInitialized: boolean;
}

const SavedProvidersContext = createContext<SavedProvidersContextValue | null>(
  null
);

export function useSavedProviders() {
  const ctx = useContext(SavedProvidersContext);
  if (!ctx) {
    throw new Error(
      "useSavedProviders must be used within a SavedProvidersProvider"
    );
  }
  return ctx;
}

export function SavedProvidersProvider({ children }: { children: ReactNode }) {
  const { user, activeProfile, openAuth } = useAuth();

  // Anonymous saves (from sessionStorage)
  const [anonSaves, setAnonSaves] = useState<SavedProviderEntry[]>([]);
  // Authenticated saves — keyed by original provider ID (iOS slug or UUID)
  const [dbSaveIds, setDbSaveIds] = useState<Set<string>>(new Set());
  const [dbSaves, setDbSaves] = useState<SavedProviderEntry[]>([]);

  const migrationDone = useRef(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Hydrate anonymous saves from sessionStorage on mount
  useEffect(() => {
    setAnonSaves(getAnonSaves());
  }, []);

  // Fetch DB saves for authenticated users
  useEffect(() => {
    if (!activeProfile || !isSupabaseConfigured()) {
      setDbSaveIds(new Set());
      setDbSaves([]);
      // Anonymous user or no profile yet — mark initialized after anon hydration
      if (!user) setHasInitialized(true);
      return;
    }

    const fetchDbSaves = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select("to_profile_id, message, created_at")
        .eq("from_profile_id", activeProfile.id)
        .eq("type", "save")
        .order("created_at", { ascending: false });

      if (data) {
        const ids = new Set<string>();
        const entries: SavedProviderEntry[] = [];

        for (const r of data) {
          const meta = r.message ? JSON.parse(r.message) : {};
          // Use the originalProviderId (iOS slug) if stored, otherwise fall back to to_profile_id
          const originalId = meta.originalProviderId || r.to_profile_id;
          ids.add(originalId);
          entries.push({
            providerId: originalId,
            slug: meta.slug || originalId,
            name: meta.name || "Unknown Provider",
            location: meta.location || "",
            careTypes: meta.careTypes || [],
            image: meta.image || null,
            rating: meta.rating || undefined,
            savedAt: r.created_at,
          });
        }

        setDbSaveIds(ids);
        setDbSaves(entries);
      }
      setHasInitialized(true);
    };

    fetchDbSaves();
  }, [activeProfile, user]);

  // Migrate anonymous saves to DB when user authenticates
  useEffect(() => {
    if (!user || !activeProfile || !isSupabaseConfigured()) return;
    if (migrationDone.current) return;

    const saves = getAnonSaves();
    if (saves.length === 0) return;

    migrationDone.current = true;

    const migrate = async () => {
      // Migrate each save via API (handles FK resolution)
      for (const s of saves) {
        try {
          await fetch("/api/connections/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerId: s.providerId,
              providerName: s.name,
              providerSlug: s.slug,
              providerMeta: {
                location: s.location,
                careTypes: s.careTypes,
                image: s.image,
                rating: s.rating,
              },
            }),
          });
        } catch (err) {
          console.error("Migration save error:", err);
        }
      }

      clearAnonSaves();
      setAnonSaves([]);

      // Refresh DB saves
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select("to_profile_id, message, created_at")
        .eq("from_profile_id", activeProfile.id)
        .eq("type", "save")
        .order("created_at", { ascending: false });

      if (data) {
        const ids = new Set<string>();
        const entries: SavedProviderEntry[] = [];

        for (const r of data) {
          const meta = r.message ? JSON.parse(r.message) : {};
          const originalId = meta.originalProviderId || r.to_profile_id;
          ids.add(originalId);
          entries.push({
            providerId: originalId,
            slug: meta.slug || originalId,
            name: meta.name || "Unknown Provider",
            location: meta.location || "",
            careTypes: meta.careTypes || [],
            image: meta.image || null,
            rating: meta.rating || undefined,
            savedAt: r.created_at,
          });
        }

        setDbSaveIds(ids);
        setDbSaves(entries);
      }
    };

    migrate();
  }, [user, activeProfile]);

  const isSaved = useCallback(
    (providerId: string) => {
      return dbSaveIds.has(providerId) || anonSaves.some((s) => s.providerId === providerId);
    },
    [dbSaveIds, anonSaves]
  );

  const toggleSave = useCallback(
    async (provider: SaveProviderData) => {
      const currentlySaved = dbSaveIds.has(provider.providerId) ||
        anonSaves.some((s) => s.providerId === provider.providerId);

      if (currentlySaved) {
        // ── Unsave ──
        if (user && activeProfile && isSupabaseConfigured()) {
          // Optimistic local update
          setDbSaveIds((prev) => {
            const next = new Set(prev);
            next.delete(provider.providerId);
            return next;
          });
          setDbSaves((prev) => prev.filter((s) => s.providerId !== provider.providerId));

          // Delete via API
          fetch("/api/connections/save", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ providerId: provider.providerId }),
          }).catch((err) => console.error("Unsave error:", err));
        } else {
          // Anonymous unsave
          removeAnonSave(provider.providerId);
          setAnonSaves(getAnonSaves());
        }
      } else {
        // ── Save ──
        if (user && activeProfile && isSupabaseConfigured()) {
          // Optimistic local update
          setDbSaveIds((prev) => new Set(prev).add(provider.providerId));
          setDbSaves((prev) => [
            {
              providerId: provider.providerId,
              slug: provider.slug,
              name: provider.name,
              location: provider.location,
              careTypes: provider.careTypes,
              image: provider.image,
              rating: provider.rating,
              savedAt: new Date().toISOString(),
            },
            ...prev,
          ]);

          // Save via API (handles FK resolution)
          fetch("/api/connections/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerId: provider.providerId,
              providerName: provider.name,
              providerSlug: provider.slug,
              providerMeta: {
                location: provider.location,
                careTypes: provider.careTypes,
                image: provider.image,
                rating: provider.rating,
              },
            }),
          }).catch((err) => console.error("Save error:", err));
        } else {
          // Anonymous save
          const added = addAnonSave({
            providerId: provider.providerId,
            slug: provider.slug,
            name: provider.name,
            location: provider.location,
            careTypes: provider.careTypes,
            image: provider.image,
            rating: provider.rating,
          });

          if (!added) {
            // At limit — prompt auth
            openAuth({
              defaultMode: "sign-up",
              intent: "family",
              deferred: {
                action: "save",
                targetProfileId: provider.providerId,
                returnUrl: typeof window !== "undefined" ? window.location.pathname : "/",
              },
            });
            return;
          }

          setAnonSaves(getAnonSaves());
        }
      }
    },
    [user, activeProfile, dbSaveIds, anonSaves, openAuth]
  );

  const savedCount = dbSaveIds.size + anonSaves.length;
  const savedProviders = user && activeProfile ? dbSaves : anonSaves;

  return (
    <SavedProvidersContext.Provider
      value={{ isSaved, toggleSave, savedCount, anonSaves, savedProviders, hasInitialized }}
    >
      {children}
    </SavedProvidersContext.Provider>
  );
}
