/**
 * Map a MedJobs candidate (student) onto the directory's ProviderCardData so the
 * provider candidate board renders the ONE base card (BrowseCard, variant
 * "candidate") — a person in the same shell: photo/initials in the image frame,
 * name, track · university, availability/trust as highlights.
 */

import type { CandidateData } from "@/components/medjobs/CandidateRow";
import type { ProviderCardData } from "@/lib/types/provider";
import { getTrackLabel, formatHoursPerWeek, hasVideo } from "@/lib/medjobs-helpers";

const AVAIL_LABELS: Record<string, string> = {
  in_between_classes: "Between classes",
  evenings: "Evenings",
  weekends: "Weekends",
  overnights: "Overnights",
};

// Provider coverage buckets (day/evening/overnight/weekend) → student
// availability_types, for the "Covers your …" match line.
const BUCKET_TO_AVAIL: Record<string, string> = {
  day: "in_between_classes",
  evening: "evenings",
  overnight: "overnights",
  weekend: "weekends",
};
const BUCKET_LABEL: Record<string, string> = {
  day: "days",
  evening: "evenings",
  overnight: "overnights",
  weekend: "weekends",
};

/** "Covers your evenings & weekends" — given a provider's buckets + a student. */
export function candidateMatchLabel(
  matchBuckets: string[] | undefined,
  candidate: CandidateData,
): string | null {
  if (!matchBuckets || matchBuckets.length === 0) return null;
  const types = candidate.metadata.availability_types ?? [];
  const covered = matchBuckets.filter((b) => types.includes(BUCKET_TO_AVAIL[b]));
  if (covered.length === 0) return null;
  const labels = covered.map((b) => BUCKET_LABEL[b] ?? b);
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
  return `Covers your ${list}`;
}

export function candidateToCardFormat(
  c: CandidateData,
  opts?: { isDemo?: boolean },
): ProviderCardData {
  const meta = c.metadata;
  const track = getTrackLabel(meta) || "Pre-health student";
  const hours = formatHoursPerWeek(meta);
  const verifiedHours = meta.total_verified_hours ?? 0;
  const certs = meta.certifications || [];
  const avail = (meta.availability_types ?? []).map((t) => AVAIL_LABELS[t] || t);

  const highlights: string[] = [];
  if (verifiedHours > 0) highlights.push(`${verifiedHours} hrs verified`);
  if (hasVideo(meta)) highlights.push("Video intro");
  if (avail.length) highlights.push(avail.slice(0, 2).join(", "));
  if (hours) highlights.push(hours);
  if (certs[0]) highlights.push(certs[0].split(" (")[0]);

  const location = [c.city, c.state].filter(Boolean).join(", ");
  // Demo profiles suppress campus/location (campus-honesty), like the old card.
  const subtitle = opts?.isDemo ? "" : meta.university || location;

  return {
    id: c.id,
    slug: c.slug,
    name: c.display_name,
    image: c.image_url || "",
    imageType: c.image_url ? "photo" : "placeholder",
    images: c.image_url ? [c.image_url] : [],
    address: subtitle,
    rating: 0,
    priceRange: "",
    primaryCategory: track,
    careTypes: [track],
    highlights: highlights.slice(0, 3),
    acceptedPayments: [],
    verified: verifiedHours > 0 || hasVideo(meta),
  };
}
