import type { JobPosting } from "./job-postings";
import type { CandidateData } from "@/components/medjobs/CandidateRow";

/**
 * Score a candidate's fit for a job posting.
 *
 * Weights:
 *   Certification overlap  +3 each (strongest signal — verifiable)
 *   Skill / care-type      +2 each (fuzzy substring match)
 *   Hours compatibility    +2 (range overlap)
 *   Commitment match       +1
 *
 * Returns 0 when there's no meaningful overlap.
 */
export function scoreCandidateForJob(
  candidate: CandidateData,
  job: JobPosting,
): number {
  const meta = candidate.metadata;
  let score = 0;

  // ── Certifications (exact-ish match, case-insensitive) ──
  const candidateCerts = (meta.certifications ?? []).map((c) => c.toLowerCase());
  for (const jobCert of job.certifications) {
    const lc = jobCert.toLowerCase();
    if (candidateCerts.some((cc) => cc.includes(lc) || lc.includes(cc))) {
      score += 3;
    }
  }

  // ── Skills ↔ care_experience_types (fuzzy substring) ──
  const candidateExp = (meta.care_experience_types ?? []).map((c) => c.toLowerCase());
  for (const skill of job.skills) {
    const lc = skill.toLowerCase();
    if (candidateExp.some((ce) => ce.includes(lc) || lc.includes(ce))) {
      score += 2;
    }
  }

  // ── Hours compatibility ──
  // Job hours: "0_10", "10_20", "20_30", "30_plus"
  // Candidate hours_per_week_range: "5-10", "10-15", "15-20", "20+"
  const jobRange = parseJobHours(job.hoursPerWeek);
  const candRange = parseCandidateHours(meta.hours_per_week_range);
  if (jobRange && candRange && rangesOverlap(jobRange, candRange)) {
    score += 2;
  }

  // ── Commitment match ──
  // Job: "one_term" | "multiple_terms"
  // Candidate: "1_semester" | "multiple_semesters" | "1_plus_year"
  const dc = meta.duration_commitment;
  if (dc) {
    if (job.commitment === "one_term" && dc === "1_semester") score += 1;
    if (job.commitment === "multiple_terms" && (dc === "multiple_semesters" || dc === "1_plus_year")) score += 1;
  }

  return score;
}

/** Minimum score to earn a "Strong match" badge. */
export const STRONG_MATCH_THRESHOLD = 4;

/**
 * Maximum possible score for a given job posting.
 * Used to normalize raw scores to a 0–100 percentage.
 */
export function maxScoreForJob(job: JobPosting): number {
  let max = 0;
  max += job.certifications.length * 3;
  max += job.skills.length * 2;
  max += 2; // hours compatibility
  max += 1; // commitment match
  return Math.max(max, 1); // avoid division by zero
}

/** Normalize a raw score to a 0–100 percentage for display. */
export function scoreToPercent(rawScore: number, job: JobPosting): number {
  return Math.round((rawScore / maxScoreForJob(job)) * 100);
}

// ── Helpers ──

type Range = [number, number];

function parseJobHours(h: string): Range | null {
  switch (h) {
    case "0_10": return [0, 10];
    case "10_20": return [10, 20];
    case "20_30": return [20, 30];
    case "30_plus": return [30, 50];
    default: return null;
  }
}

function parseCandidateHours(h?: string): Range | null {
  if (!h) return null;
  if (h.includes("20+") || h.includes("20-")) return [20, 50];
  const m = h.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  return null;
}

function rangesOverlap(a: Range, b: Range): boolean {
  return a[0] < b[1] && b[0] < a[1];
}
