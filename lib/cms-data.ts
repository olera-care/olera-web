/**
 * CMS (Centers for Medicare & Medicaid Services) data fetching utilities.
 *
 * Uses the Provider Data Catalog API (no auth required):
 * - Home Health Compare: 6jpm-sxkc (~12K records)
 * - Nursing Home Compare: 4pq5-n9py (~14.7K records)
 * - Hospice CAHPS: gxki-hrr8 (filter for SUMMARY_STAR_RATING)
 * - Hospice General Info: yc9t-dgbk (~7K records)
 */

import type { CMSData } from "@/lib/types";

const CMS_API_BASE = "https://data.cms.gov/provider-data/api/1/datastore/query";

const DATASET_IDS = {
  home_health: "6jpm-sxkc",
  nursing_home: "4pq5-n9py",
  hospice_cahps: "gxki-hrr8",
  hospice_info: "yc9t-dgbk",
} as const;

interface CMSRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface CMSResponse {
  results: CMSRecord[];
  count?: number;
}

/**
 * Fetch records from a CMS dataset with optional filters.
 */
async function fetchCMSDataset(
  datasetId: string,
  conditions: { property: string; value: string; operator?: string }[] = [],
  limit = 1500,
  offset = 0,
): Promise<CMSResponse> {
  const url = `${CMS_API_BASE}/${datasetId}/0`;

  const body: Record<string, unknown> = { limit, offset, count: true };
  if (conditions.length > 0) {
    body.conditions = conditions.map((c) => ({
      property: c.property,
      value: c.value,
      operator: c.operator ?? "=",
    }));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`CMS API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch all Home Health providers for a given state.
 */
export async function fetchHomeHealthByState(state: string): Promise<CMSRecord[]> {
  const allRecords: CMSRecord[] = [];
  let offset = 0;
  const limit = 1500;

  while (true) {
    const { results } = await fetchCMSDataset(
      DATASET_IDS.home_health,
      [{ property: "state", value: state }],
      limit,
      offset,
    );
    allRecords.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return allRecords;
}

/**
 * Fetch all Nursing Home providers for a given state.
 */
export async function fetchNursingHomesByState(state: string): Promise<CMSRecord[]> {
  const allRecords: CMSRecord[] = [];
  let offset = 0;
  const limit = 1500;

  while (true) {
    const { results } = await fetchCMSDataset(
      DATASET_IDS.nursing_home,
      [{ property: "state", value: state }],
      limit,
      offset,
    );
    allRecords.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return allRecords;
}

/**
 * Fetch hospice star ratings for a given state.
 * Joins CAHPS survey data (star ratings) with general info (matching fields).
 */
export async function fetchHospiceByState(state: string): Promise<CMSRecord[]> {
  // Get general info (has name, address, CCN)
  const { results: infoRecords } = await fetchCMSDataset(
    DATASET_IDS.hospice_info,
    [{ property: "state", value: state }],
  );

  // Get CAHPS star ratings (filter for summary star)
  const { results: cahpsRecords } = await fetchCMSDataset(
    DATASET_IDS.hospice_cahps,
    [
      { property: "state", value: state },
      { property: "measure_code", value: "SUMMARY_STAR_RATING" },
    ],
  );

  // Index CAHPS by CCN
  const cahpsByCCN = new Map<string, CMSRecord>();
  for (const r of cahpsRecords) {
    const ccn = r.cms_certification_number_ccn || r.ccn;
    if (ccn) cahpsByCCN.set(ccn, r);
  }

  // Merge: info + star rating
  return infoRecords.map((info) => {
    const ccn = info.cms_certification_number_ccn || info.ccn;
    const cahps = ccn ? cahpsByCCN.get(ccn) : undefined;
    return {
      ...info,
      star_rating: cahps?.star_rating ?? null,
    };
  });
}

/**
 * Normalize a provider name for matching.
 * Strips legal suffixes, industry terms, punctuation, and normalizes whitespace.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[']/g, "")
    // Strip legal entity suffixes
    .replace(/,?\s*(llc|inc|corp|corporation|ltd|co|lp|llp|pllc|pc|dba|d\/b\/a|psc)\.?\s*/gi, " ")
    // Strip industry terms (anywhere, not just end)
    .replace(/\b(home health|home care|hospice|nursing|rehab|rehabilitation|healthcare|health care|medical group|medical|services?|agency|care|center|centre|facility|of|the|and|at|in|for|hh|nh)\b/gi, " ")
    // Strip state names (CMS often appends them)
    .replace(/\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/gi, " ")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()#@"]/g, " ")
    .replace(/\bst\b/g, "saint")
    .replace(/\bmt\b/g, "mount")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract meaningful tokens from a name (for overlap matching).
 */
function nameTokens(name: string): Set<string> {
  const normalized = normalizeName(name);
  return new Set(normalized.split(" ").filter((t) => t.length > 1));
}

/**
 * Compute token overlap score between two names.
 * Returns a value between 0 and 1 (1 = perfect overlap).
 */
function tokenOverlap(name1: string, name2: string): number {
  const t1 = nameTokens(name1);
  const t2 = nameTokens(name2);
  if (t1.size === 0 || t2.size === 0) return 0;

  let shared = 0;
  for (const t of t1) {
    if (t2.has(t)) shared++;
  }

  // Use the smaller set as denominator — if all tokens from the shorter
  // name appear in the longer name, that's a strong match
  const smaller = Math.min(t1.size, t2.size);
  return shared / smaller;
}

/**
 * Normalize an address for comparison.
 */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\bsuite\b/g, "ste")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\broad\b/g, "rd")
    .replace(/\blane\b/g, "ln")
    .replace(/\bparkway\b/g, "pkwy")
    .replace(/\bcircle\b/g, "cir")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()#@"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a ZIP code (take first 5 digits).
 */
export function normalizeZip(zip: string | number | null): string {
  if (!zip) return "";
  return String(zip).replace(/\D/g, "").slice(0, 5);
}

/**
 * Convert a CMS Home Health record to CMSData format.
 */
export function homeHealthToCMSData(record: CMSRecord): CMSData {
  return {
    ccn: record.cms_certification_number_ccn || "",
    source: "home_health",
    overall_rating: parseFloat(record.quality_of_patient_care_star_rating) || null,
    provider_name: record.provider_name || "",
    last_synced: new Date().toISOString(),
  };
}

/**
 * Convert a CMS Nursing Home record to CMSData format.
 */
export function nursingHomeToCMSData(record: CMSRecord): CMSData {
  const parseRating = (v: string | undefined) => {
    const n = parseInt(v ?? "", 10);
    return isNaN(n) ? null : n;
  };

  return {
    ccn: record.cms_certification_number_ccn || record.federal_provider_number || "",
    source: "nursing_home",
    overall_rating: parseRating(record.overall_rating),
    health_inspection_rating: parseRating(record.health_inspection_rating),
    staffing_rating: parseRating(record.staffing_rating),
    quality_rating: parseRating(record.qm_rating),
    provider_name: record.provider_name || "",
    deficiency_count: parseInt(record.total_number_of_health_deficiencies ?? "0", 10) || 0,
    penalty_count: parseInt(record.number_of_fines ?? "0", 10) || 0,
    total_fines: parseFloat(record.total_amount_of_fines_in_dollars ?? "0") || 0,
    abuse_icon: record.abuse_icon || undefined,
    last_synced: new Date().toISOString(),
  };
}

/**
 * Convert a CMS Hospice record to CMSData format.
 */
export function hospiceToCMSData(record: CMSRecord): CMSData {
  const rating = record.star_rating;
  return {
    ccn: record.cms_certification_number_ccn || "",
    source: "hospice",
    overall_rating: rating && rating !== "Not Available" ? parseInt(rating, 10) : null,
    provider_name: record.facility_name || "",
    last_synced: new Date().toISOString(),
  };
}

/**
 * Match CMS records against Olera providers using tiered strategy:
 *  1. Exact normalized name + ZIP (highest confidence)
 *  2. Token overlap ≥ 60% + ZIP (catches name format differences)
 *  3. Address match + ZIP (catches completely different names for same location)
 *
 * Returns a map of provider_id → CMSData for matched providers.
 */
export function matchCMSRecords(
  olerProviders: { provider_id: string; provider_name: string; zipcode: number | null; address?: string | null }[],
  cmsRecords: CMSRecord[],
  toCMSData: (record: CMSRecord) => CMSData,
  cmsNameField: string,
  cmsZipField: string,
  cmsAddressField = "address",
): Map<string, CMSData> {
  // Build CMS indexes by ZIP for efficient lookup
  const cmsExact = new Map<string, CMSRecord>(); // normalized(name)|zip → record
  const cmsByZip = new Map<string, CMSRecord[]>(); // zip → records[]
  const cmsAddrIndex = new Map<string, CMSRecord>(); // normalized(addr)|zip → record

  for (const r of cmsRecords) {
    const name = normalizeName(r[cmsNameField] || "");
    const zip = normalizeZip(r[cmsZipField]);
    if (!zip) continue;

    if (name) {
      cmsExact.set(`${name}|${zip}`, r);
    }

    // Index by ZIP for token overlap
    if (!cmsByZip.has(zip)) cmsByZip.set(zip, []);
    cmsByZip.get(zip)!.push(r);

    // Index by address for fallback
    const addr = r[cmsAddressField];
    if (addr) {
      const normAddr = normalizeAddress(addr);
      if (normAddr.length > 5) {
        cmsAddrIndex.set(`${normAddr}|${zip}`, r);
      }
    }
  }

  const matches = new Map<string, CMSData>();

  for (const p of olerProviders) {
    const name = normalizeName(p.provider_name);
    const zip = normalizeZip(p.zipcode);
    if (!name || !zip) continue;

    // Tier 1: Exact normalized name + ZIP
    const exact = cmsExact.get(`${name}|${zip}`);
    if (exact) {
      matches.set(p.provider_id, toCMSData(exact));
      continue;
    }

    // Tier 2: Token overlap ≥ 60% within same ZIP
    const zipRecords = cmsByZip.get(zip);
    if (zipRecords) {
      let bestMatch: CMSRecord | null = null;
      let bestScore = 0;

      for (const r of zipRecords) {
        const score = tokenOverlap(p.provider_name, r[cmsNameField] || "");
        if (score > bestScore && score >= 0.6) {
          bestScore = score;
          bestMatch = r;
        }
      }

      if (bestMatch) {
        matches.set(p.provider_id, toCMSData(bestMatch));
        continue;
      }
    }

    // Tier 3: Address match + ZIP
    if (p.address) {
      const normAddr = normalizeAddress(p.address);
      if (normAddr.length > 5) {
        const addrMatch = cmsAddrIndex.get(`${normAddr}|${zip}`);
        if (addrMatch) {
          matches.set(p.provider_id, toCMSData(addrMatch));
        }
      }
    }
  }

  return matches;
}
