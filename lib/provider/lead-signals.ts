/**
 * Shared lead-signal derivation for provider connections (leads).
 *
 * Why this exists: family contact PII (email / phone / full name) must NOT be
 * shipped to the browser for UNVERIFIED providers — that read now happens in an
 * authenticated server route (`/api/provider/connections`) that redacts those
 * fields before returning. But the provider UI also shows two derived numbers —
 * profile completeness ("profile X%") and the lead-quality badge — that are
 * computed FROM email/phone/name. If the server simply stripped those fields,
 * the client would recompute lower numbers and the UI would visibly change.
 *
 * So the server computes completeness + quality from the FULL row (here) and
 * injects them; the client mapper prefers the injected values when present.
 * Keeping that derivation in one place means client and server can never drift.
 *
 * This module is isomorphic — no localStorage / window / Supabase — so both the
 * client component (`app/provider/connections/page.tsx`) and the server route
 * import it.
 */
import { calculateLeadQualityScore, type LeadQualityResult } from "@/lib/lead-quality-score";
import type { FamilyMetadata } from "@/lib/types";

/** The family business_profile joined onto a connection via from_profile_id. */
export interface FamilyProfileLike {
  id?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  care_types?: string[] | null;
  // `unknown` so a fully-typed Profile (whose metadata is a discriminated union)
  // is assignable here; narrowed to a record internally.
  metadata?: unknown;
  description?: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

/** Minimal connection-row shape needed to derive lead signals. */
export interface RawLeadConnection {
  message?: string | null;
  metadata?: unknown;
  fromProfile?: FamilyProfileLike | FamilyProfileLike[] | null;
}

export interface LeadSignals {
  /** The lead's full name as the mapper would derive it (profile → message fallback). */
  fullName: string;
  /** Family email, if any (profile → message fallback). */
  email?: string;
  /** Family phone, if any (profile → message fallback). */
  phone?: string;
  /** 0–100 profile completeness (same weights as the client mapper). */
  completeness: number;
  /** Lead-quality score/tier/highlights. */
  quality: LeadQualityResult;
}

/**
 * Derive name/contact + completeness + quality from a raw connection row.
 *
 * The name/email/phone derivation mirrors `mapConnectionToLead` exactly:
 * prefer the fresh family profile, fall back to the connection `message` JSON
 * (seeker_first_name / seeker_last_name / seeker_email / seeker_phone) for
 * backward compatibility with older connections.
 */
export function deriveLeadSignals(conn: RawLeadConnection): LeadSignals {
  const meta = (conn.metadata || {}) as Record<string, unknown>;
  const thread =
    (meta.thread as Array<{ from_profile_id: string; text?: string; is_auto_reply?: boolean }>) || [];
  const familyProfile = Array.isArray(conn.fromProfile) ? conn.fromProfile[0] : conn.fromProfile;

  let careDetails: Record<string, unknown> = {};
  try {
    careDetails = conn.message ? (JSON.parse(conn.message) as Record<string, unknown>) : {};
  } catch {
    careDetails = {};
  }

  const familyMeta = (familyProfile?.metadata || {}) as Record<string, unknown>;

  const profileDisplayName = familyProfile?.display_name || "";
  const messageFirstName = careDetails.seeker_first_name as string | undefined;
  const messageLastName = careDetails.seeker_last_name as string | undefined;

  let fullName: string;
  if (profileDisplayName && profileDisplayName !== messageFirstName?.split("@")[0]) {
    fullName = profileDisplayName;
  } else if (messageFirstName) {
    fullName = `${messageFirstName} ${messageLastName || ""}`.trim();
  } else {
    fullName = profileDisplayName || "Unknown";
  }

  const email = familyProfile?.email || (careDetails.seeker_email as string) || undefined;
  const phone = familyProfile?.phone || (careDetails.seeker_phone as string) || undefined;

  const profileCareTypes = familyProfile?.care_types || [];
  const profileCareNeeds = (familyMeta.care_needs as string[]) || [];
  const careRecipientAge = familyMeta.age as number | undefined;
  const aboutSituation = (familyMeta.about_situation as string) || familyProfile?.description || undefined;
  const timeline = familyMeta.timeline as string | undefined;
  const schedulePreference = familyMeta.schedule_preference as string | undefined;
  const paymentMethods = familyMeta.payment_methods as string[] | undefined;

  // Profile completeness — same weights as the client mapper /
  // components/portal/profile/completeness.ts
  const hasRealName = !!fullName && fullName.toLowerCase() !== "care seeker";
  let completeness = 0;
  if (familyProfile?.image_url) completeness += 2;
  if (fullName) completeness += 5;
  if (hasRealName) completeness += 5;
  if (familyProfile?.city) completeness += 8;
  if (email) completeness += 10;
  if (phone) completeness += 12;
  if (familyMeta.contact_preference) completeness += 2;
  if (familyMeta.relationship_to_recipient || familyMeta.who_needs_care) completeness += 10;
  if (careRecipientAge) completeness += 2;
  if (aboutSituation || familyProfile?.description) completeness += 4;
  if (profileCareTypes.length > 0) completeness += 8;
  if (profileCareNeeds.length > 0) completeness += 6;
  if (timeline) completeness += 12;
  if (schedulePreference) completeness += 2;
  if (paymentMethods && paymentMethods.length > 0) completeness += 12;
  completeness = Math.min(completeness, 100);

  const quality = calculateLeadQualityScore({
    phone,
    displayName: fullName,
    careTypes: profileCareTypes,
    metadata: familyMeta as FamilyMetadata,
    thread,
    familyProfileId: familyProfile?.id,
    connectionCount: undefined,
  });

  return {
    fullName,
    email: email || undefined,
    phone: phone || undefined,
    completeness,
    quality,
  };
}
