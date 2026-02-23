import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Admin client bypasses RLS — needed to insert rows as other profiles
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// ---------------------------------------------------------------------------
// Family profile seed data
// ---------------------------------------------------------------------------

const SEED_FAMILIES = [
  {
    slug: "seed-family-margaret-thompson",
    display_name: "Margaret Thompson",
    city: "Austin",
    state: "TX",
    care_types: ["Home Care", "Companion Care"],
    metadata: {
      timeline: "immediate",
      care_needs: ["Home Care", "Companion Care", "Medication Management"],
      relationship_to_recipient: "My mother",
      about_situation:
        "My mother is 82 and lives alone. She's mostly independent but needs help with daily tasks like meal prep, light housekeeping, and medication reminders. We're looking for someone compassionate who can visit 3-4 times a week.",
      care_post: { status: "active", published_at: daysAgo(2) },
    },
  },
  {
    slug: "seed-family-james-carol-whitfield",
    display_name: "James & Carol W.",
    city: "Austin",
    state: "TX",
    care_types: ["Memory Care", "Respite Care"],
    metadata: {
      timeline: "within_1_month",
      care_needs: ["Memory Care", "Respite Care"],
      relationship_to_recipient: "My father",
      about_situation:
        "Dad was recently diagnosed with early-stage Alzheimer's. We're exploring memory care options that offer structured activities and a safe environment. He's still quite social and active.",
      care_post: { status: "active", published_at: daysAgo(5) },
    },
  },
  {
    slug: "seed-family-rodriguez",
    display_name: "The Rodriguez Family",
    city: "Houston",
    state: "TX",
    care_types: ["Assisted Living"],
    metadata: {
      timeline: "within_3_months",
      care_needs: ["Assisted Living", "Physical Therapy"],
      relationship_to_recipient: "My grandmother",
      about_situation:
        "Abuela is 89 and recovering from a hip fracture. She needs more support than we can provide at home. Looking for a facility with bilingual staff and a warm community feel.",
      care_post: { status: "active", published_at: daysAgo(8) },
    },
  },
  {
    slug: "seed-family-david-chen",
    display_name: "David Chen",
    city: "Austin",
    state: "TX",
    care_types: ["Home Health", "Skilled Nursing"],
    metadata: {
      timeline: "immediate",
      care_needs: ["Home Health", "Skilled Nursing", "Wound Care"],
      relationship_to_recipient: "My wife",
      about_situation:
        "My wife had surgery last week and needs skilled nursing visits for wound care and physical therapy at home. Insurance covers home health but we need a provider who can start soon.",
      care_post: { status: "active", published_at: daysAgo(1) },
    },
  },
  {
    slug: "seed-family-sarah-mitchell",
    display_name: "Sarah Mitchell",
    city: "San Antonio",
    state: "TX",
    care_types: ["Home Care", "Meal Preparation"],
    metadata: {
      timeline: "exploring",
      care_needs: ["Home Care", "Meal Preparation", "Transportation"],
      relationship_to_recipient: "Myself",
      about_situation:
        "I'm 74 and want to stay in my home as long as possible. Starting to research what help is available — mainly need someone for grocery runs, meal prep, and occasional rides to appointments.",
      care_post: { status: "active", published_at: daysAgo(14) },
    },
  },
  {
    slug: "seed-family-patel",
    display_name: "The Patel Family",
    city: "Austin",
    state: "TX",
    care_types: ["Memory Care", "Adult Day Care"],
    metadata: {
      timeline: "within_1_month",
      care_needs: ["Memory Care", "Adult Day Care", "Respite Care"],
      relationship_to_recipient: "My mother-in-law",
      about_situation:
        "My mother-in-law has moderate dementia and lives with us. We both work full-time and need adult day care during the week. Looking for programs with engaging activities and cultural sensitivity.",
      care_post: { status: "active", published_at: daysAgo(4) },
    },
  },
  {
    slug: "seed-family-robert-linda-jackson",
    display_name: "Robert & Linda J.",
    city: "Round Rock",
    state: "TX",
    care_types: ["Assisted Living", "Independent Living"],
    metadata: {
      timeline: "within_3_months",
      care_needs: ["Assisted Living", "Independent Living"],
      relationship_to_recipient: "My parents",
      about_situation:
        "Both parents are in their late 80s. Dad needs more help than Mom, so we're looking for a community where they can stay together but each get the right level of support.",
      care_post: { status: "active", published_at: daysAgo(10) },
    },
  },
  {
    slug: "seed-family-angela-foster",
    display_name: "Angela Foster",
    city: "Austin",
    state: "TX",
    care_types: ["Hospice", "Palliative Care"],
    metadata: {
      timeline: "immediate",
      care_needs: ["Hospice", "Palliative Care", "Pain Management"],
      relationship_to_recipient: "My father",
      about_situation:
        "My father has been battling cancer and his oncologist recommended transitioning to hospice care. We want to keep him comfortable at home with proper pain management and family support.",
      care_post: { status: "active", published_at: daysAgo(3) },
    },
  },
];

