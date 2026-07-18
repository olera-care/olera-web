/**
 * MedJobs placements (Phase D) — the employer-student relationship created when
 * a provider offers to hire a student after a good interview, and confirmed when
 * the student accepts.
 *
 * Payments are STUBBED for now (Stripe wiring deferred). The fee + hours
 * threshold are recorded for the guarantee. See
 * docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md.
 */

export type PlacementStatus =
  | "offered"
  | "accepted"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

/** Approved Phase D inputs. */
export const INTERNSHIP_FEE_USD = 100; // per party (provider + student)
export const HOURS_THRESHOLD = 120;

/** Plain-language guarantee, shown wherever the fee appears. */
export const GUARANTEE_LINE =
  "If it doesn't work out, your next term is on us. You only pay for a placement that delivers.";

export interface Placement {
  id: string;
  provider_profile_id: string;
  student_profile_id: string;
  interview_id: string | null;
  status: PlacementStatus;
  internship_agreement_signed_at: string | null;
  provider_fee_usd: number;
  student_fee_usd: number;
  hours_threshold: number;
  provider_paid_at: string | null;
  student_paid_at: string | null;
  offered_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
