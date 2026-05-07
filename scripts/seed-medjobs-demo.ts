/**
 * scripts/seed-medjobs-demo.ts
 *
 * v9.0 demo data seed for the MedJobs admin surface.
 *
 * Six campuses, each at a different operational maturity stage, exercising
 * every code path in the In Basket / Completed Tasks / All Tasks experience:
 *
 *   A. u-houston   — brand new (provider_prospecting, no activity)
 *   B. ut-austin   — provider funnel running (8 catchment providers, 0 clients)
 *   C. u-florida   — Stage 2 just unlocked (1 client, 0 stakeholders → banner)
 *   D. duke        — active workflow (1 client + 8 stakeholders, full inbox)
 *   E. vanderbilt  — mature partner-rich (2 clients + 4 partners + 6 candidates)
 *   F. uva         — terminal-state graveyard (5 closed rows, 1 redirected)
 *
 * All seeded records are tagged so re-running the script (default behavior)
 * wipes prior demo data first:
 *   - business_profiles → metadata.demo_data_v1 = true
 *   - student_outreach  → notes prefix "[DEMO_DATA_V1]"
 *   - cascade FKs handle contacts / touchpoints / tasks / interviews
 *
 * Usage:
 *   npx tsx scripts/seed-medjobs-demo.ts          # wipe + re-seed (default)
 *   npx tsx scripts/seed-medjobs-demo.ts --keep   # additive (don't wipe)
 *   npx tsx scripts/seed-medjobs-demo.ts --dry-run # preview without writing
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ──────────────────────────────────────────────────────────────────────────
// Config + helpers
// ──────────────────────────────────────────────────────────────────────────

const DEMO_MARKER_FIELD = "demo_data_v1";
const NOTES_MARKER = "[DEMO_DATA_V1]";

const args = process.argv.slice(2);
const KEEP = args.includes("--keep");
const DRY_RUN = args.includes("--dry-run");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NOW = Date.now();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(NOW - n * 60 * 60 * 1000).toISOString();
const minutesAgo = (n: number) => new Date(NOW - n * 60 * 1000).toISOString();
const daysFromNow = (n: number) =>
  new Date(NOW + n * 24 * 60 * 60 * 1000).toISOString();
const demoNotes = (s: string) => `${NOTES_MARKER} ${s}`;

let inserted = {
  providers: 0,
  students: 0,
  outreach: 0,
  contacts: 0,
  touchpoints: 0,
  tasks: 0,
  interviews: 0,
};

// ──────────────────────────────────────────────────────────────────────────
// Wipe + campus setup
// ──────────────────────────────────────────────────────────────────────────

async function wipeDemoData() {
  console.log("⏳ Wiping prior demo data…");

  // Find demo student_outreach rows by notes marker. Cascades drop
  // contacts / touchpoints / tasks via FK ON DELETE CASCADE.
  const { data: oRows } = await db
    .from("student_outreach")
    .select("id")
    .like("notes", `${NOTES_MARKER}%`);
  const oIds = ((oRows ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (oIds.length > 0) {
    if (!DRY_RUN) {
      await db.from("student_outreach").delete().in("id", oIds);
    }
    console.log(`   removed ${oIds.length} student_outreach rows (cascades to touchpoints/tasks/contacts)`);
  }

  // Find demo business_profiles by metadata marker. Cascades drop
  // interviews via FK ON DELETE CASCADE.
  const { data: bRows } = await db
    .from("business_profiles")
    .select("id")
    .contains("metadata", { [DEMO_MARKER_FIELD]: true });
  const bIds = ((bRows ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (bIds.length > 0) {
    if (!DRY_RUN) {
      await db.from("business_profiles").delete().in("id", bIds);
    }
    console.log(`   removed ${bIds.length} business_profiles (cascades to interviews)`);
  }

  console.log("   ✓ demo data cleared");
}

async function setupCampuses(): Promise<Record<string, string>> {
  console.log("⏳ Resolving + updating campus state…");

  // Match by slug. Campuses are seeded by migration 064 already.
  const slugs = ["u-houston", "ut-austin", "u-florida", "duke", "vanderbilt", "uva"];
  const { data: rows } = await db
    .from("student_outreach_campuses")
    .select("id, slug")
    .in("slug", slugs);

  const idBySlug: Record<string, string> = {};
  for (const r of (rows ?? []) as Array<{ id: string; slug: string }>) {
    idBySlug[r.slug] = r.id;
  }

  for (const slug of slugs) {
    if (!idBySlug[slug]) {
      console.error(`   ✗ campus ${slug} not found — run migration 064 first`);
      process.exit(1);
    }
  }

  // Per-scenario state. UVA is the only campus with research_complete=true
  // (Campus F = mature, terminal-state rows). The others stay
  // research_complete=false so the catchment-derived stage logic governs.
  const updates = [
    { slug: "u-houston",  research_complete: false },
    { slug: "ut-austin",  research_complete: false },
    { slug: "u-florida",  research_complete: false },
    { slug: "duke",       research_complete: false },
    { slug: "vanderbilt", research_complete: false },
    { slug: "uva",        research_complete: true },
  ];

  if (!DRY_RUN) {
    for (const u of updates) {
      await db
        .from("student_outreach_campuses")
        .update({ research_complete: u.research_complete })
        .eq("slug", u.slug);
    }
  }
  console.log("   ✓ 6 campuses set");

  return idBySlug;
}

// ──────────────────────────────────────────────────────────────────────────
// Provider seeding
// ──────────────────────────────────────────────────────────────────────────

interface ProviderSeed {
  id: string;
  display_name: string;
  business_name: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  /** ISO timestamp when T&C was accepted, or null. */
  termsAcceptedAt: string | null;
  /** True when subscribed via Stripe. */
  subscriptionActive: boolean;
  /** Stripe customer id stub when subscriptionActive. */
  stripeCustomerId: string | null;
}

