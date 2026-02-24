import type { Profile } from "@/lib/types";

// Extended metadata shape — matches the JSONB metadata stored on provider profiles
export interface ExtendedMetadata {
  // Core organization fields
  license_number?: string;
  year_founded?: number;
  bed_count?: number;
  staff_count?: number;
  accepts_medicaid?: boolean;
  accepts_medicare?: boolean;
  amenities?: string[];
  hours?: string;
  price_range?: string;

  // Caregiver fields
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  certifications?: string[];
  years_experience?: number;
  languages?: string[];
  availability?: string;

  // Extended fields (enriched from olera-providers / mock data)
  rating?: number;
  review_count?: number;
  images?: string[];
  staff?: { name: string; position: string; bio: string; image: string };
  badge?: string;
  accepted_payments?: string[];
  pricing_details?: { service: string; rate: string; rateType: string }[];
  staff_screening?: {
    background_checked: boolean;
    licensed: boolean;
    insured: boolean;
  };
  reviews?: {
    name: string;
    rating: number;
    date: string;
    comment: string;
    relationship?: string;
  }[];
  community_score?: number;
  value_score?: number;
  info_score?: number;
}

export interface SectionScore {
  id: string;
  label: string;
  percent: number;
}

export interface ProfileCompleteness {
  overall: number;
  sections: SectionScore[];
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scoreProfileOverview(profile: Profile): number {
  let score = 0;
  if (profile.display_name?.trim()) score += 25;
  if (profile.category) score += 25;
  if (profile.address?.trim() || (profile.city?.trim() && profile.state?.trim()))
    score += 25;
  if (profile.image_url?.trim()) score += 25;
  return clamp(score);
}

function scorePricing(meta: ExtendedMetadata): number {
  let score = 0;
  if (meta.price_range?.trim()) score += 50;
  if (meta.pricing_details && meta.pricing_details.length > 0) score += 50;
  return clamp(score);
}

function scoreStaffScreening(meta: ExtendedMetadata): number {
  if (!meta.staff_screening) return 0;
  let score = 0;
  if (meta.staff_screening.background_checked) score += 34;
  if (meta.staff_screening.licensed) score += 33;
  if (meta.staff_screening.insured) score += 33;
  return clamp(score);
}

function scoreCareServices(profile: Profile): number {
  const count = profile.care_types?.length ?? 0;
  if (count >= 5) return 100;
  if (count >= 1) return 50;
  return 0;
}

function scoreGallery(meta: ExtendedMetadata): number {
  const count = meta.images?.length ?? 0;
  if (count >= 8) return 100;
  if (count >= 5) return 75;
  if (count >= 3) return 50;
  if (count >= 1) return 25;
  return 0;
}

function scoreAbout(profile: Profile): number {
  const desc = profile.description?.trim() ?? "";
  if (desc.length >= 100) return 100;
  if (desc.length > 0) return 50;
  return 0;
}

function scorePaymentInsurance(meta: ExtendedMetadata): number {
  const count = meta.accepted_payments?.length ?? 0;
  if (count >= 3) return 100;
  if (count >= 1) return 50;
  return 0;
}

export function calculateProfileCompleteness(
  profile: Profile,
  metadata: ExtendedMetadata
): ProfileCompleteness {
  const sections: SectionScore[] = [
    {
      id: "overview",
      label: "Profile overview",
      percent: scoreProfileOverview(profile),
    },
    { id: "pricing", label: "Pricing", percent: scorePricing(metadata) },
    {
      id: "screening",
      label: "Staff screening",
      percent: scoreStaffScreening(metadata),
    },
    {
      id: "services",
      label: "Care services",
      percent: scoreCareServices(profile),
    },
    { id: "gallery", label: "Gallery", percent: scoreGallery(metadata) },
    { id: "about", label: "About", percent: scoreAbout(profile) },
    {
      id: "payment",
      label: "Accepted Payments & Insurance",
      percent: scorePaymentInsurance(metadata),
    },
  ];

  const overall =
    sections.length > 0
      ? Math.round(
          sections.reduce((sum, s) => sum + s.percent, 0) / sections.length
        )
      : 0;

  return { overall, sections };
}
