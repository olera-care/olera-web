/** Local-first job postings stored in localStorage.
 *  Will migrate to Supabase once the schema is finalized. */

export type PostingStatus = "active" | "paused" | "filled";

export interface JobPosting {
  id: string;
  title: string;
  commitment: "one_term" | "multiple_terms";
  categories: string[];
  certifications: string[];
  skills: string[];
  hoursPerWeek: string;
  payMin: string;
  payMax: string;
  description: string;
  positionsNeeded: number;
  status: PostingStatus;
  createdAt: string;
  /** Profile IDs of students invited to this posting */
  invited: string[];
  /** Profile IDs of students who applied */
  applicants: string[];
  /** Profile IDs of starred applicants (invited → applied) */
  starredApplicants: string[];
  /** Profile IDs of hired students */
  hired: string[];
}

const BASE_KEY = "medjobs_job_postings";
let _prefix = "";

/** Scope postings to a specific user. Call with the provider profile ID on mount. */
export function setStoragePrefix(profileId: string) {
  _prefix = profileId;
}

function storageKey(): string {
  return _prefix ? `${BASE_KEY}_${_prefix}` : BASE_KEY;
}

function readAll(): JobPosting[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as JobPosting[];
      // Backfill status for postings created before status was added.
      return parsed.map((p) => ({ ...p, status: p.status ?? "active" }));
    }
  } catch {}
  return [];
}

function writeAll(postings: JobPosting[]) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(postings));
  } catch {}
}

export function getPostings(): JobPosting[] {
  return readAll();
}

export function getPosting(id: string): JobPosting | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function createPosting(
  data: Omit<JobPosting, "id" | "createdAt" | "status" | "invited" | "applicants" | "starredApplicants" | "hired">
): JobPosting {
  const posting: JobPosting = {
    ...data,
    id: crypto.randomUUID(),
    status: "active",
    createdAt: new Date().toISOString(),
    invited: [],
    applicants: [],
    starredApplicants: [],
    hired: [],
  };
  const all = readAll();
  all.unshift(posting);
  writeAll(all);
  return posting;
}

export function updatePosting(id: string, updates: Partial<JobPosting>): JobPosting | null {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  writeAll(all);
  return all[idx];
}

export function deletePosting(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export const HOURS_LABELS: Record<string, string> = {
  "0_10": "0\u201310 hrs/wk",
  "10_20": "10\u201320 hrs/wk",
  "20_30": "20\u201330 hrs/wk",
  "30_plus": "30+ hrs/wk",
};