function makeProvider(args: {
  display_name: string;
  city: string;
  state: string;
  termsAcceptedAt?: string | null;
  subscriptionActive?: boolean;
  stripeCustomerId?: string | null;
}): ProviderSeed {
  return {
    id: randomUUID(),
    display_name: args.display_name,
    business_name: args.display_name,
    city: args.city,
    state: args.state,
    email: `contact@${args.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    termsAcceptedAt: args.termsAcceptedAt ?? null,
    subscriptionActive: args.subscriptionActive ?? false,
    stripeCustomerId: args.stripeCustomerId ?? null,
  };
}

const providers: Record<string, ProviderSeed[]> = {
  // Campus B — UT Austin catchment. 8 providers, 0 clients (Stage 1).
  ut_austin: [
    makeProvider({ display_name: "Sunshine Senior Care",       city: "Austin",      state: "TX" }),
    makeProvider({ display_name: "Capital Caregivers",         city: "Austin",      state: "TX" }),
    makeProvider({ display_name: "Hill Country Home Health",   city: "Round Rock",  state: "TX" }),
    makeProvider({ display_name: "Lone Star Companions",       city: "Cedar Park",  state: "TX" }),
    makeProvider({ display_name: "Alamo Family Care",          city: "Austin",      state: "TX" }),
    makeProvider({ display_name: "Bluebonnet In-Home Services", city: "Round Rock",  state: "TX" }),
    makeProvider({ display_name: "Texas Care Connect",         city: "Austin",      state: "TX" }),
    makeProvider({ display_name: "Live Oak Caregivers",        city: "Cedar Park",  state: "TX" }),
  ],
  // Campus C — Gainesville. 1 client (Stage 2 trigger), 1 prospect.
  u_florida: [
    makeProvider({
      display_name: "Gator Care Services",
      city: "Gainesville", state: "FL",
      termsAcceptedAt: daysAgo(30),
    }),
    makeProvider({ display_name: "Sunshine Home Health",       city: "Gainesville", state: "FL" }),
  ],
  // Campus D — Durham/Chapel Hill/Raleigh. 1 client, 1 materialized provider, 3 prospects.
  duke: [
    makeProvider({
      display_name: "Triangle Home Care",
      city: "Durham", state: "NC",
      termsAcceptedAt: daysAgo(60),
    }),
    makeProvider({ display_name: "Bull City Caregivers",        city: "Durham",     state: "NC" }),
    makeProvider({ display_name: "Tobacco Road Senior Services", city: "Durham",     state: "NC" }),
    makeProvider({ display_name: "Carolina Companions",         city: "Chapel Hill", state: "NC" }),
    makeProvider({ display_name: "Research Triangle Care",      city: "Raleigh",    state: "NC" }),
  ],
  // Campus E — Nashville. 2 clients (one Stripe, one urgency-pilot), 1 expired,
  // 1 prospect, 1 historical provider partner.
  vanderbilt: [
    makeProvider({
      display_name: "Music City Home Health",
      city: "Nashville", state: "TN",
      termsAcceptedAt: daysAgo(100),
      subscriptionActive: true,
      stripeCustomerId: "cus_demoMusicCity",
    }),
    makeProvider({
      display_name: "Cumberland Caregivers",
      city: "Nashville", state: "TN",
      termsAcceptedAt: daysAgo(80), // pilot ends in ~10 days — urgency
    }),
    makeProvider({
      display_name: "Tennessee Senior Solutions",
      city: "Nashville", state: "TN",
      termsAcceptedAt: daysAgo(95), // pilot expired (95 > 90)
    }),
    makeProvider({ display_name: "Smoky Mountain Care",         city: "Murfreesboro", state: "TN" }),
    makeProvider({ display_name: "Hatch Show Caregivers",       city: "Franklin",     state: "TN" }),
  ],
  // Campus F — Charlottesville. 2 inactive providers (no T&C, no Stripe).
  uva: [
    makeProvider({ display_name: "Blue Ridge Care Services",    city: "Charlottesville", state: "VA" }),
    makeProvider({ display_name: "Cavalier Companions",         city: "Charlottesville", state: "VA" }),
  ],
};

async function insertProviders() {
  console.log("⏳ Inserting providers…");
  const all = Object.values(providers).flat();
  const rows = all.map((p) => ({
    id: p.id,
    type: "organization",
    slug: `demo-${p.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    display_name: p.display_name,
    business_name: p.business_name,
    email: p.email,
    phone: p.phone,
    city: p.city,
    state: p.state,
    is_active: true,
    metadata: {
      [DEMO_MARKER_FIELD]: true,
      ...(p.termsAcceptedAt
        ? { interview_terms_accepted_at: p.termsAcceptedAt, medjobs_credits_used: 1 + Math.floor(Math.random() * 4) }
        : {}),
      ...(p.subscriptionActive
        ? {
            medjobs_subscription_active: true,
            medjobs_stripe_customer_id: p.stripeCustomerId,
            medjobs_subscription_id: "sub_demo" + p.id.slice(0, 8),
          }
        : {}),
    },
  }));

  if (!DRY_RUN) {
    const { error } = await db.from("business_profiles").insert(rows);
    if (error) throw new Error(`Provider insert failed: ${error.message}`);
  }
  inserted.providers = rows.length;
  console.log(`   ✓ ${rows.length} providers`);
}

