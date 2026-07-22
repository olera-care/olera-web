"use client";

/**
 * Provider Outreach · In Basket
 *
 * Three-tab CRM:
 *   1. Contacts   -- full provider list, click to open detail panel
 *   2. Tasks      -- sub-tabs: To resolve | Calls | Unresolved | Done
 *                    Unresolved tiles have inline resolve/open buttons + notes
 *                    Calls tab shows hot/warm leads that engaged with Olera
 *   3. Tracking   -- dashboard table: Provider | Step | Next
 */

import { useState, useEffect, useCallback } from "react";
import { ProviderDrawer } from "@/components/admin/provider-outreach/ProviderDrawer";

/* ─── Types ─── */

type TopTab = "leads" | "tickets" | "sequence" | "claimed";
type ContactStatus = "send_ready" | "call_to_get" | "in_sequence" | "paused" | "unresolved";
type TrackingFilter = "all" | "step1" | "step2" | "step3" | "step4" | "paused" | "unresolved";
type TaskStage = "Active" | "Backlog" | "Exhausted" | "Do not contact";
type HeatLevel = "hot" | "warm";

interface Contact {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ContactStatus;
  slug: string | null;
  sequenceStep: string | null;
  stage: TaskStage;
  agent: string;
}

interface TrackingRow {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  stepKey: TrackingFilter;
  stepLabel: string;
  stepColor: string;
  nextLabel: string;
  nextColor: string;
  opens?: number;
  clicks?: number;
  replied?: boolean;
  heat?: "hot" | "warm";
  timeAgo?: string;
  clickedButton?: string;
}

interface StepButton {
  label: string;
  count: number;
  highlight?: boolean;
}

interface StepSummary {
  key: TrackingFilter;
  label: string;
  emailName: string;
  subtitle: string;
  emailSubject: string;
  sent: number;
  hereNow: number;
  opened: number;
  clicked: number;
  replied: number;
  buttons?: StepButton[];
  insight?: string;
}

interface TaskItem {
  id: string;
  label: "PAUSED" | "UNRESOLVED" | "EMAIL";
  provider_name: string;
  detail: string;
  type: "call" | "research" | "open" | "email";
  contact: Contact;
  heat?: HeatLevel;
  dueBy?: string;
  engagement?: string[];
  timeAgo?: string;
  subLabel?: string;
  actionLabel?: string;
}

/* ─── Constants ─── */

const STAGE_COLORS: Record<TaskStage, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Backlog: "bg-amber-100 text-amber-700",
  Exhausted: "bg-gray-100 text-gray-500",
  "Do not contact": "bg-red-100 text-red-700",
};

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1")) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

/* ─── Demo Data ─── */

