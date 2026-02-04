/**
 * Shared mock provider data for development.
 *
 * Both the landing page (client component) and the provider detail page
 * (server component) import from here so mock data stays in sync.
 */

import type { Provider, StaffMember } from "@/components/providers/ProviderCard";
import type { Profile, ProfileCategory, OrganizationMetadata } from "@/lib/types";

// ============================================================
// Top Providers (the 6 featured cards on the homepage)
// ============================================================

export const topProviders: Provider[] = [
  {
    id: "1",
    slug: "sunrise-senior-living",
    name: "Sunrise Senior Living",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800",
    ],
    address: "1234 Oak Street, Austin, TX 78701",
    rating: 4.8,
    reviewCount: 47,
    priceRange: "$3,500/mo",
    primaryCategory: "Assisted Living",
    careTypes: ["Memory Care", "Respite Care"],
    highlights: ["24/7 Nursing Staff", "Pet Friendly", "Private Rooms"],
    acceptedPayments: ["Medicare", "Medicaid", "Private Pay"],
    verified: true,
    badge: "Top Rated",
    description:
      "Award-winning senior living community with personalized care plans. Our dedicated team provides compassionate, around-the-clock support in a warm, home-like environment. We specialize in assisted living and memory care, offering individualized programs that promote independence while ensuring safety and comfort.",
    staffImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200",
    staff: {
      name: "Dr. Sarah Mitchell",
      position: "Director of Care",
      bio: "Board-certified geriatrician with 15+ years experience in senior care. Passionate about creating personalized care plans that prioritize dignity and quality of life.",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200",
    },
  },
  {
    id: "2",
    slug: "harmony-care-home",
    name: "Harmony Care Home",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
    images: [
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    ],
    address: "5678 Maple Avenue, Austin, TX 78702",
    rating: 4.6,
    reviewCount: 21,
    priceRange: "$4,200/mo",
    primaryCategory: "Memory Care",
    careTypes: ["Hospice", "Skilled Nursing"],
    highlights: ["Dementia Specialists", "Secured Facility", "Family Support"],
    acceptedPayments: ["Medicaid", "Long-term Insurance"],
    verified: true,
    description:
      "Specialized memory care community with 24/7 nursing support. Our evidence-based approach combines clinical excellence with compassionate care, providing a secure and stimulating environment for individuals with Alzheimer's and dementia.",
  },
  {
    id: "3",
    slug: "golden-years-residence",
    name: "Golden Years Residence",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    images: [
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    ],
    address: "910 Pine Road, Austin, TX 78703",
    rating: 4.5,
    reviewCount: 12,
    priceRange: "$2,800/mo",
    primaryCategory: "Independent Living",
    careTypes: ["Assisted Living"],
    highlights: ["Active Lifestyle", "On-site Fitness", "Social Events"],
    acceptedPayments: ["Private Pay", "Veterans Benefits"],
    verified: true,
    badge: "New",
    description:
      "Modern community designed for active, independent seniors. Enjoy resort-style amenities, daily fitness classes, social events, and the peace of mind that comes with on-site wellness support whenever you need it.",
    staffImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200",
    staff: {
      name: "Michael Chen",
      position: "Activities Director",
      bio: "Certified recreation therapist dedicated to keeping seniors active and engaged. Organizes daily fitness classes, social events, and community outings.",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200",
    },
  },
  {
    id: "4",
    slug: "caring-hearts-home-care",
    name: "Caring Hearts Home Care",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800",
    images: [
      "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800",
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    ],
    address: "Serving Greater Austin Area",
    rating: 4.9,
    reviewCount: 83,
    priceRange: "$25/hr",
    primaryCategory: "Home Care",
    careTypes: ["Respite Care", "Companion Care"],
    highlights: ["Flexible Scheduling", "Background Checked", "Bilingual Staff"],
    acceptedPayments: ["Medicare", "Private Pay"],
    verified: true,
    description:
      "Compassionate in-home care tailored to your loved one's needs. Our carefully screened and trained caregivers provide personal care, meal preparation, medication reminders, and companionship in the comfort of home.",
  },
  {
    id: "5",
    slug: "oak-meadows-retirement",
    name: "Oak Meadows Retirement",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    ],
    address: "2345 Elm Street, Austin, TX 78704",
    rating: 4.7,
    reviewCount: 38,
    priceRange: "$3,200/mo",
    primaryCategory: "Independent Living",
    careTypes: ["Assisted Living"],
    highlights: ["Golf Course Access", "Fine Dining", "Spa Services"],
    acceptedPayments: ["Private Pay", "Long-term Insurance"],
    verified: true,
    badge: "Featured",
    description:
      "Luxury retirement living with resort-style amenities. From our championship golf course to our award-winning dining program, every detail is designed to make retirement the best chapter of your life.",
  },
  {
    id: "6",
    slug: "peaceful-pines-hospice",
    name: "Peaceful Pines Hospice",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
    images: [
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800",
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800",
    ],
    address: "789 Willow Lane, Austin, TX 78705",
    rating: 4.9,
    reviewCount: 56,
    priceRange: "$4,800/mo",
    primaryCategory: "Hospice",
    careTypes: ["Skilled Nursing", "Memory Care"],
    highlights: ["Palliative Care", "Family Counseling", "24/7 Support"],
    acceptedPayments: ["Medicare", "Medicaid", "Private Pay"],
    verified: true,
    description:
      "Compassionate end-of-life care with dignity. Our interdisciplinary team provides expert symptom management, emotional and spiritual support, and family counseling in a peaceful, home-like setting.",
    staffImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200",
    staff: {
      name: "Dr. Emily Watson",
      position: "Medical Director",
      bio: "Hospice and palliative medicine specialist dedicated to ensuring comfort and quality of life for patients and their families.",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200",
    },
  },
];