// ---------------------------------------------------------------------------
// Connection seed data (12 connections across 6 months)
// ---------------------------------------------------------------------------

interface ConnectionSeed {
  familyIndex: number;
  status: "pending" | "accepted" | "declined" | "expired";
  monthsAgo: number;
  dayOffset: number;
  message: {
    care_recipient: string;
    care_type: string;
    urgency: string;
    additional_notes: string;
  };
  thread: { fromFamily: boolean; text: string; dayOffset: number }[] | null;
}

const SEED_CONNECTIONS: ConnectionSeed[] = [
  // 6 months ago — 1 expired
  {
    familyIndex: 2,
    status: "expired",
    monthsAgo: 6,
    dayOffset: 12,
    message: {
      care_recipient: "parent",
      care_type: "assisted_living",
      urgency: "within_60_days",
      additional_notes: "Looking for assisted living for my grandmother.",
    },
    thread: null,
  },
  // 5 months ago — 1 declined, 1 expired
  {
    familyIndex: 4,
    status: "declined",
    monthsAgo: 5,
    dayOffset: 8,
    message: {
      care_recipient: "self",
      care_type: "home_care",
      urgency: "researching",
      additional_notes: "Exploring home care options for myself.",
    },
    thread: null,
  },
  {
    familyIndex: 6,
    status: "expired",
    monthsAgo: 5,
    dayOffset: 20,
    message: {
      care_recipient: "parent",
      care_type: "assisted_living",
      urgency: "within_60_days",
      additional_notes: "Researching communities for my parents.",
    },
    thread: null,
  },
  // 4 months ago — 1 accepted, 1 expired
  {
    familyIndex: 0,
    status: "accepted",
    monthsAgo: 4,
    dayOffset: 5,
    message: {
      care_recipient: "parent",
      care_type: "home_care",
      urgency: "within_30_days",
      additional_notes:
        "Need regular home care visits for my mother. She lives alone and needs help with daily tasks.",
    },
    thread: [
      { fromFamily: true, text: "Hi, I'm looking for home care for my mother. She's 82 and needs help with daily tasks. Is this something you can help with?", dayOffset: 0 },
      { fromFamily: false, text: "Absolutely! We'd love to help. Could you tell me more about what kind of support she needs and how often?", dayOffset: 1 },
      { fromFamily: true, text: "She needs help with meal prep, light housekeeping, and medication reminders — about 3-4 times a week.", dayOffset: 1 },
      { fromFamily: false, text: "That sounds very manageable. We have caregivers available in your area. Would you like to schedule a free in-home assessment?", dayOffset: 2 },
    ],
  },
  {
    familyIndex: 5,
    status: "expired",
    monthsAgo: 4,
    dayOffset: 18,
    message: {
      care_recipient: "other",
      care_type: "memory_care",
      urgency: "within_30_days",
      additional_notes: "Looking for adult day care with memory care focus.",
    },
    thread: null,
  },
  // 3 months ago — 1 accepted, 1 declined
  {
    familyIndex: 1,
    status: "accepted",
    monthsAgo: 3,
    dayOffset: 10,
    message: {
      care_recipient: "parent",
      care_type: "memory_care",
      urgency: "within_30_days",
      additional_notes:
        "My father was recently diagnosed with early Alzheimer's. We need structured activities and a safe environment.",
    },
    thread: [
      { fromFamily: true, text: "We're looking for memory care for my dad. He was just diagnosed with early-stage Alzheimer's. Do you have availability?", dayOffset: 0 },
      { fromFamily: false, text: "Thank you for reaching out. Yes, we have openings in our memory care program. We use evidence-based activities tailored to each resident.", dayOffset: 1 },
      { fromFamily: true, text: "That's wonderful. He's still very social — is there a way to visit and see the program in action?", dayOffset: 2 },
    ],
  },
  {
    familyIndex: 3,
    status: "declined",
    monthsAgo: 3,
    dayOffset: 22,
    message: {
      care_recipient: "spouse",
      care_type: "home_health",
      urgency: "immediately",
      additional_notes: "Wife needs skilled nursing after surgery.",
    },
    thread: null,
  },
  // 2 months ago — 2 pending, 1 accepted
  {
    familyIndex: 7,
    status: "accepted",
    monthsAgo: 2,
    dayOffset: 3,
    message: {
      care_recipient: "parent",
      care_type: "hospice",
      urgency: "immediately",
      additional_notes:
        "My father's oncologist recommended hospice care. We want to keep him at home with proper pain management.",
    },
    thread: [
      { fromFamily: true, text: "Our family doctor recommended hospice. We'd like to keep Dad at home — is that something you offer?", dayOffset: 0 },
      { fromFamily: false, text: "Yes, we specialize in in-home hospice care. Our team includes nurses, social workers, and chaplains to support your whole family.", dayOffset: 1 },
      { fromFamily: true, text: "That's a relief. How quickly could we get started? His comfort is our top priority right now.", dayOffset: 1 },
      { fromFamily: false, text: "We can typically begin within 24-48 hours of the physician's referral. I'll have our intake coordinator reach out to discuss next steps.", dayOffset: 2 },
    ],
  },
  {
    familyIndex: 5,
    status: "pending",
    monthsAgo: 2,
    dayOffset: 15,
    message: {
      care_recipient: "other",
      care_type: "adult_day_care",
      urgency: "within_30_days",
      additional_notes:
        "Need adult day care for mother-in-law with moderate dementia. We both work full-time.",
    },
    thread: [
      { fromFamily: true, text: "We need weekday adult day care for my mother-in-law who has moderate dementia. Do you have openings?", dayOffset: 0 },
      { fromFamily: false, text: "We do have availability Monday through Friday. Our program runs from 7:30am to 5:30pm. Would you like to come for a tour?", dayOffset: 1 },
    ],
  },
  {
    familyIndex: 6,
    status: "pending",
    monthsAgo: 2,
    dayOffset: 25,
    message: {
      care_recipient: "parent",
      care_type: "assisted_living",
      urgency: "within_60_days",
      additional_notes:
        "Looking for a place where both parents can live together with different care levels.",
    },
    thread: [
      { fromFamily: true, text: "My parents need different levels of care but want to stay together. Do you have options for couples?", dayOffset: 0 },
    ],
  },
  // This month — 2 pending
  {
    familyIndex: 3,
    status: "pending",
    monthsAgo: 0,
    dayOffset: 5,
    message: {
      care_recipient: "spouse",
      care_type: "home_health",
      urgency: "immediately",
      additional_notes:
        "My wife had surgery and needs skilled nursing visits for wound care at home.",
    },
    thread: [
      { fromFamily: true, text: "My wife just had surgery and her doctor recommended home health visits for wound care. Can you help?", dayOffset: 0 },
      { fromFamily: false, text: "We can absolutely help with post-surgical wound care. Our skilled nurses are experienced with recovery care. Let me check availability in your area.", dayOffset: 1 },
    ],
  },
  {
    familyIndex: 0,
    status: "pending",
    monthsAgo: 0,
    dayOffset: 2,
    message: {
      care_recipient: "parent",
      care_type: "home_care",
      urgency: "within_30_days",
      additional_notes:
        "Need regular companionship and daily help for my elderly mother.",
    },
    thread: [
      { fromFamily: true, text: "Hello! I'm looking for a compassionate caregiver for my mother. She's independent but lonely and could use regular companionship along with help around the house.", dayOffset: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Review seed data
// ---------------------------------------------------------------------------

const SEED_REVIEWS = [
  {
    name: "Patricia Moore",
    rating: 5,
    date: "January 2026",
    comment:
      "The care team has been incredible with my mother. They treat her with dignity and patience, and she actually looks forward to their visits. Communication with the family has been excellent — we always know how Mom is doing.",
    relationship: "Daughter of Resident",
  },
  {
    name: "Michael Davidson",
    rating: 4,
    date: "November 2025",
    comment:
      "Good overall experience. The caregivers are professional and reliable. Only reason for 4 stars is that scheduling changes sometimes take a day or two to process. But the quality of care itself is very good.",
    relationship: "Son of Client",
  },
  {
    name: "Barbara Sullivan",
    rating: 5,
    date: "September 2025",
    comment:
      "I can't say enough good things about this team. After my husband's stroke, they stepped in and made our transition to in-home care seamless. The nurses are skilled, kind, and truly go above and beyond.",
    relationship: "Spouse of Resident",
  },
  {
    name: "Thomas Greene",
    rating: 3,
    date: "July 2025",
    comment:
      "Decent care but communication could improve. There were a few times when the caregiver schedule changed without notice. The actual caregivers themselves are wonderful people — it's more of an organizational issue.",
    relationship: "Family Member",
  },
  {
    name: "Jennifer Harris",
    rating: 5,
    date: "March 2025",
    comment:
      "From day one, the staff made my father feel at home. They took time to learn his preferences and routines. He's happier and healthier than he's been in years. We're so grateful we found them.",
    relationship: "Daughter of Client",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function monthsAgoDate(months: number, dayOfMonth: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(Math.min(dayOfMonth, 28)); // Avoid overflow
  d.setHours(9, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// POST /api/dev/seed-provider-hub
// ---------------------------------------------------------------------------

export async function POST() {
  try {
    // ── Auth ──
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Get provider profile ──
    const { data: account } = await supabase
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile found" },
        { status: 400 }
      );
    }

    // Verify it's an organization/caregiver profile
    const { data: providerProfile } = await supabase
      .from("business_profiles")
      .select("id, type, display_name, phone, email, city, state, description, image_url, metadata")
      .eq("id", account.active_profile_id)
      .single();

    if (
      !providerProfile ||
      (providerProfile.type !== "organization" && providerProfile.type !== "caregiver")
    ) {
      return NextResponse.json(
        { error: "Active profile is not a provider" },
        { status: 400 }
      );
    }

    const providerId = providerProfile.id;
    const admin = getAdminClient();
    const db = admin || supabase;

    const result = {
      status: "seeded",
      families: { created: 0, skipped: 0 },
      connections: { created: 0, skipped: 0 },
      reviews: { set: false, count: 0 },
      profileEnriched: false,
    };

    // ====================================================================
    // 1. Seed family profiles
    // ====================================================================

    const familyIds: string[] = [];
    const existingSlugs = new Set<string>();

    // Check which families already exist
    const { data: existingFamilies } = await db
      .from("business_profiles")
      .select("id, slug")
      .in(
        "slug",
        SEED_FAMILIES.map((f) => f.slug)
      );

    for (const f of existingFamilies || []) {
      existingSlugs.add(f.slug);
    }

    // Build a slug→id map for existing families
    const slugToId = new Map<string, string>();
    for (const f of existingFamilies || []) {
      slugToId.set(f.slug, f.id);
    }

    for (const family of SEED_FAMILIES) {
      if (existingSlugs.has(family.slug)) {
        familyIds.push(slugToId.get(family.slug)!);
        result.families.skipped++;
        continue;
      }

      const { data: inserted, error: insertError } = await db
        .from("business_profiles")
        .insert({
          slug: family.slug,
          type: "family",
          category: null,
          display_name: family.display_name,
          city: family.city,
          state: family.state,
          care_types: family.care_types,
          metadata: family.metadata,
          claim_state: "claimed",
          verification_state: "unverified",
          source: "seeded",
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`[seed] family insert error (${family.slug}):`, insertError.message);
        familyIds.push(""); // Placeholder to keep indexing correct
        continue;
      }

      familyIds.push(inserted.id);
      result.families.created++;
    }

    // ====================================================================
    // 2. Seed connections
    // ====================================================================

    // Check existing connections to this provider from seeded families
    const validFamilyIds = familyIds.filter(Boolean);
    let existingConnectionFromIds = new Set<string>();

    if (validFamilyIds.length > 0) {
      const { data: existingConns } = await db
        .from("connections")
        .select("from_profile_id")
        .eq("to_profile_id", providerId)
        .in("from_profile_id", validFamilyIds);

      existingConnectionFromIds = new Set(
        (existingConns || []).map((c) => c.from_profile_id as string)
      );
    }

    for (const conn of SEED_CONNECTIONS) {
      const familyId = familyIds[conn.familyIndex];
      if (!familyId) {
        result.connections.skipped++;
        continue;
      }

      // Allow multiple connections from same family (different time periods)
      // but check the exact pair hasn't been seeded
      // Use a combined check — same family + similar status
      if (existingConnectionFromIds.has(familyId)) {
        // Check if this specific status combination already exists
        const { data: exactMatch } = await db
          .from("connections")
          .select("id")
          .eq("from_profile_id", familyId)
          .eq("to_profile_id", providerId)
          .eq("status", conn.status)
          .limit(1);

        if (exactMatch && exactMatch.length > 0) {
          result.connections.skipped++;
          continue;
        }
      }

      const createdAt = monthsAgoDate(conn.monthsAgo, conn.dayOffset);

      // Build thread if present
      let metadata: Record<string, unknown> = {};
      if (conn.thread) {
        const thread = conn.thread.map((msg) => {
          const msgDate = new Date(createdAt);
          msgDate.setDate(msgDate.getDate() + msg.dayOffset);
          msgDate.setHours(9 + conn.thread!.indexOf(msg), 0, 0, 0);
          return {
            from_profile_id: msg.fromFamily ? familyId : providerId,
            text: msg.text,
            created_at: msgDate.toISOString(),
          };
        });
        metadata = { thread };
      }

      const { error: connError } = await db
        .from("connections")
        .insert({
          from_profile_id: familyId,
          to_profile_id: providerId,
          type: "inquiry",
          status: conn.status,
          message: JSON.stringify(conn.message),
          metadata,
          created_at: createdAt.toISOString(),
        });

      if (connError) {
        console.error(
          `[seed] connection insert error (family ${conn.familyIndex}, ${conn.status}):`,
          connError.message
        );
        result.connections.skipped++;
        continue;
      }

      result.connections.created++;
      existingConnectionFromIds.add(familyId);
    }

    // ====================================================================
    // 3. Seed reviews on provider profile
    // ====================================================================

    const currentMeta = (providerProfile.metadata || {}) as Record<string, unknown>;
    const existingReviews = currentMeta.reviews as unknown[] | undefined;

    if (!existingReviews || existingReviews.length === 0) {
      const avgRating =
        Math.round(
          (SEED_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / SEED_REVIEWS.length) * 10
        ) / 10;

      const { error: reviewError } = await db
        .from("business_profiles")
        .update({
          metadata: {
            ...currentMeta,
            reviews: SEED_REVIEWS,
            rating: avgRating,
            review_count: SEED_REVIEWS.length,
          },
        })
        .eq("id", providerId);

      if (reviewError) {
        console.error("[seed] review update error:", reviewError.message);
      } else {
        result.reviews.set = true;
        result.reviews.count = SEED_REVIEWS.length;
      }
    }

    // ====================================================================
    // 4. Enrich provider profile (fill missing fields for verification/stats)
    // ====================================================================

    const updates: Record<string, unknown> = {};

    if (!providerProfile.phone?.trim()) {
      updates.phone = "(512) 555-0199";
    }
    if (!providerProfile.email?.trim()) {
      const safeName = (providerProfile.display_name || "provider")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      updates.email = `care@${safeName}.com`;
    }
    if (!providerProfile.city?.trim()) {
      updates.city = "Austin";
    }
    if (!providerProfile.state?.trim()) {
      updates.state = "TX";
    }
    if (!providerProfile.description?.trim() || providerProfile.description.trim().length < 50) {
      updates.description =
        "We provide compassionate, professional care tailored to each individual's needs. Our experienced team is dedicated to helping seniors maintain their independence and quality of life in a safe, supportive environment.";
    }

    if (Object.keys(updates).length > 0) {
      const { error: enrichError } = await db
        .from("business_profiles")
        .update(updates)
        .eq("id", providerId);

      if (enrichError) {
        console.error("[seed] profile enrich error:", enrichError.message);
      } else {
        result.profileEnriched = true;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[seed] provider hub error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
