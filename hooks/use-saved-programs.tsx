"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface SavedProgramEntry {
  programId: string; // waiver-library ID (e.g., "mi-choice-waiver-program")
  stateId: string;   // state slug (e.g., "michigan")
  name: string;
  shortName: string;
  programType?: string;
  savingsRange?: string;
  savedAt: string;
}

interface SavedProgramsContextValue {
  isSaved: (programId: string) => boolean;
  toggleSave: (program: SaveProgramData) => void;
  savedPrograms: SavedProgramEntry[];
  savedCount: number;
  isLoading: boolean;
}

export interface SaveProgramData {
  programId: string;
  stateId: string;
  name: string;
  shortName: string;
  programType?: string;
  savingsRange?: string;
}

const SavedProgramsContext = createContext<SavedProgramsContextValue | null>(null);

export function useSavedPrograms() {
  const ctx = useContext(SavedProgramsContext);
  if (!ctx) {
    throw new Error("useSavedPrograms must be used within a SavedProgramsProvider");
  }
  return ctx;
}

export function SavedProgramsProvider({ children }: { children: ReactNode }) {
  const { user, openAuth } = useAuth();
  const [savedPrograms, setSavedPrograms] = useState<SavedProgramEntry[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved programs for authenticated users
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setSavedPrograms([]);
      setSavedIds(new Set());
      setIsLoading(false);
      return;
    }

    const fetchSaved = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("saved_programs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) {
          const entries: SavedProgramEntry[] = data.map((r) => ({
            programId: r.program_id,
            stateId: r.state_id,
            name: r.name,
            shortName: r.short_name || r.name,
            programType: r.program_type,
            savingsRange: r.savings_range,
            savedAt: r.created_at,
          }));
          setSavedPrograms(entries);
          setSavedIds(new Set(entries.map((e) => e.programId)));
        }
      } catch (err) {
        console.error("Failed to fetch saved programs:", err);
      }
      setIsLoading(false);
    };

    fetchSaved();
  }, [user]);

  const isSaved = useCallback(
    (programId: string) => savedIds.has(programId),
    [savedIds]
  );

  const toggleSave = useCallback(
    async (program: SaveProgramData) => {
      // Auth gate — prompt sign-in if not logged in
      if (!user) {
        openAuth?.();
        return;
      }

      const alreadySaved = savedIds.has(program.programId);

      // Optimistic update
      if (alreadySaved) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(program.programId);
          return next;
        });
        setSavedPrograms((prev) => prev.filter((p) => p.programId !== program.programId));
      } else {
        setSavedIds((prev) => new Set(prev).add(program.programId));
        setSavedPrograms((prev) => [
          {
            ...program,
            savedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // Persist to Supabase
      try {
        const supabase = createClient();

        if (alreadySaved) {
          await supabase
            .from("saved_programs")
            .delete()
            .eq("user_id", user.id)
            .eq("program_id", program.programId);
        } else {
          await supabase.from("saved_programs").insert({
            user_id: user.id,
            program_id: program.programId,
            state_id: program.stateId,
            name: program.name,
            short_name: program.shortName,
            program_type: program.programType || null,
            savings_range: program.savingsRange || null,
          });
        }
      } catch (err) {
        console.error("Failed to save program:", err);
        // Revert optimistic update on error
        if (alreadySaved) {
          setSavedIds((prev) => new Set(prev).add(program.programId));
          setSavedPrograms((prev) => [
            { ...program, savedAt: new Date().toISOString() },
            ...prev,
          ]);
        } else {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(program.programId);
            return next;
          });
          setSavedPrograms((prev) => prev.filter((p) => p.programId !== program.programId));
        }
      }
    },
    [user, savedIds, openAuth]
  );

  return (
    <SavedProgramsContext.Provider
      value={{
        isSaved,
        toggleSave,
        savedPrograms,
        savedCount: savedIds.size,
        isLoading,
      }}
    >
      {children}
    </SavedProgramsContext.Provider>
  );
}