// ──────────────────────────────────────────────────────────────────────────
// Student seeding (live candidates + signups)
// ──────────────────────────────────────────────────────────────────────────

interface StudentSeed {
  id: string;
  display_name: string;
  email: string;
  city: string;
  state: string;
  university: string;
  programTrack: string;
  applicationCompleted: boolean;
  hasVideo: boolean;
  certs: number;
  daysOldSignup: number;
}

const students: StudentSeed[] = [
  // Vanderbilt — 6 live candidates (Campus E)
  { id: randomUUID(), display_name: "Sarah Chen",       email: "schen@example.edu",      city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "pre-nursing", applicationCompleted: true,  hasVideo: true,  certs: 2, daysOldSignup: 14 },
  { id: randomUUID(), display_name: "Marcus Reyes",     email: "mreyes@example.edu",     city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "pre-med",     applicationCompleted: true,  hasVideo: true,  certs: 1, daysOldSignup: 22 },
  { id: randomUUID(), display_name: "Priya Patel",      email: "ppatel@example.edu",     city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "pre-pa",      applicationCompleted: true,  hasVideo: true,  certs: 3, daysOldSignup: 8  },
  { id: randomUUID(), display_name: "Jordan Williams",  email: "jwilliams@example.edu", city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "nursing",     applicationCompleted: true,  hasVideo: false, certs: 4, daysOldSignup: 35 },
  { id: randomUUID(), display_name: "Emily Rodriguez",  email: "erodriguez@example.edu", city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "pre-med",     applicationCompleted: true,  hasVideo: false, certs: 2, daysOldSignup: 41 },
  { id: randomUUID(), display_name: "Tyler Brooks",     email: "tbrooks@example.edu",    city: "Nashville", state: "TN", university: "Vanderbilt University",      programTrack: "pre-pa",      applicationCompleted: true,  hasVideo: true,  certs: 1, daysOldSignup: 12 },
  // Duke — 2 live + 1 incomplete (Campus D)
  { id: randomUUID(), display_name: "Aisha Patel",      email: "apatel@example.edu",     city: "Durham",    state: "NC", university: "Duke University",            programTrack: "pre-med",     applicationCompleted: true,  hasVideo: true,  certs: 2, daysOldSignup: 16 },
  { id: randomUUID(), display_name: "Devon Kim",        email: "dkim@example.edu",       city: "Durham",    state: "NC", university: "Duke University",            programTrack: "nursing",     applicationCompleted: true,  hasVideo: false, certs: 3, daysOldSignup: 28 },
  { id: randomUUID(), display_name: "Lauren Thompson",  email: "lthompson@example.edu",  city: "Durham",    state: "NC", university: "Duke University",            programTrack: "pre-nursing", applicationCompleted: false, hasVideo: false, certs: 0, daysOldSignup: 5  },
  // Other universities — incomplete signups (test Signups vs Candidates split)
  { id: randomUUID(), display_name: "Mia Garcia",       email: "mgarcia@example.edu",    city: "Gainesville", state: "FL", university: "University of Florida",     programTrack: "pre-med",     applicationCompleted: false, hasVideo: false, certs: 0, daysOldSignup: 9  },
  { id: randomUUID(), display_name: "Noah Anderson",    email: "nanderson@example.edu",  city: "Charlottesville", state: "VA", university: "University of Virginia", programTrack: "nursing",     applicationCompleted: false, hasVideo: false, certs: 0, daysOldSignup: 18 },
  { id: randomUUID(), display_name: "Riley Foster",     email: "rfoster@example.edu",    city: "Austin",      state: "TX", university: "University of Texas at Austin", programTrack: "pre-pa",  applicationCompleted: false, hasVideo: false, certs: 1, daysOldSignup: 3  },
];