const DEMO_CONTACTS: Contact[] = [
  { id: "c1", name: "A Gentle Touch Senior Home", city: "Babylon", state: "NY", category: "Home Care", email: "info@agentletouch.com", phone: "6318840900", website: "agentletouch.com", status: "send_ready", slug: null, sequenceStep: null, stage: "Active", agent: "Chantel Wright" },
  { id: "c2", name: "Able Health Care Service", city: "White Plains", state: "NY", category: "Home Health Care", email: "contact@ablehc.com", phone: "9149467500", website: "ablehc.com", status: "send_ready", slug: null, sequenceStep: null, stage: "Active", agent: "Chantel Wright" },
  { id: "c3", name: "Adamski Village", city: "Buffalo", state: "NY", category: "Independent Living", email: null, phone: "7168930700", website: null, status: "call_to_get", slug: null, sequenceStep: null, stage: "Active", agent: "Chantel Wright" },
  { id: "c4", name: "Allegria Senior Living", city: "East Meadow", state: "NY", category: "Assisted Living", email: "info@allegrialiving.com", phone: "5162272898", website: "allegrialiving.com", status: "in_sequence", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" },
  { id: "c5", name: "Always Home Care", city: "Brooklyn", state: "NY", category: "Home Care", email: "care@alwayshomecare.com", phone: "7184555100", website: "alwayshomecare.com", status: "in_sequence", slug: null, sequenceStep: "Step 2", stage: "Active", agent: "Chantel Wright" },
  { id: "c6", name: "Artis Senior Living", city: "Briarcliff Manor", state: "NY", category: "Memory Care", email: "briarcliff@artis.com", phone: "9149411900", website: "artisseniorliving.com", status: "paused", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" },
  { id: "c7", name: "Golden Care Home Health", city: "Buffalo", state: "NY", category: "Home Health Care", email: "info@goldencarehh.com", phone: "7168551200", website: "goldencarehh.com", status: "paused", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" },
  { id: "c8", name: "Sunrise of Yonkers", city: "Yonkers", state: "NY", category: "Assisted Living", email: "yonkers@sunriseseniorliving.com", phone: "9149631700", website: "sunriseseniorliving.com", status: "paused", slug: null, sequenceStep: "Step 3", stage: "Active", agent: "Chantel Wright" },
  { id: "c9", name: "Autumn View Health Care", city: "Hamburg", state: "NY", category: "Skilled Nursing", email: null, phone: null, website: null, status: "unresolved", slug: null, sequenceStep: "Step 1", stage: "Do not contact", agent: "Chantel Wright" },
  { id: "c10", name: "Bronx Elder Services", city: "Bronx", state: "NY", category: "Home Care", email: "info@bronxelder.com", phone: "7185551234", website: "bronxelder.com", status: "unresolved", slug: null, sequenceStep: "Step 1", stage: "Do not contact", agent: "Chantel Wright" },
  { id: "c11", name: "Beacon Senior Living", city: "Albany", state: "NY", category: "Assisted Living", email: "info@beaconsenior.com", phone: "5184641200", website: "beaconsenior.com", status: "in_sequence", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" },
  { id: "c12", name: "Comfort Keepers Rochester", city: "Rochester", state: "NY", category: "Home Care", email: null, phone: "5852720970", website: "comfortkeepers.com", status: "in_sequence", slug: null, sequenceStep: "Step 2", stage: "Active", agent: "Chantel Wright" },
];

const TRACKING_DATA: TrackingRow[] = [
  // Step 1 - What makes you special
  { id: "t1", name: "Benchmark Senior Living", city: "Ridgefield", state: "NY", category: "Assisted Living", phone: "2034381200", email: "info@benchmarksenior.com", website: "benchmarksenior.com", stepKey: "step1", stepLabel: "Step 1 · Email one", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 3d", nextColor: "text-gray-400", opens: 1, clicks: 0, timeAgo: "1d ago" },
  { id: "t2", name: "BrightStar Care", city: "Syracuse", state: "NY", category: "Home Health Care", phone: "3154551200", email: "syracuse@brightstarcare.com", website: "brightstarcare.com", stepKey: "step1", stepLabel: "Step 1 · Email one", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 3d", nextColor: "text-gray-400", opens: 0, clicks: 0, timeAgo: "2d ago" },
  { id: "t3", name: "Allegria Senior Living", city: "East Meadow", state: "NY", category: "Assisted Living", phone: "5162272898", email: "info@allegrialiving.com", website: "allegrialiving.com", stepKey: "step1", stepLabel: "Step 1 · Email one", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 1d", nextColor: "text-gray-400", opens: 2, clicks: 1, heat: "hot", timeAgo: "3h ago", clickedButton: "\"Show families what you're proud of\"" },
  { id: "t13", name: "Visiting Angels Albany", city: "Albany", state: "NY", category: "Home Care", phone: "5184641600", email: "albany@visitingangels.com", website: "visitingangels.com", stepKey: "step1", stepLabel: "Step 1 · Email one", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 2d", nextColor: "text-gray-400", opens: 4, clicks: 1, heat: "warm", timeAgo: "2d ago", clickedButton: "\"Show families what you're proud of\"" },
  // Step 2 - Competitor gap
  { id: "t7", name: "Elderwood at Amherst", city: "Amherst", state: "NY", category: "Assisted Living", phone: "7166311400", email: "info@elderwood.com", website: "elderwood.com", stepKey: "step2", stepLabel: "Step 2 · Email two", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 2d", nextColor: "text-gray-400", opens: 4, clicks: 2, timeAgo: "3d ago", clickedButton: "\"Add photos →\"" },
  // Step 3 - Reviews
  { id: "t8", name: "Home Instead Ithaca", city: "Ithaca", state: "NY", category: "Home Care", phone: "6072770700", email: "ithaca@homeinstead.com", website: "homeinstead.com", stepKey: "step3", stepLabel: "Step 3 · Email three", stepColor: "border-blue-200 bg-blue-50 text-blue-700", nextLabel: "in 1d", nextColor: "text-gray-400", opens: 5, clicks: 3, timeAgo: "4d ago", clickedButton: "\"Reply to your reviews →\"" },
  // Paused
  { id: "t9", name: "Golden Care Home Health", city: "Buffalo", state: "NY", category: "Home Health Care", phone: "7168551200", email: "info@goldencarehh.com", website: "goldencarehh.com", stepKey: "paused", stepLabel: "Paused · replied", stepColor: "border-orange-200 bg-orange-50 text-orange-700", nextLabel: "Call now", nextColor: "text-primary-600 font-semibold", opens: 3, clicks: 1, replied: true, heat: "hot", timeAgo: "2h ago" },
  { id: "t10", name: "Sunrise of Yonkers", city: "Yonkers", state: "NY", category: "Assisted Living", phone: "9149631700", email: "yonkers@sunriseseniorliving.com", website: "sunriseseniorliving.com", stepKey: "paused", stepLabel: "Paused · clicked", stepColor: "border-orange-200 bg-orange-50 text-orange-700", nextLabel: "Call now", nextColor: "text-primary-600 font-semibold", opens: 6, clicks: 4, heat: "hot", timeAgo: "5h ago" },
  // Unresolved
  { id: "t11", name: "Autumn View Health Care", city: "Hamburg", state: "NY", category: "Skilled Nursing", phone: null, email: null, website: null, stepKey: "unresolved", stepLabel: "Unresolved · bounced", stepColor: "border-red-200 bg-red-50 text-red-700", nextLabel: "Fix", nextColor: "text-red-500 font-semibold", opens: 0, clicks: 0 },
  { id: "t12", name: "Bronx Elder Services", city: "Bronx", state: "NY", category: "Home Care", phone: "7185551234", email: "info@bronxelder.com", website: "bronxelder.com", stepKey: "unresolved", stepLabel: "Unresolved · opt-out", stepColor: "border-red-200 bg-red-50 text-red-700", nextLabel: "Fix", nextColor: "text-red-500 font-semibold", opens: 2, clicks: 0, replied: true },
];

const STEP_SUMMARIES: StepSummary[] = [
  {
    key: "step1", label: "Step 1 · Email one", emailName: "Email one · What makes you special", subtitle: "Featured section prompt",
    emailSubject: "\"What makes [Provider] special?\"", sent: 90, hereNow: 30, opened: 41, clicked: 14, replied: 5,
    buttons: [
      { label: "\"Show families what you're proud of\"", count: 14, highlight: true },
    ],
    insight: "Single CTA, personal appeal. No data dependency -- works for 100% of providers.",
  },
  {
    key: "step2", label: "Step 2 · Email two", emailName: "Email two · Add photos", subtitle: "Photo prompt",
    emailSubject: "\"Families want to see [Provider]\"", sent: 60, hereNow: 20, opened: 19, clicked: 6, replied: 1,
    buttons: [
      { label: "\"Add photos →\"", count: 6, highlight: true },
    ],
    insight: "Photo upload CTA with magic link. Drives engagement by making the provider page feel like theirs.",
  },
  {
    key: "step3", label: "Step 3 · Email three", emailName: "Email three · Reviews you can't answer", subtitle: "Review reply prompt",
    emailSubject: "\"{{review_count}} people have reviewed [Provider]\"", sent: 40, hereNow: 11, opened: 12, clicked: 4, replied: 1,
    buttons: [
      { label: "\"Reply to your reviews →\"", count: 4, highlight: true },
    ],
    insight: "Loss of control lever. 70-80% of providers have reviews they can't respond to. Strongest closer.",
  },
  {
    key: "step4", label: "Step 4 · Email four", emailName: "Email four · No referral fees", subtitle: "Direct contact pitch",
    emailSubject: "\"When a family calls, they call you\"", sent: 30, hereNow: 8, opened: 3, clicked: 0, replied: 0,
    buttons: [
      { label: "\"Set up your page →\"", count: 3, highlight: true },
    ],
    insight: "Anti-referral positioning. Hits the pain point every provider knows. Final touch.",
  },
];

// Demo email previews per step
const STEP_EMAIL_PREVIEWS: Record<string, { subject: string; preview: string; fullBody: string }> = {
  step1: {
    subject: "What makes {{name}} special?",
    preview: "Your page has a featured section where you can add badges and highlight what makes you unique...",
    fullBody: `Hi {{first_name}},

Your page has a featured section where you can add badges and highlight what makes your services and your facility unique.

[Show families what you're proud of]

It's the place for the programs you've built, the awards you've won, and the details families would only pick up on a tour.

Takes a few minutes, and it's the part families actually read.

{{caller_name}}`,
  },
  step2: {
    subject: "Families want to see {{name}}",
    preview: "Right now your page has {{photo_count}} photos. Families deciding where to move a parent want to see the place...",
    fullBody: `Hi {{first_name}},

Right now your page has {{photo_count}} photos.

Families deciding where to move a parent want to see the place. The rooms, the dining, people doing something on a Tuesday afternoon. It's the closest thing to a visit before they visit.

You can upload straight from your phone, takes a minute.

[Add photos →]

Graize`,
  },
  step3: {
    subject: "{{review_count}} people have reviewed {{name}}",
    preview: "Your page shows {{review_count}} reviews. Families read them before they call anyone...",
    fullBody: `Hi {{first_name}},

Your page shows {{review_count}} reviews. Families read them before they call anyone.

Right now you can't reply to a single one. Not the good ones, and not the one from three years ago you'd want to explain.

[Reply to your reviews →]

Claiming your page takes a few minutes and puts your voice next to theirs.

Graize`,
  },
  step4: {
    subject: "When a family calls, they call you",
    preview: "You know how the referral services work. A family fills out one form, their details get sold to three or four agencies...",
    fullBody: `Hi {{first_name}},

You know how the referral services work. A family fills out one form, their details get sold to three or four agencies, everyone calls the same afternoon, and the platform gets paid either way.

Olera doesn't do that. A family finds your page, they contact you.

No per-lead fee, no commission when someone moves in, nothing resold to the place down the road. What happens after they reach out is between you and them.

Which is why the page matters. Yours is built from public information right now, so it's a stranger's version of your business. Claim it and it's yours: your photos, your story, said your way.

[Set up your page →]

Free, and takes a few minutes.

{{caller_name}}`,
  },
};

const STEP_COUNTS: Record<TrackingFilter, number> = {
  all: 103, step1: 30, step2: 20, step3: 11, step4: 8, paused: 6, unresolved: 2,
};

const DEMO_TASKS: TaskItem[] = [
  // ── Leads: Hot (closest to claiming) ──
  { id: "tk3", label: "PAUSED", provider_name: "Golden Care Home Health", detail: "Replied \"how does claiming work?\" · Step 1 · Buffalo", type: "call", contact: DEMO_CONTACTS[6], heat: "hot", dueBy: "Call today", timeAgo: "2h", engagement: ["Replied to \"What makes you special\"", "Said they are interested", "Sequence paused"] },
  { id: "tk4", label: "PAUSED", provider_name: "Sunrise of Yonkers", detail: "Clicked claim link, didn't finish · Step 3 · Yonkers", type: "call", contact: DEMO_CONTACTS[7], heat: "hot", dueBy: "Call today", timeAgo: "5h", engagement: ["Clicked claim page link", "Viewed page 3 times", "Sequence paused"] },
  // ── Leads: Warm (interested, needs a nudge) ──
  { id: "tk6", label: "PAUSED", provider_name: "Comfort Keepers Rochester", detail: "Replied to email · Step 2 · Rochester", type: "call", contact: DEMO_CONTACTS[11], heat: "warm", dueBy: "Follow up tomorrow", timeAgo: "1d", engagement: ["Replied to email two", "Paused at Step 2"] },
  { id: "tk5", label: "EMAIL", provider_name: "Elderwood at Amherst", detail: "Asked \"do you charge a fee?\" · Step 3 · Amherst", type: "email", contact: DEMO_CONTACTS[5], heat: "warm", dueBy: "Respond today", timeAgo: "1d", engagement: ["Replied to email 2", "Asked about pricing"] },
  { id: "tk7", label: "EMAIL", provider_name: "Artis Senior Living", detail: "Clicked \"Show families\", viewed page twice · Step 1 · Briarcliff", type: "call", contact: { id: "tk7c", name: "Artis Senior Living", city: "Briarcliff Manor", state: "NY", category: "Memory Care", email: "briarcliff@artis.com", phone: "9149411900", website: "artisseniorliving.com", status: "paused", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" }, heat: "warm", dueBy: "Call by tomorrow", timeAgo: "1d", engagement: ["Clicked \"Show families what you're proud of\"", "Viewed page twice"] },
  // ── Tickets: Fixable (fix and they resume) ──
  { id: "tk1", label: "UNRESOLVED", provider_name: "Autumn View Health Care", detail: "Email 1 bounced · stuck at Step 1", type: "research", contact: DEMO_CONTACTS[8], dueBy: "Resolve today", subLabel: "BOUNCED", actionLabel: "Find email", engagement: ["Email 1 bounced", "Bad address on file"] },
  { id: "tk8", label: "UNRESOLVED", provider_name: "Hamilton Manor", detail: "Email 1 bounced, mailbox full · stuck at Step 1", type: "research", contact: { id: "tk8c", name: "Hamilton Manor", city: "Syracuse", state: "NY", category: "Assisted Living", email: "admin@hamiltonmanor.com", phone: "3154551800", website: "hamiltonmanor.com", status: "paused", slug: null, sequenceStep: "Step 1", stage: "Active", agent: "Chantel Wright" }, subLabel: "BOUNCED", actionLabel: "Retry", engagement: ["Email 1 bounced", "Mailbox full"] },
  { id: "tk9", label: "UNRESOLVED", provider_name: "Riverside Adult Care", detail: "No email or phone found · never started", type: "research", contact: { id: "tk9c", name: "Riverside Adult Care", city: "White Plains", state: "NY", category: "Home Care", email: null, phone: null, website: "riversideadultcare.com", status: "paused", slug: null, sequenceStep: null, stage: "Active", agent: "Chantel Wright" }, subLabel: "NO DATA", actionLabel: "Research", engagement: ["No contact info found", "Needs manual research"] },
  // ── Tickets: Final (close out, do not resume) ──
  { id: "tk2", label: "UNRESOLVED", provider_name: "Bronx Elder Services", detail: "\"Take me off this list\" · suppress across all channels", type: "open", contact: DEMO_CONTACTS[9], dueBy: "Resolve today", subLabel: "OPT OUT", actionLabel: "Close out", engagement: ["Replied to email 1", "Asked to be removed"] },
];

const LEADS_COUNT = DEMO_TASKS.filter((t) => t.heat).length;
const TICKETS_COUNT = DEMO_TASKS.filter((t) => !t.heat).length;

interface ClaimedProvider {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  claimedAt: string;
  claimedVia: "email" | "call" | "self";
}

const DEMO_CLAIMED: ClaimedProvider[] = [
  { id: "cl1", name: "Sunrise Senior Living", city: "White Plains", state: "NY", category: "Assisted Living", claimedAt: "2026-07-14", claimedVia: "call" },
  { id: "cl2", name: "Visiting Angels Long Island", city: "Hempstead", state: "NY", category: "Home Care", claimedAt: "2026-07-13", claimedVia: "email" },
  { id: "cl3", name: "BrightStar Care Albany", city: "Albany", state: "NY", category: "Home Health Care", claimedAt: "2026-07-12", claimedVia: "email" },
  { id: "cl4", name: "Comfort Keepers Syracuse", city: "Syracuse", state: "NY", category: "Home Care", claimedAt: "2026-07-11", claimedVia: "self" },
  { id: "cl5", name: "Brookdale Westchester", city: "Yonkers", state: "NY", category: "Memory Care", claimedAt: "2026-07-10", claimedVia: "call" },
  { id: "cl6", name: "Home Instead Troy", city: "Troy", state: "NY", category: "Home Care", claimedAt: "2026-07-09", claimedVia: "email" },
  { id: "cl7", name: "Atria Senior Living", city: "Ann Arbor", state: "MI", category: "Assisted Living", claimedAt: "2026-07-13", claimedVia: "call" },
  { id: "cl8", name: "Right at Home Detroit", city: "Detroit", state: "MI", category: "Home Care", claimedAt: "2026-07-11", claimedVia: "email" },
  { id: "cl9", name: "Great Lakes Home Health", city: "Grand Rapids", state: "MI", category: "Home Health Care", claimedAt: "2026-07-08", claimedVia: "self" },
  { id: "cl10", name: "Sunrise of Grosse Pointe", city: "Grosse Pointe", state: "MI", category: "Assisted Living", claimedAt: "2026-07-07", claimedVia: "email" },
];

const CLAIMED_COUNT = DEMO_CLAIMED.length;

/* ─── Icons ─── */

const PHONE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const SEARCH_ICON = (
  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);


/**
 * Email health color thresholds.
 * Green = healthy, Orange = needs attention, Red = flag Logan/Chantel.
 */
function getOpenRateHealth(pct: number): { color: string; textColor: string; borderColor: string; bgColor: string } {
  if (pct >= 30) return { color: "emerald", textColor: "text-emerald-700", borderColor: "border-emerald-300", bgColor: "bg-emerald-50/60" };
  if (pct >= 15) return { color: "amber", textColor: "text-amber-700", borderColor: "border-amber-300", bgColor: "bg-amber-50/60" };
  return { color: "red", textColor: "text-red-700", borderColor: "border-red-300", bgColor: "bg-red-50/60" };
}

function getClickRateHealth(pct: number): { color: string; textColor: string; borderColor: string; bgColor: string } {
  if (pct >= 5) return { color: "emerald", textColor: "text-emerald-700", borderColor: "border-emerald-300", bgColor: "bg-emerald-50/60" };
  if (pct >= 2) return { color: "amber", textColor: "text-amber-700", borderColor: "border-amber-300", bgColor: "bg-amber-50/60" };
  return { color: "red", textColor: "text-red-700", borderColor: "border-red-300", bgColor: "bg-red-50/60" };
}

const EMAIL_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);

/** Convert a Contact to the ProviderRow shape the shared ProviderDrawer expects. */
function contactToProviderRow(c: Contact) {
  return {
    id: c.id,
    provider_id: c.id,
    provider_name: c.name,
    provider_category: c.category,
    city: c.city,
    state: c.state,
    phone: c.phone,
    email: c.email,
    website: c.website,
    slug: c.slug,
    status: c.status,
  };
}

/* ─── Component ─── */

export default function ProviderOutreachInBasketPage() {
  const [activeTab, setActiveTab] = useState<TopTab>("leads");

  // Search + filters
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Tracking / Sequence
  const [trackingFilter, setTrackingFilter] = useState<TrackingFilter>("all");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Shared
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedEngagement, setSelectedEngagement] = useState<string[] | null>(null);

  // Email preview modal
  const [previewStep, setPreviewStep] = useState<string | null>(null);

  // Real data from Supabase/SmartLead
  interface LiveStepData {
    step: number;
    key: string;
    label: string;
    emailName: string;
    subtitle: string;
    sent: number;
    here_now: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  }
  interface LiveProvider {
    provider_id: string;
    provider_name: string;
    category: string;
    city: string;
    state: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    slug: string | null;
    sequence_step: number;
    sequence_status: string;
    lead_score: string;
    opens: number;
    clicks: number;
    replies: number;
    bounced: boolean;
  }
  const [liveSteps, setLiveSteps] = useState<LiveStepData[] | null>(null);
  const [liveTotals, setLiveTotals] = useState<Record<string, number> | null>(null);
  const [liveProviders, setLiveProviders] = useState<LiveProvider[] | null>(null);

  const fetchSequenceStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/provider-outreach/sequence-stats");
      if (!res.ok) return;
      const data = await res.json();
      if (data.steps && data.steps.length > 0) {
        setLiveSteps(data.steps);
        setLiveTotals(data.totals);
        setLiveProviders(data.providers);
      }
    } catch {
      // Fall back to demo data silently
    }
  }, []);

  useEffect(() => {
    fetchSequenceStats();
  }, [fetchSequenceStats]);

  // Use live data if available, otherwise demo
  const useLiveData = liveSteps !== null && liveSteps.length > 0;

  // Resolve state
  const [resolvedTasks, setResolvedTasks] = useState<Record<string, { status: string; notes: string }>>({});

  function selectContact(c: Contact, engagement?: string[]) {
    setSelectedContact((prev) => prev?.id === c.id ? null : c);
    setSelectedEngagement(() => {
      if (selectedContact?.id === c.id) return null;
      return engagement || null;
    });
  }

  // Tracking uses expandedStep + engagement filters inline

  // Tasks filtering
  const leadTasks = DEMO_TASKS.filter((t) => t.heat && !resolvedTasks[t.id]);
  const ticketTasks = DEMO_TASKS.filter((t) => !t.heat && !resolvedTasks[t.id]);
  const hotLeads = leadTasks.filter((t) => t.heat === "hot");
  const warmLeads = leadTasks.filter((t) => t.heat === "warm");

  function resolveTask(taskId: string, status: string) {
    setResolvedTasks((prev) => ({ ...prev, [taskId]: { status, notes: "" } }));
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Provider Outreach · In Basket</h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setActiveTab("leads")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            activeTab === "leads" ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Leads</p>
          <p className={`text-2xl font-bold tabular-nums mt-1 ${LEADS_COUNT > 0 ? "text-red-600" : "text-gray-900"}`}>{LEADS_COUNT}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hotLeads.length} hot · {warmLeads.length} warm</p>
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            activeTab === "tickets" ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tickets</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 mt-1">{TICKETS_COUNT}</p>
          <p className="text-xs text-gray-400 mt-0.5">{DEMO_TASKS.filter((t) => t.subLabel === "BOUNCED" || t.subLabel === "NO DATA").length} fixable · {DEMO_TASKS.filter((t) => t.subLabel === "OPT OUT").length} opt-out</p>
        </button>
        <button
          onClick={() => setActiveTab("sequence")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            activeTab === "sequence" ? "border-primary-300 bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sequence</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 mt-1">{liveTotals?.all ?? STEP_COUNTS.all}</p>
          <p className="text-xs text-gray-400 mt-0.5">{useLiveData ? "Live data" : "Demo data"}</p>
        </button>
        <button
          onClick={() => setActiveTab("claimed")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            activeTab === "claimed" ? "border-emerald-300 bg-emerald-50/30" : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Claimed</p>
          <p className={`text-2xl font-bold tabular-nums mt-1 ${CLAIMED_COUNT > 0 ? "text-emerald-600" : "text-gray-900"}`}>{CLAIMED_COUNT}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Set(DEMO_CLAIMED.map((c) => c.state)).size} states</p>
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{SEARCH_ICON}</span>
          <input
            type="text"
            placeholder="Search by name, organization, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
        >
          <option value="all">All states</option>
          <option value="NY">New York</option>
          <option value="MI">Michigan</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
        >
          <option value="all">All types</option>
          <option value="Home Care">Home Care</option>
          <option value="Assisted Living">Assisted Living</option>
          <option value="Memory Care">Memory Care</option>
          <option value="Home Health Care">Home Health Care</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {([
          { key: "leads" as TopTab, label: "Leads", count: LEADS_COUNT },
          { key: "tickets" as TopTab, label: "Tickets", count: TICKETS_COUNT },
          { key: "sequence" as TopTab, label: "Sequence", count: (liveTotals?.all ?? STEP_COUNTS.all) },
          { key: "claimed" as TopTab, label: "Claimed", count: CLAIMED_COUNT },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedContact(null); setSelectedEngagement(null); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary-500 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 tabular-nums ${activeTab === tab.key ? "text-gray-900" : "text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ LEADS TAB ═══ */}
      {activeTab === "leads" && (() => {
        function renderLeadRow(task: TaskItem) {
          const isSelected = selectedContact?.id === task.contact.id;
          const resolved = resolvedTasks[task.id];
          return (
            <div
              key={task.id}
              onClick={() => selectContact(task.contact, task.engagement || undefined)}
              className={`flex items-center gap-4 pl-0 pr-5 py-4 cursor-pointer transition-colors ${
                isSelected ? "bg-primary-50/40" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-1 self-stretch rounded-r-full shrink-0 ${
                task.heat === "hot" ? "bg-red-400" : "bg-amber-400"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{task.provider_name}</p>
                  {task.type === "email" && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                      Replied
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{task.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                task.heat === "hot" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}>
                {task.heat}
              </span>
              {task.timeAgo && (
                <span className="text-xs text-gray-400 shrink-0 tabular-nums">{task.timeAgo}</span>
              )}
              <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {resolved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Resolved
                  </span>
                ) : (
                  <>
                    {task.type === "email" && (
                      <button
                        onClick={() => selectContact(task.contact, task.engagement || undefined)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        {EMAIL_ICON}
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => selectContact(task.contact, task.engagement || undefined)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {PHONE_ICON}
                      Call
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }

        return (
          <>
            <div className="space-y-6">
              {/* Hot leads section */}
              {hotLeads.length > 0 && (
                <div>
                  <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full bg-red-500 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Hot</span>
                      <span className="text-sm font-semibold text-red-800">Closest to claiming · {hotLeads.length}</span>
                    </div>
                    <p className="text-xs text-red-600/70 mt-1 ml-0.5">These providers replied or clicked. Call them today.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {hotLeads.map(renderLeadRow)}
                  </div>
                </div>
              )}

              {/* Warm leads section */}
              {warmLeads.length > 0 && (
                <div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Warm</span>
                      <span className="text-sm font-semibold text-amber-800">Interested, needs a nudge · {warmLeads.length}</span>
                    </div>
                    <p className="text-xs text-amber-600/70 mt-1 ml-0.5">Opened or clicked but haven't taken the next step. Follow up this week.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {warmLeads.map(renderLeadRow)}
                  </div>
                </div>
              )}

              {leadTasks.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                  <p className="text-sm text-gray-500">No leads right now.</p>
                </div>
              )}
            </div>
            {selectedContact && <ProviderDrawer provider={contactToProviderRow(selectedContact)} onClose={() => { setSelectedContact(null); setSelectedEngagement(null); }} engagement={selectedEngagement || undefined} variant="lead" />}
          </>
        );
      })()}

      {/* ═══ TICKETS TAB ═══ */}
      {activeTab === "tickets" && (() => {
        const fixableTasks = ticketTasks.filter((t) => t.subLabel === "BOUNCED" || t.subLabel === "NO DATA");
        const optOutTasks = ticketTasks.filter((t) => t.subLabel === "OPT OUT");

        function renderTicketRow(task: TaskItem) {
          const isSelected = selectedContact?.id === task.contact.id;
          const resolved = resolvedTasks[task.id];
          return (
            <div
              key={task.id}
              onClick={() => selectContact(task.contact, task.engagement || undefined)}
              className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                isSelected ? "bg-primary-50/40" : "hover:bg-gray-50"
              }`}
            >
              {task.subLabel && (
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  task.subLabel === "BOUNCED" ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : task.subLabel === "OPT OUT" ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {task.subLabel}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{task.provider_name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{task.detail}</p>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {resolved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Resolved
                  </span>
                ) : task.actionLabel ? (
                  <button
                    onClick={() => { if (task.actionLabel === "Close out") { resolveTask(task.id, "closed"); } else { selectContact(task.contact, task.engagement || undefined); } }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {task.actionLabel}
                  </button>
                ) : null}
              </div>
            </div>
          );
        }

        return (
          <>
            <div className="space-y-6">
              {/* Fixable section */}
              {fixableTasks.length > 0 && (
                <div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Fixable</span>
                      <span className="text-sm font-semibold text-amber-800">Fix and they resume · {fixableTasks.length}</span>
                    </div>
                    <p className="text-xs text-amber-600/70 mt-1 ml-0.5">Resolve the issue so the provider goes back into the sequence.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {fixableTasks.map(renderTicketRow)}
                  </div>
                </div>
              )}

              {/* Opt-out / close out section */}
              {optOutTasks.length > 0 && (
                <div>
                  <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full bg-red-100 text-red-700 border border-red-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Remove</span>
                      <span className="text-sm font-semibold text-red-800">Close out, do not resume · {optOutTasks.length}</span>
                    </div>
                    <p className="text-xs text-red-600/70 mt-1 ml-0.5">These providers asked to be removed. Close them out and suppress.</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {optOutTasks.map(renderTicketRow)}
                  </div>
                </div>
              )}

              {ticketTasks.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                  <p className="text-sm text-gray-500">No tickets right now.</p>
                </div>
              )}
            </div>
            {selectedContact && <ProviderDrawer provider={contactToProviderRow(selectedContact)} onClose={() => { setSelectedContact(null); setSelectedEngagement(null); }} engagement={selectedEngagement || undefined} variant="lead" />}
          </>
        );
      })()}

      {/* ═══ SEQUENCE TAB ═══ */}
      {activeTab === "sequence" && (() => {
        type EngagementFilter = "clicked" | "opened" | "replied" | "no_signal";

        function trackingToContact(row: TrackingRow): Contact {
          return {
            id: row.id, name: row.name, city: row.city, state: row.state,
            category: row.category, email: row.email, phone: row.phone,
            website: row.website, status: "in_sequence", slug: null,
            sequenceStep: row.stepLabel.split(" · ")[0] || null,
            stage: row.stepKey === "unresolved" ? "Do not contact" : "Active",
            agent: "Chantel Wright",
          };
        }

        // Get providers for the expanded step
        const expandedProviders = expandedStep
          ? TRACKING_DATA.filter((r) => r.stepKey === expandedStep)
          : [];

        // Engagement sub-filter for expanded step
        const engagementFilter = trackingFilter as string;
        const isEngagementFilter = ["clicked", "opened", "replied", "no_signal"].includes(engagementFilter);

        function getExpandedFilteredProviders(): TrackingRow[] {
          if (!isEngagementFilter) return expandedProviders;
          switch (engagementFilter) {
            case "clicked": return expandedProviders.filter((r) => (r.clicks || 0) > 0);
            case "opened": return expandedProviders.filter((r) => (r.opens || 0) > 0);
            case "replied": return expandedProviders.filter((r) => r.replied);
            case "no_signal": return expandedProviders.filter((r) => (r.opens || 0) === 0 && (r.clicks || 0) === 0 && !r.replied);
            default: return expandedProviders;
          }
        }

        const filteredExpandedProviders = getExpandedFilteredProviders();

        // Engagement counts for expanded step
        const expandedClicked = expandedProviders.filter((r) => (r.clicks || 0) > 0).length;
        const expandedOpened = expandedProviders.filter((r) => (r.opens || 0) > 0).length;
        const expandedReplied = expandedProviders.filter((r) => r.replied).length;
        const expandedNoSignal = expandedProviders.filter((r) => (r.opens || 0) === 0 && (r.clicks || 0) === 0 && !r.replied).length;

        return (
          <div>
            {/* Step summary table */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-4">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_60px_32px] gap-2 px-5 py-2.5 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Step</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Here now</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Opened</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Clicked</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Replied</span>
                  <span />
                </div>

                {/* Step rows */}
                <div className="divide-y divide-gray-100">
                  {(useLiveData
                    ? liveSteps!.map((ls) => {
                        const demo = STEP_SUMMARIES.find((s) => s.key === ls.key);
                        return {
                          ...demo,
                          key: ls.key,
                          label: ls.label,
                          emailName: ls.emailName,
                          subtitle: ls.subtitle,
                          sent: ls.sent,
                          hereNow: ls.here_now,
                          opened: ls.opened,
                          clicked: ls.clicked,
                          replied: ls.replied,
                          buttons: demo?.buttons,
                          insight: demo?.insight,
                          emailSubject: demo?.emailSubject,
                        } as StepSummary;
                      })
                    : STEP_SUMMARIES
                  ).map((step) => {
                    const isExpanded_ = expandedStep === step.key;
                    return (
                      <div key={step.key}>
                        <div
                          className={`grid grid-cols-[1fr_80px_80px_80px_60px_32px] gap-2 items-center px-5 py-3.5 cursor-pointer transition-colors ${
                            isExpanded_ ? "bg-primary-50/40 border-l-3 border-l-primary-500" : "hover:bg-gray-50"
                          }`}
                          onClick={() => { setExpandedStep(isExpanded_ ? null : step.key); if (!isExpanded_) setTrackingFilter("all"); }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                            <p className="text-xs mt-0.5 text-gray-400">{step.subtitle}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold tabular-nums text-gray-900">{step.hereNow}</span>
                          </div>
                          <div className="text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedStep(step.key); setTrackingFilter("opened" as TrackingFilter); }}
                              className={`text-sm tabular-nums font-medium ${step.opened > 0 ? "text-gray-700 underline decoration-dotted underline-offset-2 hover:text-gray-900" : "text-gray-300"}`}
                            >
                              {step.opened}
                            </button>
                          </div>
                          <div className="text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedStep(step.key); setTrackingFilter("clicked" as TrackingFilter); }}
                              className={`text-sm tabular-nums font-bold ${step.clicked > 0 ? "text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 hover:bg-amber-100" : "text-gray-300"}`}
                            >
                              {step.clicked}
                            </button>
                          </div>
                          <div className="text-center">
                            <span className={`text-sm tabular-nums ${step.replied > 0 ? "font-medium text-gray-900" : "text-gray-300"}`}>
                              {step.replied}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded_ ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded step detail */}
                        {isExpanded_ && (
                          <div className="border-t border-gray-200">
                            {/* Step detail header */}
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Tracking &rsaquo; {step.label.split(" · ")[0]}</p>
                                  <h3 className="text-base font-bold text-gray-900">{step.emailName}</h3>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {step.emailSubject}{step.emailSubject && " · "}{step.hereNow} providers here now
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPreviewStep(step.key); }}
                                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Preview email
                                </button>
                              </div>

                              {/* Stat cards — clickable to filter the provider list */}
                              {(() => {
                                const openPct = step.sent > 0 ? Math.round((step.opened / step.sent) * 100) : 0;
                                const clickPct = step.sent > 0 ? Math.round((step.clicked / step.sent) * 100) : 0;
                                const openHealth = getOpenRateHealth(openPct);
                                const clickHealth = getClickRateHealth(clickPct);

                                const cards: { key: string; filterKey: EngagementFilter | null; value: string; label: string; activeColor: string; activeBorder: string; activeText: string; healthColor?: string; healthText?: string; healthBorder?: string; healthBg?: string }[] = [
                                  { key: "sent", filterKey: null, value: String(step.sent), label: "Sent", activeColor: "", activeBorder: "", activeText: "" },
                                  { key: "opened", filterKey: "opened", value: `${openPct}%`, label: `Open rate · ${step.opened}`, activeColor: openHealth.bgColor, activeBorder: openHealth.borderColor, activeText: openHealth.textColor, healthColor: openHealth.color, healthText: openHealth.textColor, healthBorder: openHealth.borderColor, healthBg: openHealth.bgColor },
                                  { key: "clicked", filterKey: "clicked", value: `${clickPct}%`, label: `Click rate · ${step.clicked}`, activeColor: clickHealth.bgColor, activeBorder: clickHealth.borderColor, activeText: clickHealth.textColor, healthColor: clickHealth.color, healthText: clickHealth.textColor, healthBorder: clickHealth.borderColor, healthBg: clickHealth.bgColor },
                                  { key: "replied", filterKey: "replied", value: String(step.replied), label: "Replied", activeColor: "bg-emerald-50/60", activeBorder: "border-emerald-300", activeText: "text-emerald-700" },
                                ];
                                return (
                                  <div className="grid grid-cols-4 gap-3 mt-4">
                                    {cards.map((card) => {
                                      const isActive = card.filterKey && engagementFilter === card.filterKey;
                                      const isClickable = !!card.filterKey;
                                      return (
                                        <button
                                          key={card.key}
                                          type="button"
                                          disabled={!isClickable}
                                          onClick={() => {
                                            if (!card.filterKey) return;
                                            setTrackingFilter((engagementFilter === card.filterKey ? "all" : card.filterKey) as TrackingFilter);
                                          }}
                                          className={`rounded-lg px-4 py-3 text-left transition-all ${
                                            isActive
                                              ? `border-2 ${card.activeBorder} ${card.activeColor}`
                                              : card.healthBorder && !isActive
                                                ? `border ${card.healthBorder} ${card.healthBg} cursor-pointer`
                                                : isClickable
                                                  ? "border border-gray-200 bg-white hover:border-gray-300 cursor-pointer"
                                                  : "border border-gray-200 bg-white cursor-default"
                                          }`}
                                        >
                                          <p className={`text-xl font-bold tabular-nums ${
                                            isActive ? card.activeText : card.healthText || "text-gray-900"
                                          }`}>{card.value}</p>
                                          <p className={`text-[11px] mt-0.5 ${isActive ? card.activeText : card.healthText || "text-gray-400"}`}>
                                            {card.label}
                                            {card.healthColor === "red" && !isActive && (
                                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-red-600 font-semibold">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                Needs review
                                              </span>
                                            )}
                                          </p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Which button they clicked */}
                            {step.buttons && step.buttons.length > 0 && (() => {
                              const totalBtnClicks = step.buttons.reduce((sum, b) => sum + b.count, 0);
                              return (
                                <div className="px-5 py-4 border-b border-gray-100">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Which button they clicked</h4>
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    {step.buttons.map((btn, bi) => {
                                      const pct = totalBtnClicks > 0 ? Math.round((btn.count / totalBtnClicks) * 100) : 0;
                                      return (
                                        <div
                                          key={bi}
                                          className={`rounded-lg border px-3.5 py-2.5 ${
                                            btn.highlight
                                              ? "border-primary-300 bg-primary-50/60"
                                              : "border-gray-200 bg-gray-50/60"
                                          }`}
                                        >
                                          <p className={`text-sm font-bold tabular-nums ${btn.highlight ? "text-primary-700" : "text-gray-900"}`}>
                                            {pct}%
                                          </p>
                                          <p className={`text-[11px] mt-0.5 ${btn.highlight ? "text-primary-600" : "text-gray-500"}`}>
                                            {btn.label} · {btn.count}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {step.insight && (
                                    <p className="text-xs text-gray-400 mt-2.5">{step.insight}</p>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Provider list — filtered by stat card selection */}
                            <div className="px-5 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {engagementFilter === "opened" ? `Who opened · ${expandedOpened}`
                                    : engagementFilter === "clicked" ? `Who clicked · ${expandedClicked}`
                                    : engagementFilter === "replied" ? `Who replied · ${expandedReplied}`
                                    : `All providers · ${expandedProviders.length}`}
                                </h4>
                                {isEngagementFilter && (
                                  <button
                                    onClick={() => setTrackingFilter("all")}
                                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    Clear filter
                                  </button>
                                )}
                              </div>

                              {/* Provider table */}
                              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="grid grid-cols-[1fr_130px_70px_60px_70px] gap-2 px-5 py-2 border-b border-gray-100">
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Provider</span>
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Clicked</span>
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Opens</span>
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Tag</span>
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Action</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {(isEngagementFilter ? filteredExpandedProviders : expandedProviders).map((row) => {
                                    const isSelected = selectedContact?.id === row.id;
                                    return (
                                      <div
                                        key={row.id}
                                        onClick={() => selectContact(trackingToContact(row))}
                                        className={`grid grid-cols-[1fr_130px_70px_60px_70px] gap-2 items-center px-5 py-3.5 cursor-pointer transition-colors ${
                                          isSelected ? "bg-primary-50/40" : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-gray-900 truncate">{row.name}</p>
                                          <p className="text-xs text-gray-400 mt-0.5 truncate">{row.city}</p>
                                        </div>
                                        <span className="text-xs text-primary-600 font-medium truncate">
                                          {row.clickedButton || "--"}
                                        </span>
                                        <span className="text-sm tabular-nums text-gray-600 text-center">{row.opens || 0}</span>
                                        <div className="flex justify-center">
                                          {row.heat && (
                                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                              row.heat === "hot" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                            }`}>
                                              {row.heat}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                          {row.replied ? (
                                            <button
                                              onClick={() => selectContact(trackingToContact(row))}
                                              className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
                                            >
                                              {EMAIL_ICON}
                                              Reply
                                            </button>
                                          ) : (row.clicks || 0) > 0 || (row.opens || 0) > 1 ? (
                                            <button
                                              onClick={() => selectContact(trackingToContact(row))}
                                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                              {PHONE_ICON}
                                              Call
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Footer */}
                              <p className="text-xs text-gray-400 text-center mt-3">
                                Showing {(isEngagementFilter ? filteredExpandedProviders : expandedProviders).length} of {step.clicked} · sorted by most engaged · all are tagged and queued for a call
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Footer note */}
            <p className="text-xs text-gray-400 text-center mt-4">
              Open rate is unreliable, roughly half are mail servers. Click rate is the real measure.
            </p>

            {/* Provider drawer */}
            {selectedContact && <ProviderDrawer provider={contactToProviderRow(selectedContact)} onClose={() => { setSelectedContact(null); setSelectedEngagement(null); }} engagement={selectedEngagement || undefined} />}
          </div>
        );
      })()}

      {/* ═══ CLAIMED TAB ═══ */}
      {activeTab === "claimed" && (() => {
        // Group claimed providers by state
        const byState = DEMO_CLAIMED.reduce<Record<string, ClaimedProvider[]>>((acc, p) => {
          (acc[p.state] ||= []).push(p);
          return acc;
        }, {});
        const states = Object.keys(byState).sort();

        const viaLabel: Record<string, string> = { email: "Via email sequence", call: "Via phone call", self: "Self-claimed" };
        const viaColor: Record<string, string> = { email: "bg-blue-50 text-blue-700", call: "bg-amber-50 text-amber-700", self: "bg-emerald-50 text-emerald-700" };

        return (
          <div>
            {states.map((st) => {
              const providers = byState[st];
              return (
                <div key={st} className="mb-6">
                  {/* State banner */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">{st}</span>
                      <span className="text-sm font-semibold text-emerald-800">{providers.length} claimed</span>
                    </div>
                  </div>

                  {/* Provider rows */}
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {providers.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.category} · {p.city}, {p.state}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${viaColor[p.claimedVia]}`}>
                          {viaLabel[p.claimedVia]}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400 tabular-nums w-20 text-right">
                          {new Date(p.claimedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {DEMO_CLAIMED.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
                <p className="text-sm text-gray-500">No claimed providers yet.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Email Preview Modal */}
      {previewStep && (() => {
        const ep = STEP_EMAIL_PREVIEWS[previewStep];
        const stepSummary = STEP_SUMMARIES.find((s) => s.key === previewStep);
        if (!ep) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewStep(null)}>
            <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{stepSummary?.label || previewStep}</p>
                  <h2 className="text-base font-bold text-gray-900">{stepSummary?.emailName || "Email Preview"}</h2>
                </div>
                <button onClick={() => setPreviewStep(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stats bar */}
              {stepSummary && (
                <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  {[
                    { label: "Sent", value: String(stepSummary.sent) },
                    { label: "Opened", value: `${stepSummary.sent > 0 ? Math.round((stepSummary.opened / stepSummary.sent) * 100) : 0}%` },
                    { label: "Clicked", value: `${stepSummary.sent > 0 ? Math.round((stepSummary.clicked / stepSummary.sent) * 100) : 0}%` },
                    { label: "Replied", value: String(stepSummary.replied) },
                  ].map((s) => (
                    <div key={s.label} className="bg-white px-4 py-3 text-center">
                      <p className="text-lg font-bold text-gray-900 tabular-nums">{s.value}</p>
                      <p className="text-[11px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Email content */}
              <div className="px-6 py-5">
                {/* Subject line */}
                <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Subject</p>
                  <p className="text-sm font-semibold text-gray-900">{ep.subject}</p>
                </div>

                {/* Email body */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {/* Olera header */}
                  <div className="px-5 pt-4 pb-2">
                    <span className="text-lg font-bold" style={{ color: "#198087", letterSpacing: "-0.3px" }}>Olera</span>
                  </div>
                  {/* Body */}
                  <div className="px-5 pb-5">
                    {ep.fullBody.split("\n\n").map((para, i) => {
                      // CTA buttons
                      if (para.startsWith("[") && para.includes("]")) {
                        const buttons = para.match(/\[([^\]]+)\]/g)?.map((b) => b.slice(1, -1)) || [];
                        return (
                          <div key={i} className="flex flex-wrap gap-2 my-3">
                            {buttons.map((btn) => (
                              <span key={btn} className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: "#198087" }}>
                                {btn}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      // Arrow list items
                      if (para.includes("\u2192 ")) {
                        const lines = para.split("\n");
                        return (
                          <div key={i} className="my-2">
                            {lines.map((line, li) => {
                              if (line.startsWith("\u2192 ")) {
                                return (
                                  <div key={li} className="flex items-start gap-2 py-0.5">
                                    <span className="text-sm" style={{ color: "#198087" }}>&rarr;</span>
                                    <span className="text-sm text-gray-700 leading-relaxed">{line.slice(2)}</span>
                                  </div>
                                );
                              }
                              return <p key={li} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
                            })}
                          </div>
                        );
                      }
                      // Screenshot placeholder
                      if (para.includes("[Screenshot")) {
                        return (
                          <div key={i} className="my-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                            <p className="text-xs text-gray-400">Provider page screenshot</p>
                          </div>
                        );
                      }
                      // Regular paragraph
                      return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3">{para}</p>;
                    })}

                    {/* Signature */}
                    <hr className="my-4 border-gray-100" />
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Graize Belandres</p>
                        <p className="text-xs text-gray-500">Assistant to Dr. Logan DuBose</p>
                      </div>
                    </div>
                    <hr className="my-4 border-gray-100" />
                    <p className="text-[11px] text-gray-400 mb-2">Message Approved by Dr. Logan DuBose, MD/MBA</p>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
                        <p className="text-xs text-gray-500">Chief Research Officer, Olera</p>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="border-t border-gray-100 px-5 py-3">
                    <p className="text-[11px] text-gray-400">&copy; 2026 Olera &middot; olera.care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
