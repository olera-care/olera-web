// Deterministic provider-level assignment for the Managed Ads pitch A/B test.
//
// Unlike the public provider-page CTA experiment, this is keyed by provider
// identity, not anonymous session id: the buyer should see one coherent pitch
// across dashboard, Find Families, and /provider/boost.

export const MANAGED_ADS_VARIANTS = ["direct_reach", "local_plan"] as const;

export type ManagedAdsVariant = (typeof MANAGED_ADS_VARIANTS)[number];

export const MANAGED_ADS_VARIANT_DEFAULT_WEIGHTS: Record<ManagedAdsVariant, number> = {
  direct_reach: 50,
  local_plan: 50,
};

export type ManagedAdsWeightMap = Partial<Record<ManagedAdsVariant, number>>;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function assignManagedAdsVariantWeighted(
  providerKey: string,
  weights: ManagedAdsWeightMap,
  version: number,
): ManagedAdsVariant {
  const total = MANAGED_ADS_VARIANTS.reduce((sum, v) => sum + Math.max(0, weights[v] ?? 0), 0);
  if (total <= 0) return MANAGED_ADS_VARIANTS[djb2(providerKey) % MANAGED_ADS_VARIANTS.length];

  const r = djb2(`${providerKey}:managed_ads:v${version}`) / 0x1_0000_0000;
  const target = r * total;

  let cumulative = 0;
  for (const v of MANAGED_ADS_VARIANTS) {
    cumulative += Math.max(0, weights[v] ?? 0);
    if (target < cumulative) return v;
  }
  for (let i = MANAGED_ADS_VARIANTS.length - 1; i >= 0; i--) {
    if ((weights[MANAGED_ADS_VARIANTS[i]] ?? 0) > 0) return MANAGED_ADS_VARIANTS[i];
  }
  return MANAGED_ADS_VARIANTS[0];
}
