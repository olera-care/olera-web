export type ClaimState = "unclaimed" | "pending" | "claimed" | null;

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  email: string | null;
  claimState: ClaimState;
  source: "business_profiles" | "olera-providers";
  providerId: string;
  imageUrl: string | null;
}

export interface SearchStrategies {
  fullPhrase: string;
  nameWords: string | null;
  lastWord: string | null;
  isMultiWord: boolean;
}

export function buildStrategies(query: string): SearchStrategies {
  const words = query.split(/\s+/).filter((w) => w.length > 0);
  const isMultiWord = words.length > 1;
  return {
    fullPhrase: query,
    nameWords: isMultiWord ? words.slice(0, -1).join(" ") : null,
    lastWord: isMultiWord ? words[words.length - 1] : null,
    isMultiWord,
  };
}

const CLAIM_STATE_RANK: Record<string, number> = {
  claimed: 3,
  pending: 2,
  unclaimed: 1,
};

export function pickStrongestClaimState(
  states: Array<string | null | undefined>
): ClaimState {
  let best: ClaimState = null;
  let bestRank = 0;
  for (const state of states) {
    if (!state) continue;
    const rank = CLAIM_STATE_RANK[state] ?? 0;
    if (rank > bestRank) {
      best = state as ClaimState;
      bestRank = rank;
    }
  }
  return best;
}

export function firstImageFromPipeList(images: string | null | undefined): string | null {
  if (!images) return null;
  const first = images.split("|")[0]?.trim();
  return first || null;
}