async function insertStudents() {
  console.log("⏳ Inserting students…");
  const rows = students.map((s) => ({
    id: s.id,
    type: "student",
    slug: `demo-${s.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    display_name: s.display_name,
    email: s.email,
    city: s.city,
    state: s.state,
    is_active: true,
    created_at: daysAgo(s.daysOldSignup),
    metadata: {
      [DEMO_MARKER_FIELD]: true,
      university: s.university,
      program_track: s.programTrack,
      application_completed: s.applicationCompleted,
      has_video: s.hasVideo,
      certifications_count: s.certs,
    },
  }));

  if (!DRY_RUN) {
    const { error } = await db.from("business_profiles").insert(rows);
    if (error) throw new Error(`Student insert failed: ${error.message}`);
  }
  inserted.students = rows.length;
  console.log(`   ✓ ${rows.length} students (6 live candidates + 6 signups)`);
}

// ──────────────────────────────────────────────────────────────────────────
// Stakeholder + provider outreach rows + touchpoints + tasks + contacts
// ──────────────────────────────────────────────────────────────────────────

interface OutreachSeed {
  id: string;
  campusSlug: string;
  kind: "student_org" | "advisor" | "professor" | "dept_head" | "provider";
  organization_name: string;
  department?: string;
  status: string;
  /** Last activity hint (drives last_edited_at). */
  daysSinceLastActivity: number;
  /** True = no viewed_at (unread, bolded). */
  unread: boolean;
  /** Optional: id of a row to redirect to. */
  redirectedToId?: string;
  /** Optional: provider business_profile id (kind='provider' rows). */
  providerId?: string;
  /** Optional: contact to seed. */
  contact?: {
    title?: string;
    first_name: string;
    last_name?: string;
    role?: string;
    email?: string;
    phone?: string;
  };
  /** Touchpoints to seed in chronological order. */
  touchpoints: Array<{
    type: string;
    daysAgo: number;
    notes?: string;
    payload?: Record<string, unknown>;
    channel?: string | null;
    outcome?: string | null;
  }>;
  /** Pending tasks (calls due, scheduled emails, custom step board). */
  tasks?: Array<{
    type: string;
    dueAt: string;
    notes?: string | null;
  }>;
  /** Optional explicit notes on the row. Demo marker auto-prefixed. */
  notes?: string;
  /** Optional: meeting_at timestamp (for meeting_scheduled rows). */
  meetingAt?: string;
  /** Optional: distribution_evidence + notes for active_partner rows. */
  distribution_evidence?: "explicit_email" | "explicit_verbal" | "observed_external" | "self_reported";
  distribution_evidence_notes?: string;
}

// We materialize the outreach rows after we know the campus IDs and provider IDs.
function buildOutreachSeeds(
  campusIds: Record<string, string>,
  providerIdByName: Record<string, string>,
): OutreachSeed[] {
  // Stakeholder rows for Campus D (Duke) — the active workflow case.
  const duke: OutreachSeed[] = [
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "student_org",
      organization_name: "Pre-Med Society at Duke",
      department: "Student Organizations",
      status: "prospect",
      daysSinceLastActivity: 0,
      unread: true,
      contact: { first_name: "Marcus", last_name: "Reyes", role: "President", email: "premed@duke.example.edu" },
      touchpoints: [],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "advisor",
      organization_name: "Duke Pre-Health Advising",
      department: "Office of the Dean",
      status: "researched",
      daysSinceLastActivity: 1,
      unread: true,
      contact: { title: "Dr.", first_name: "Sarah", last_name: "Chen", role: "Pre-Health Advisor", email: "schen@duke.example.edu", phone: "+19195551234" },
      touchpoints: [
        { type: "note_added", daysAgo: 1, notes: "Active advisor. Reachable via email." },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "dept_head",
      organization_name: "Duke Department of Biology",
      department: "Biology",
      status: "outreach_sent",
      daysSinceLastActivity: 2,
      unread: false,
      contact: { title: "Prof.", first_name: "Andrew", last_name: "Sato", role: "Department Chair", email: "asato@duke.example.edu" },
      touchpoints: [
        { type: "email_sent", daysAgo: 2, channel: "email", payload: { template: "dept_head_intro", day: 0 } },
      ],
      tasks: [
        { type: "outreach_followup_email", dueAt: daysFromNow(1) },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "student_org",
      organization_name: "Duke Pre-PA Society",
      department: "Student Organizations",
      status: "engaged",
      daysSinceLastActivity: 0,
      unread: true,
      contact: { first_name: "Priya", last_name: "Patel", role: "VP", email: "prepa@duke.example.edu" },
      touchpoints: [
        { type: "email_sent",    daysAgo: 5,    channel: "email", payload: { template: "student_org_intro", day: 0 } },
        { type: "email_sent",    daysAgo: 2,    channel: "email", payload: { template: "student_org_followup", day: 3 } },
        { type: "email_replied", daysAgo: 0.12, channel: "email", notes: "Hi! Yes we'd love to share with our members. What's the next step?", outcome: "keep_emailing" },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "advisor",
      organization_name: "Office of Pre-Health",
      department: "Trinity College of Arts & Sciences",
      status: "meeting_scheduled",
      daysSinceLastActivity: 4,
      unread: false,
      meetingAt: daysFromNow(3),
      contact: { title: "Dr.", first_name: "Helen", last_name: "Whitaker", role: "Director", email: "hwhitaker@duke.example.edu" },
      touchpoints: [
        { type: "email_sent",       daysAgo: 8, channel: "email", payload: { template: "advisor_intro", day: 0 } },
        { type: "email_replied",    daysAgo: 5, channel: "email", notes: "Happy to chat. Tuesday at 3pm?", outcome: "wants_meeting" },
        { type: "meeting_scheduled", daysAgo: 4, channel: "meeting", payload: { meeting_at: daysFromNow(3) } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "dept_head",
      organization_name: "Duke School of Nursing",
      department: "Nursing",
      status: "agreed",
      daysSinceLastActivity: 6,
      unread: false,
      contact: { title: "Dr.", first_name: "Robert", last_name: "Patel", role: "Dean of Students", email: "rpatel-nursing@duke.example.edu" },
      touchpoints: [
        { type: "email_sent",          daysAgo: 12, channel: "email", payload: { template: "dept_head_intro", day: 0 } },
        { type: "email_replied",       daysAgo: 9,  channel: "email", outcome: "wants_meeting" },
        { type: "meeting_scheduled",   daysAgo: 8,  channel: "meeting" },
        { type: "meeting_held",        daysAgo: 6,  channel: "meeting", notes: "Great call. They want to share with junior + senior cohorts." },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "advisor",
      organization_name: "Duke Health Sciences Office",
      department: "Pre-Health Programs",
      status: "engaged",
      daysSinceLastActivity: 1,
      unread: true,
      notes: "Met in person at career fair. Wants more details before sharing.",
      contact: { title: "Dr.", first_name: "Maya", last_name: "Sharma", role: "Pre-Health Coordinator", email: "msharma@duke.example.edu" },
      touchpoints: [
        { type: "email_sent",        daysAgo: 14, channel: "email", payload: { template: "advisor_intro", day: 0 } },
        { type: "email_replied",     daysAgo: 12, channel: "email", outcome: "wants_meeting" },
        { type: "meeting_scheduled", daysAgo: 10, channel: "meeting" },
        { type: "meeting_held",      daysAgo: 7,  channel: "meeting", notes: "Wants more detail on the screening process before sharing with students. Will follow up via email." },
        { type: "note_added",        daysAgo: 1,  notes: "Needs follow-up email with screening criteria + sample profile." },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "student_org",
      organization_name: "Coach K's Office",
      department: "Athletics — Pre-Med Liaison",
      status: "engaged",
      daysSinceLastActivity: 1,
      unread: true,
      contact: { first_name: "Devon", last_name: "Kim", role: "Liaison", phone: "+19195559876" },
      touchpoints: [
        { type: "email_sent",     daysAgo: 6, channel: "email", payload: { template: "student_org_intro", day: 0 } },
        { type: "call_voicemail", daysAgo: 1, channel: "phone", notes: "Left voicemail with callback number." },
      ],
      tasks: [
        { type: "outreach_followup_call", dueAt: hoursAgo(-2) /* due 2 hours from now */ },
      ],
    },
    // Materialized provider in outreach (Campus D)
    {
      id: randomUUID(),
      campusSlug: "duke",
      kind: "provider",
      providerId: providerIdByName["Bull City Caregivers"],
      organization_name: "Bull City Caregivers",
      status: "outreach_sent",
      daysSinceLastActivity: 3,
      unread: false,
      touchpoints: [
        { type: "email_sent", daysAgo: 3, channel: "email", payload: { template: "provider_intro", day: 0 } },
      ],
    },
  ];

  // Stakeholder rows for Campus E (Vanderbilt) — mature partner-rich.
  const vanderbilt: OutreachSeed[] = [
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "student_org",
      organization_name: "Vanderbilt Pre-Med Society",
      department: "Student Organizations",
      status: "active_partner",
      daysSinceLastActivity: 30,
      unread: false,
      distribution_evidence: "observed_external",
      distribution_evidence_notes: "Saw their newsletter linking our profiles 3 weeks ago.",
      contact: { first_name: "Sarah", last_name: "Chen", role: "President", email: "premed@vandy.example.edu" },
      touchpoints: [
        { type: "email_sent",            daysAgo: 90, channel: "email", payload: { template: "student_org_intro", day: 0 } },
        { type: "email_replied",         daysAgo: 87, channel: "email", outcome: "wants_meeting" },
        { type: "meeting_held",          daysAgo: 80, channel: "meeting" },
        { type: "distribution_confirmed", daysAgo: 75 },
        { type: "stage_change",          daysAgo: 75, payload: { from: "agreed", to: "active_partner" } },
        { type: "email_sent",            daysAgo: 30, channel: "email", payload: { template: "partner_seasonal_checkin" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "advisor",
      organization_name: "Vanderbilt Pre-Health Advising",
      department: "Career Center",
      status: "active_partner",
      daysSinceLastActivity: 60,
      unread: false,
      distribution_evidence: "explicit_email",
      distribution_evidence_notes: "Confirmed in email — sharing with the pre-health listserv quarterly.",
      contact: { title: "Dr.", first_name: "James", last_name: "Iverson", role: "Pre-Health Advisor", email: "jiverson@vandy.example.edu" },
      touchpoints: [
        { type: "email_sent",            daysAgo: 110, channel: "email" },
        { type: "email_replied",         daysAgo: 107, channel: "email", outcome: "wants_meeting" },
        { type: "meeting_held",          daysAgo: 100, channel: "meeting" },
        { type: "distribution_confirmed", daysAgo: 95 },
        { type: "stage_change",          daysAgo: 95, payload: { from: "agreed", to: "active_partner" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "dept_head",
      organization_name: "Vandy School of Nursing",
      department: "Nursing",
      status: "active_partner",
      daysSinceLastActivity: 45,
      unread: false,
      distribution_evidence: "self_reported",
      distribution_evidence_notes: "Tracking via the spring intake survey.",
      contact: { title: "Dr.", first_name: "Rachel", last_name: "Okonkwo", role: "Department Chair", email: "rokonkwo@vandy.example.edu" },
      touchpoints: [
        { type: "email_sent",            daysAgo: 70, channel: "email" },
        { type: "meeting_held",          daysAgo: 60, channel: "meeting" },
        { type: "distribution_confirmed", daysAgo: 50 },
        { type: "stage_change",          daysAgo: 50, payload: { from: "agreed", to: "active_partner" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "dept_head",
      organization_name: "Vanderbilt Public Health",
      department: "Public Health",
      status: "distributed",
      daysSinceLastActivity: 15,
      unread: false,
      distribution_evidence: "explicit_verbal",
      distribution_evidence_notes: "Confirmed verbally in a meeting that they've shared the program.",
      contact: { title: "Dr.", first_name: "Olivia", last_name: "Park", role: "Department Chair", email: "opark@vandy.example.edu" },
      touchpoints: [
        { type: "email_sent",            daysAgo: 40, channel: "email" },
        { type: "meeting_held",          daysAgo: 25, channel: "meeting" },
        { type: "distribution_confirmed", daysAgo: 15 },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "student_org",
      organization_name: "Vanderbilt Pre-PA Club",
      department: "Student Organizations",
      status: "outreach_sent",
      daysSinceLastActivity: 4,
      unread: false,
      contact: { first_name: "Tyler", last_name: "Brooks", role: "Outreach Officer", email: "prepa@vandy.example.edu" },
      touchpoints: [
        { type: "email_sent", daysAgo: 4, channel: "email", payload: { template: "student_org_intro", day: 0 } },
      ],
      tasks: [
        { type: "outreach_followup_email", dueAt: daysFromNow(2) },
      ],
    },
    // Historical provider partner (Campus E)
    {
      id: randomUUID(),
      campusSlug: "vanderbilt",
      kind: "provider",
      providerId: providerIdByName["Hatch Show Caregivers"],
      organization_name: "Hatch Show Caregivers",
      status: "active_partner",
      daysSinceLastActivity: 120,
      unread: false,
      distribution_evidence: "self_reported",
      distribution_evidence_notes: "Provider was an early adopter. Now regularly hires from our pool.",
      touchpoints: [
        { type: "email_sent",            daysAgo: 200, channel: "email" },
        { type: "meeting_held",          daysAgo: 180, channel: "meeting" },
        { type: "distribution_confirmed", daysAgo: 150 },
        { type: "stage_change",          daysAgo: 150, payload: { from: "agreed", to: "active_partner" } },
      ],
    },
  ];

  // Campus F (UVA) — terminal-state graveyard. We need 5 rows; the
  // redirected one points at duke[0] for cross-campus testing.
  const uvaRedirectTargetId = duke[0].id;
  const uva: OutreachSeed[] = [
    {
      id: randomUUID(),
      campusSlug: "uva",
      kind: "student_org",
      organization_name: "UVA Pre-Med Society",
      status: "not_interested",
      daysSinceLastActivity: 20,
      unread: false,
      touchpoints: [
        { type: "email_sent",       daysAgo: 30, channel: "email" },
        { type: "email_replied",    daysAgo: 20, channel: "email", notes: "We have our own program — not a fit at this time. Best of luck!", outcome: "not_interested" },
        { type: "stage_change",     daysAgo: 20, payload: { from: "engaged", to: "not_interested" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "uva",
      kind: "advisor",
      organization_name: "UVA Pre-Health Advising",
      status: "no_response_closed",
      daysSinceLastActivity: 35,
      unread: false,
      touchpoints: [
        { type: "email_sent",   daysAgo: 60, channel: "email", payload: { day: 0 } },
        { type: "email_sent",   daysAgo: 57, channel: "email", payload: { day: 3 } },
        { type: "email_sent",   daysAgo: 53, channel: "email", payload: { day: 7 } },
        { type: "email_sent",   daysAgo: 46, channel: "email", payload: { day: 14 } },
        { type: "stage_change", daysAgo: 35, payload: { from: "outreach_sent", to: "no_response_closed" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "uva",
      kind: "dept_head",
      organization_name: "UVA Health Sciences",
      status: "do_not_contact",
      daysSinceLastActivity: 50,
      unread: false,
      touchpoints: [
        { type: "email_sent",    daysAgo: 70, channel: "email" },
        { type: "email_replied", daysAgo: 50, channel: "email", notes: "Please remove us from your outreach list.", outcome: "do_not_contact" },
        { type: "stage_change",  daysAgo: 50, payload: { from: "engaged", to: "do_not_contact" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "uva",
      kind: "professor",
      organization_name: "UVA Biology",
      status: "wrong_contact",
      daysSinceLastActivity: 25,
      unread: false,
      touchpoints: [
        { type: "email_sent",          daysAgo: 30, channel: "email" },
        { type: "email_replied",       daysAgo: 25, channel: "email", notes: "I'm in chemistry now. You probably want Dr. Ramirez in biology.", outcome: "wrong_contact" },
        { type: "stage_change",        daysAgo: 25, payload: { from: "outreach_sent", to: "wrong_contact" } },
      ],
    },
    {
      id: randomUUID(),
      campusSlug: "uva",
      kind: "student_org",
      organization_name: "UVA Pre-PA Club",
      status: "redirected",
      daysSinceLastActivity: 18,
      unread: false,
      touchpoints: [
        { type: "redirect_initiated", daysAgo: 18, notes: "Redirected to Duke per their request — they have a chapter relationship there." },
        { type: "stage_change",       daysAgo: 18, payload: { from: "engaged", to: "redirected" } },
      ],
    },
  ];
  // Wire the redirect target id into the redirected row so the FK is set.
  // We do this through a separate map since OutreachSeed doesn't carry it.
  (uva[uva.length - 1] as OutreachSeed & { __redirectedToId?: string }).__redirectedToId = uvaRedirectTargetId;

  return [...duke, ...vanderbilt, ...uva];
}

async function insertOutreachRows(
  campusIds: Record<string, string>,
  providerIdByName: Record<string, string>,
) {
  console.log("⏳ Inserting outreach rows + contacts + touchpoints + tasks…");

  const seeds = buildOutreachSeeds(campusIds, providerIdByName);
  const outreachRowsToInsert = seeds.map((s) => {
    const lastEdited = daysAgo(s.daysSinceLastActivity);
    const row: Record<string, unknown> = {
      id: s.id,
      campus_id: campusIds[s.campusSlug],
      stakeholder_type: s.kind === "provider" ? null : s.kind,
      kind: s.kind,
      provider_business_profile_id: s.kind === "provider" ? s.providerId ?? null : null,
      organization_name: s.organization_name,
      department: s.department ?? null,
      programs: [],
      status: s.status,
      contact_permission: s.kind === "professor" ? "via_dept" : "not_yet",
      research_data: {},
      cadence_day: s.touchpoints.filter((t) => t.type === "email_sent").length * 3,
      notes: demoNotes(s.notes ?? ""),
      meeting_at: s.meetingAt ?? null,
      distribution_evidence: s.distribution_evidence ?? null,
      distribution_evidence_notes: s.distribution_evidence_notes ?? null,
      created_at: daysAgo(Math.max(s.daysSinceLastActivity, 1) + 1),
      last_edited_at: lastEdited,
      viewed_at: s.unread ? null : hoursAgo(Math.max(1, s.daysSinceLastActivity * 24 - 2)),
      redirected_to_id: (s as OutreachSeed & { __redirectedToId?: string }).__redirectedToId ?? null,
    };
    return row;
  });

  if (!DRY_RUN) {
    const { error } = await db.from("student_outreach").insert(outreachRowsToInsert);
    if (error) throw new Error(`Outreach insert failed: ${error.message}`);
  }
  inserted.outreach = outreachRowsToInsert.length;
  console.log(`   ✓ ${outreachRowsToInsert.length} outreach rows`);

  // Contacts
  const contactRows: Array<Record<string, unknown>> = [];
  const contactIdByOutreachId: Record<string, string> = {};
  for (const s of seeds) {
    if (!s.contact) continue;
    const cid = randomUUID();
    contactIdByOutreachId[s.id] = cid;
    contactRows.push({
      id: cid,
      outreach_id: s.id,
      name: [s.contact.first_name, s.contact.last_name].filter(Boolean).join(" "),
      first_name: s.contact.first_name,
      last_name: s.contact.last_name ?? null,
      title: s.contact.title ?? null,
      role: s.contact.role ?? null,
      email: s.contact.email ?? null,
      phone: s.contact.phone ?? null,
      is_primary: true,
      status: "active",
    });
  }
  if (contactRows.length > 0 && !DRY_RUN) {
    const { error } = await db.from("student_outreach_contacts").insert(contactRows);
    if (error) throw new Error(`Contacts insert failed: ${error.message}`);
  }
  inserted.contacts = contactRows.length;
  console.log(`   ✓ ${contactRows.length} contacts`);

  // Touchpoints
  const touchpointRows: Array<Record<string, unknown>> = [];
  for (const s of seeds) {
    for (const t of s.touchpoints) {
      touchpointRows.push({
        id: randomUUID(),
        outreach_id: s.id,
        contact_id: contactIdByOutreachId[s.id] ?? null,
        touchpoint_type: t.type,
        channel: t.channel ?? null,
        outcome: t.outcome ?? null,
        notes: t.notes ?? null,
        payload: t.payload ?? {},
        created_at: daysAgo(t.daysAgo),
      });
    }
  }
  if (touchpointRows.length > 0 && !DRY_RUN) {
    const { error } = await db
      .from("student_outreach_touchpoints")
      .insert(touchpointRows);
    if (error) throw new Error(`Touchpoints insert failed: ${error.message}`);
  }
  inserted.touchpoints = touchpointRows.length;
  console.log(`   ✓ ${touchpointRows.length} touchpoints`);

  // Tasks
  const taskRows: Array<Record<string, unknown>> = [];
  for (const s of seeds) {
    if (!s.tasks) continue;
    for (const t of s.tasks) {
      taskRows.push({
        id: randomUUID(),
        outreach_id: s.id,
        task_type: t.type,
        due_at: t.dueAt,
        status: "pending",
        payload: {},
        notes: t.notes ?? null,
      });
    }
  }
  if (taskRows.length > 0 && !DRY_RUN) {
    const { error } = await db.from("student_outreach_tasks").insert(taskRows);
    if (error) throw new Error(`Tasks insert failed: ${error.message}`);
  }
  inserted.tasks = taskRows.length;
  console.log(`   ✓ ${taskRows.length} pending tasks`);
}

// ──────────────────────────────────────────────────────────────────────────
// Interviews — link Vanderbilt's Stripe-subscribed client to candidates
// ──────────────────────────────────────────────────────────────────────────

async function insertInterviews(providerIdByName: Record<string, string>) {
  console.log("⏳ Inserting interviews…");

  const provider = providerIdByName["Music City Home Health"];
  if (!provider) {
    console.log("   ⚠️ Music City Home Health not found, skipping interviews");
    return;
  }

  // Pick the 4 most-recent Vanderbilt students.
  const vandyStudents = students
    .filter((s) => s.university === "Vanderbilt University" && s.applicationCompleted)
    .slice(0, 4);

  const rows = vandyStudents.map((s, i) => ({
    id: randomUUID(),
    provider_profile_id: provider,
    student_profile_id: s.id,
    proposed_by: provider,
    type: i % 2 === 0 ? "video" : "phone",
    status: i === 0 ? "completed" : i === 1 ? "confirmed" : "proposed",
    proposed_time: daysFromNow(i === 0 ? -2 : i + 2),
    confirmed_time: i <= 1 ? daysFromNow(i === 0 ? -2 : i + 2) : null,
    duration_minutes: 30,
    created_at: daysAgo(i + 5),
  }));

  if (rows.length > 0 && !DRY_RUN) {
    const { error } = await db.from("interviews").insert(rows);
    if (error) throw new Error(`Interviews insert failed: ${error.message}`);
  }
  inserted.interviews = rows.length;
  console.log(`   ✓ ${rows.length} interviews`);
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`MedJobs demo seed — ${DRY_RUN ? "DRY RUN" : KEEP ? "additive (--keep)" : "wipe + re-seed"}`);
  console.log("");

  if (!KEEP) await wipeDemoData();
  const campusIds = await setupCampuses();
  await insertProviders();
  await insertStudents();

  // Build a lookup for providerIds by display_name so outreach + interview
  // seeders can wire FKs without re-querying.
  const providerIdByName: Record<string, string> = {};
  for (const p of Object.values(providers).flat()) {
    providerIdByName[p.display_name] = p.id;
  }

  await insertOutreachRows(campusIds, providerIdByName);
  await insertInterviews(providerIdByName);

  console.log("");
  console.log("✓ Done. Summary:");
  console.log(`   ${inserted.providers}  providers`);
  console.log(`   ${inserted.students}  students (6 live candidates + 6 signups)`);
  console.log(`   ${inserted.outreach}  outreach rows (Duke 9, Vanderbilt 6, UVA 5)`);
  console.log(`   ${inserted.contacts}  contacts`);
  console.log(`   ${inserted.touchpoints}  touchpoints`);
  console.log(`   ${inserted.tasks}  pending tasks`);
  console.log(`   ${inserted.interviews}  interviews`);
  if (DRY_RUN) console.log("   (dry run — nothing written to DB)");
  console.log("");
  console.log("Open /admin/medjobs/in-basket to see the demo state.");
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