// ============================================================
// Browse-by-category providers (derived from top providers)
// ============================================================

export const providersByCategory: Record<string, Provider[]> = {
  "home-care": [
    { ...topProviders[3], primaryCategory: "Home Care" },
    { ...topProviders[0], id: "hc-2", primaryCategory: "Home Care", name: "Comfort Keepers", slug: "comfort-keepers" },
    { ...topProviders[1], id: "hc-3", primaryCategory: "Home Care", name: "Home Instead", slug: "home-instead" },
    { ...topProviders[2], id: "hc-4", primaryCategory: "Home Care", name: "Visiting Angels", slug: "visiting-angels" },
    { ...topProviders[4], id: "hc-5", primaryCategory: "Home Care", name: "Right at Home", slug: "right-at-home" },
    { ...topProviders[5], id: "hc-6", primaryCategory: "Home Care", name: "BrightStar Care", slug: "brightstar-care" },
    { ...topProviders[0], id: "hc-7", primaryCategory: "Home Care", name: "Seniors Helping Seniors", slug: "seniors-helping-seniors" },
    { ...topProviders[1], id: "hc-8", primaryCategory: "Home Care", name: "Griswold Home Care", slug: "griswold-home-care" },
  ],
  "home-health": [
    { ...topProviders[5], primaryCategory: "Home Health" },
    { ...topProviders[0], id: "hh-2", primaryCategory: "Home Health", name: "Amedisys", slug: "amedisys" },
    { ...topProviders[1], id: "hh-3", primaryCategory: "Home Health", name: "LHC Group", slug: "lhc-group" },
    { ...topProviders[2], id: "hh-4", primaryCategory: "Home Health", name: "Kindred at Home", slug: "kindred-at-home" },
    { ...topProviders[3], id: "hh-5", primaryCategory: "Home Health", name: "AccordantHealth", slug: "accordanthealth" },
    { ...topProviders[4], id: "hh-6", primaryCategory: "Home Health", name: "Enhabit Home Health", slug: "enhabit-home-health" },
    { ...topProviders[5], id: "hh-7", primaryCategory: "Home Health", name: "Elara Caring", slug: "elara-caring" },
    { ...topProviders[0], id: "hh-8", primaryCategory: "Home Health", name: "Bayada Home Health", slug: "bayada-home-health" },
  ],
  "assisted-living": [
    { ...topProviders[0], primaryCategory: "Assisted Living" },
    { ...topProviders[1], id: "al-2", primaryCategory: "Assisted Living", name: "Brookdale Senior Living", slug: "brookdale-senior-living" },
    { ...topProviders[2], id: "al-3", primaryCategory: "Assisted Living", name: "Five Star Senior Living", slug: "five-star-senior-living" },
    { ...topProviders[3], id: "al-4", primaryCategory: "Assisted Living", name: "Atria Senior Living", slug: "atria-senior-living" },
    { ...topProviders[4], id: "al-5", primaryCategory: "Assisted Living", name: "Senior Lifestyle", slug: "senior-lifestyle" },
    { ...topProviders[5], id: "al-6", primaryCategory: "Assisted Living", name: "Silverado", slug: "silverado" },
    { ...topProviders[0], id: "al-7", primaryCategory: "Assisted Living", name: "Belmont Village", slug: "belmont-village" },
    { ...topProviders[1], id: "al-8", primaryCategory: "Assisted Living", name: "Merrill Gardens", slug: "merrill-gardens" },
  ],
  "memory-care": [
    { ...topProviders[1], primaryCategory: "Memory Care" },
    { ...topProviders[0], id: "mc-2", primaryCategory: "Memory Care", name: "Silverado Memory Care", slug: "silverado-memory-care" },
    { ...topProviders[2], id: "mc-3", primaryCategory: "Memory Care", name: "Arden Courts", slug: "arden-courts" },
    { ...topProviders[3], id: "mc-4", primaryCategory: "Memory Care", name: "Sunrise Memory Care", slug: "sunrise-memory-care" },
    { ...topProviders[4], id: "mc-5", primaryCategory: "Memory Care", name: "Artis Senior Living", slug: "artis-senior-living" },
    { ...topProviders[5], id: "mc-6", primaryCategory: "Memory Care", name: "Autumn Leaves", slug: "autumn-leaves" },
    { ...topProviders[0], id: "mc-7", primaryCategory: "Memory Care", name: "The Kensington", slug: "the-kensington" },
    { ...topProviders[1], id: "mc-8", primaryCategory: "Memory Care", name: "Bridges by EPOCH", slug: "bridges-by-epoch" },
  ],
  "independent-living": [
    { ...topProviders[2], primaryCategory: "Independent Living" },
    { ...topProviders[0], id: "il-2", primaryCategory: "Independent Living", name: "Vi Living", slug: "vi-living" },
    { ...topProviders[1], id: "il-3", primaryCategory: "Independent Living", name: "Holiday Retirement", slug: "holiday-retirement" },
    { ...topProviders[3], id: "il-4", primaryCategory: "Independent Living", name: "Erickson Living", slug: "erickson-living" },
    { ...topProviders[4], id: "il-5", primaryCategory: "Independent Living", name: "Leisure Care", slug: "leisure-care" },
    { ...topProviders[5], id: "il-6", primaryCategory: "Independent Living", name: "Watermark Retirement", slug: "watermark-retirement" },
    { ...topProviders[0], id: "il-7", primaryCategory: "Independent Living", name: "Aegis Living", slug: "aegis-living" },
    { ...topProviders[1], id: "il-8", primaryCategory: "Independent Living", name: "Kisco Senior Living", slug: "kisco-senior-living" },
  ],
  "nursing-home": [
    { ...topProviders[5], primaryCategory: "Nursing Home" },
    { ...topProviders[0], id: "nh-2", primaryCategory: "Nursing Home", name: "Genesis HealthCare", slug: "genesis-healthcare" },
    { ...topProviders[1], id: "nh-3", primaryCategory: "Nursing Home", name: "PruittHealth", slug: "pruitthealth" },
    { ...topProviders[2], id: "nh-4", primaryCategory: "Nursing Home", name: "Ensign Group", slug: "ensign-group" },
    { ...topProviders[3], id: "nh-5", primaryCategory: "Nursing Home", name: "Sabra Health Care", slug: "sabra-health-care" },
    { ...topProviders[4], id: "nh-6", primaryCategory: "Nursing Home", name: "ProMedica Senior Care", slug: "promedica-senior-care" },
    { ...topProviders[5], id: "nh-7", primaryCategory: "Nursing Home", name: "Life Care Centers", slug: "life-care-centers" },
    { ...topProviders[0], id: "nh-8", primaryCategory: "Nursing Home", name: "Consulate Health Care", slug: "consulate-health-care" },
  ],
};

