/**
 * Resend Acceptable-Use thresholds, as fractions (not percentages). Above these,
 * Resend can suspend the account "without warning" — and it's the SAME account as
 * our auth/transactional mail, so crossing them takes families, students, and
 * logins down alongside provider-acquisition mail.
 *
 * WARN levels are half the hard limit: an early-yellow signal so we react before
 * the rate is actually at the suspension line. Used by the admin email cockpit
 * (/admin/automations) to color the live 30-day complaint/bounce rates.
 *
 * Kept dependency-free (no server imports) so client components can import it
 * without pulling Resend / the service-role Supabase client into the bundle.
 */
export const RESEND_COMPLAINT_LIMIT = 0.0008; // 0.08% — hard suspension line
export const RESEND_COMPLAINT_WARN = 0.0004; // 0.04% — yellow
export const RESEND_BOUNCE_LIMIT = 0.04; // 4% — hard suspension line
export const RESEND_BOUNCE_WARN = 0.02; // 2% — yellow
