import type { BenefitsIntakeAnswers, BenefitsSearchResult } from "@/lib/types/benefits";

const STORAGE_KEY = "olera_benefits_intake";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface CachedIntake {
  answers: BenefitsIntakeAnswers;
  locationDisplay: string;
  result?: BenefitsSearchResult;
  cachedAt: string;
}

export function setBenefitsIntakeCache(
  answers: BenefitsIntakeAnswers,
  locationDisplay: string,
  result?: BenefitsSearchResult
): void {
  if (typeof window === "undefined") return;

  const entry: CachedIntake = {
    answers,
    locationDisplay,
    result,
    cachedAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage unavailable or quota exceeded
  }
}

export function getBenefitsIntakeCache(): CachedIntake | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const entry: CachedIntake = JSON.parse(raw);
    const age = Date.now() - new Date(entry.cachedAt).getTime();

    if (age > MAX_AGE_MS) {
      clearBenefitsIntakeCache();
      return null;
    }

    return entry;
  } catch {
    clearBenefitsIntakeCache();
    return null;
  }
}

export function clearBenefitsIntakeCache(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