// ============================================================
// Helpers
// ============================================================

/**
 * Look up a mock provider by slug across all data sets.
 * Searches topProviders first, then every category bucket.
 */
export function getProviderBySlug(slug: string): Provider | null {
  // Search top providers
  const fromTop = topProviders.find((p) => p.slug === slug);
  if (fromTop) return fromTop;

  // Search category providers
  for (const providers of Object.values(providersByCategory)) {
    const found = providers.find((p) => p.slug === slug);
    if (found) return found;
  }

  return null;
}

/**
 * Map the card-side `Provider` type to the database `Profile` type
 * so the provider detail page can render without changes.
 */

// Map human-readable category names to ProfileCategory enum values
const categoryMap: Record<string, ProfileCategory> = {
  "Assisted Living": "assisted_living",
  "Home Care": "home_care_agency",
  "Home Health": "home_health_agency",
  "Memory Care": "memory_care",
  "Independent Living": "independent_living",
  "Nursing Home": "nursing_home",
  "Hospice": "hospice_agency",
  "Skilled Nursing": "nursing_home",
  "Respite Care": "home_care_agency",
  "Companion Care": "home_care_agency",
};

export function mockProviderToProfile(provider: Provider): Profile {
  // Parse "city, state" from address like "1234 Oak Street, Austin, TX 78701"
  const addressParts = provider.address.split(",").map((s) => s.trim());
  let city: string | null = null;
  let state: string | null = null;

  if (addressParts.length >= 3) {
    // "1234 Oak Street", "Austin", "TX 78701"
    city = addressParts[1];
    const stateZip = addressParts[2].split(" ");
    state = stateZip[0] || null;
  } else if (addressParts.length === 2) {
    city = addressParts[0];
    const stateZip = addressParts[1].split(" ");
    state = stateZip[0] || null;
  }

  // Build metadata with extra mock-specific fields
  const metadata: OrganizationMetadata & {
    rating?: number;
    review_count?: number;
    images?: string[];
    staff?: StaffMember;
    badge?: string;
    accepted_payments?: string[];
  } = {
    price_range: provider.priceRange,
    amenities: provider.highlights || [],
    accepts_medicaid: provider.acceptedPayments?.includes("Medicaid") ?? false,
    accepts_medicare: provider.acceptedPayments?.includes("Medicare") ?? false,
    // Extra fields the detail page can read from metadata
    rating: provider.rating,
    review_count: provider.reviewCount,
    images: provider.images,
    staff: provider.staff,
    badge: provider.badge,
    accepted_payments: provider.acceptedPayments,
  };

  return {
    id: provider.id,
    account_id: null,
    slug: provider.slug,
    type: "organization",
    category: categoryMap[provider.primaryCategory] || "assisted_living",
    display_name: provider.name,
    description: provider.description || null,
    image_url: provider.image,
    phone: "(512) 555-0100",
    email: `info@${provider.slug}.com`,
    website: `https://www.${provider.slug}.com`,
    address: provider.address,
    city,
    state,
    zip: null,
    lat: null,
    lng: null,
    service_area: "Greater Austin Area",
    care_types: [provider.primaryCategory, ...provider.careTypes],
    metadata,
    claim_state: "claimed",
    verification_state: provider.verified ? "verified" : "unverified",
    source: "seeded",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
