import type { Connection, ConnectionStatus, Profile } from "@/lib/types";
import type { ConnectionWithProfile } from "@/components/messaging/ConversationList";

// ── Types ──

type Urgency = "immediate" | "within_1_month" | "exploring";
type LeadStatus = "new" | "replied" | "no_reply" | "archived";
type ContactMethod = "phone" | "email" | "either";

interface ActivityEvent {
  label: string;
  date: string;
}

interface Lead {
  id: string;
  name: string;
  initials: string;
  subtitle: string;
  location: string;
  urgency: Urgency;
  status: LeadStatus;
  date: string;
  isNew: boolean;
}

export interface LeadDetail extends Lead {
  email?: string;
  phone?: string;
  contactPreference?: ContactMethod;
  careRecipient?: string;
  careRecipientName?: string;
  careType?: string[];
  careNeeds?: string[];
  livingSituation?: string;
  schedulePreference?: string;
  careLocation?: string;
  languagePreference?: string;
  insuranceType?: string;
  benefits?: string[];
  additionalNotes?: string;
  activity?: ActivityEvent[];
  archivedDate?: string;
  archiveReason?: string;
  messagedAt?: string;
}

// ── Mock leads data ──

export const MOCK_LEADS: LeadDetail[] = [
  {
    id: "1", name: "Sarah Reynolds", initials: "SR", subtitle: "For her mother, 78",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "2h ago", isNew: true,
    email: "sarah.reynolds@gmail.com", phone: "(512) 555-0147", contactPreference: "phone",
    careRecipient: "Mother, 78", careRecipientName: "Margaret", careType: ["In-home care", "Companionship"],
    careNeeds: ["Mobility assistance", "Medication management", "Meal preparation"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, daytime", careLocation: "Care recipient\u2019s home", languagePreference: "English",
    insuranceType: "Medicare Advantage", benefits: ["Long-term care insurance", "VA benefits"],
    additionalNotes: "Mom recently had a fall and needs someone who can help with daily activities. She\u2019s very independent and would prefer someone patient and friendly. We\u2019re hoping to start as soon as possible.",
    activity: [
      { label: "Lead received", date: "2h ago \u00b7 Via Olera search" },
      { label: "Profile viewed by you", date: "Just now" },
    ],
  },
  {
    id: "2", name: "James Adeyemi", initials: "JA", subtitle: "For his father, 85",
    location: "Round Rock, TX", urgency: "within_1_month", status: "new", date: "5h ago", isNew: true,
    email: "james.adeyemi@outlook.com", phone: "(512) 555-0231", contactPreference: "email",
    careRecipient: "Father, 85", careRecipientName: "Emmanuel", careType: ["In-home care", "Personal care"],
    careNeeds: ["Bathing assistance", "Transportation", "Light housekeeping"],
    livingSituation: "Lives with family", schedulePreference: "Flexible", careLocation: "Care recipient\u2019s home", languagePreference: "English, Yoruba",
    insuranceType: "Medicaid", benefits: ["Medicaid waiver program"],
    additionalNotes: "My father speaks both English and Yoruba. A caregiver who understands Nigerian culture would be a huge plus. He needs help a few hours each day while I\u2019m at work.",
    activity: [
      { label: "Lead received", date: "5h ago \u00b7 Via provider profile" },
      { label: "Profile viewed by you", date: "Just now" },
    ],
  },
  {
    id: "3", name: "Diana Nguyen", initials: "DN", subtitle: "For her grandmother, 91",
    location: "Austin, TX", urgency: "immediate", status: "new", date: "1d ago", isNew: true,
    email: "diana.nguyen@yahoo.com", phone: "(512) 555-0389", contactPreference: "either",
    careRecipient: "Grandmother, 91", careRecipientName: "Mei", careType: ["In-home care", "Memory care"],
    careNeeds: ["Dementia support", "24/7 supervision", "Medication management"],
    livingSituation: "Lives with family", schedulePreference: "Full-time, live-in preferred", careLocation: "Care recipient\u2019s home", languagePreference: "English, Vietnamese",
    insuranceType: "Medicare", benefits: ["Long-term care insurance"],
    additionalNotes: "Grandmother has moderate dementia and needs constant supervision. She sometimes wanders and gets confused at night. Vietnamese-speaking caregiver strongly preferred.",
    activity: [
      { label: "Lead received", date: "1d ago \u00b7 Via Olera search" },
    ],
  },
  {
    id: "4", name: "Linda Washington", initials: "LW", subtitle: "For her husband, 72",
    location: "Austin, TX", urgency: "immediate", status: "replied", date: "2d ago", isNew: false,
    email: "linda.washington@gmail.com", phone: "(512) 555-0512", contactPreference: "phone",
    careRecipient: "Husband, 72", careRecipientName: "David", careType: ["In-home care", "Post-surgery care"],
    careNeeds: ["Physical therapy support", "Wound care", "Mobility assistance"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekdays, mornings", careLocation: "Care recipient\u2019s home", languagePreference: "English",
    insuranceType: "Private insurance", benefits: ["Short-term disability"],
    additionalNotes: "My husband just had hip replacement surgery. We need someone experienced with post-op recovery. He\u2019ll need help for about 6\u20138 weeks.",
    activity: [
      { label: "Lead received", date: "2d ago \u00b7 Via Olera search" },
      { label: "You sent a message", date: "1d ago" },
      { label: "Profile viewed by you", date: "1d ago" },
    ],
  },
  {
    id: "5", name: "Robert Park", initials: "RP", subtitle: "For his wife, 68",
    location: "Pflugerville, TX", urgency: "exploring", status: "replied", date: "3d ago", isNew: false,
    email: "robert.park@gmail.com", phone: "(512) 555-0678", contactPreference: "email",
    careRecipient: "Wife, 68", careRecipientName: "Soo-jin", careType: ["Companionship", "Respite care"],
    careNeeds: ["Companionship", "Light housekeeping", "Meal preparation"],
    livingSituation: "Lives with spouse", schedulePreference: "Weekends", careLocation: "Care recipient\u2019s home", languagePreference: "English, Korean",
    insuranceType: "Medicare Advantage", benefits: [],
    additionalNotes: "I\u2019m the primary caregiver for my wife and I just need someone to give me a break on weekends. She\u2019s mostly independent but enjoys company.",
    activity: [
      { label: "Lead received", date: "3d ago \u00b7 Via provider profile" },
      { label: "You replied", date: "2d ago" },
    ],
  },
  {
    id: "6", name: "Maria Kowalski", initials: "MK", subtitle: "For her parents, both 80s",
    location: "Cedar Park, TX", urgency: "exploring", status: "no_reply", date: "5d ago", isNew: false,
    email: "maria.kowalski@hotmail.com", phone: "(512) 555-0845", contactPreference: "either",
    careRecipient: "Parents, both 80s", careRecipientName: "her parents", careType: ["In-home care", "Companionship"],
    careNeeds: ["Meal preparation", "Transportation", "Medication reminders"],
    livingSituation: "Live together, own home", schedulePreference: "Flexible, part-time", careLocation: "Care recipients\u2019 home", languagePreference: "English, Polish",
    insuranceType: "Medicare", benefits: ["Long-term care insurance", "VA benefits"],
    additionalNotes: "Both parents need light help throughout the week. They\u2019re still fairly active but need reminders for medications and someone to drive them to appointments.",
    activity: [
      { label: "Lead received", date: "5d ago \u00b7 Via Olera search" },
    ],
  },
  {
    id: "7", name: "Tomoko Chen", initials: "TC", subtitle: "For her father, 89",
    location: "Austin, TX", urgency: "within_1_month", status: "replied", date: "1w ago", isNew: false,
    email: "tomoko.chen@gmail.com", phone: "(512) 555-0923", contactPreference: "phone",
    careRecipient: "Father, 89", careRecipientName: "Wei", careType: ["In-home care", "Hospice support"],
    careNeeds: ["End-of-life care", "Pain management support", "Companionship"],
    livingSituation: "Lives with family", schedulePreference: "Full-time", careLocation: "Care recipient\u2019s home", languagePreference: "English, Mandarin",
    insuranceType: "Medicare", benefits: ["Hospice benefit"],
    additionalNotes: "Dad is in hospice and we want to make sure he\u2019s comfortable at home. Looking for someone compassionate who can be with him during the day while we work.",
    activity: [
      { label: "Lead received", date: "1w ago \u00b7 Via Olera search" },
      { label: "You replied", date: "5d ago" },
      { label: "Family responded", date: "4d ago" },
      { label: "You sent a message", date: "3d ago" },
      { label: "Lead archived", date: "2d ago" },
    ],
  },
  {
    id: "8", name: "Angela Johnson", initials: "AJ", subtitle: "For herself, 66",
    location: "Georgetown, TX", urgency: "within_1_month", status: "no_reply", date: "1w ago", isNew: false,
    email: "angela.johnson@aol.com", phone: "(512) 555-0101", contactPreference: "phone",
    careRecipient: "Self, 66", careRecipientName: "Angela", careType: ["Companionship", "Personal care"],
    careNeeds: ["Companionship", "Grocery shopping", "Light exercise assistance"],
    livingSituation: "Lives alone", schedulePreference: "Weekdays, afternoons", careLocation: "Own home", languagePreference: "English",
    insuranceType: "Private insurance", benefits: [],
    additionalNotes: "I\u2019m looking for a companion who can help me stay active. I enjoy walks and would love someone to chat with and help with errands a few afternoons a week.",
    activity: [
      { label: "Lead received", date: "1w ago \u00b7 Via provider profile" },
    ],
  },
];

// ── Mappings ──

const CARE_TYPE_MAP: Record<string, string> = {
  "In-home care": "home_care",
  "Home health care": "home_health",
  "Assisted living": "assisted_living",
  "Memory care": "memory_care",
  "Companionship": "home_care",
  "Personal care": "home_care",
  "Post-surgery care": "home_health",
  "Respite care": "home_care",
  "Hospice support": "home_health",
};

const URGENCY_MAP: Record<Urgency, string> = {
  immediate: "asap",
  within_1_month: "within_month",
  exploring: "researching",
};

function mapCareRecipient(raw?: string): string {
  if (!raw) return "other";
  const lower = raw.toLowerCase();
  if (lower.startsWith("self")) return "self";
  if (lower.startsWith("mother") || lower.startsWith("father") || lower.startsWith("parent")) return "parent";
  if (lower.startsWith("husband") || lower.startsWith("wife") || lower.startsWith("spouse")) return "spouse";
  return "other";
}

// ── Relative date parser ──

function relativeToISO(relative: string): string {
  const now = Date.now();
  const match = relative.match(/^(\d+)(h|d|w)/);
  if (!match) return new Date(now - 3600_000).toISOString(); // fallback: 1h ago
  const [, n, unit] = match;
  const num = parseInt(n, 10);
  const ms = unit === "h" ? num * 3600_000 : unit === "d" ? num * 86400_000 : num * 604800_000;
  return new Date(now - ms).toISOString();
}

// ── Thread message type ──

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
}

// ── localStorage helpers ──

const MOCK_THREADS_KEY = "olera_mock_threads";

export function persistMockMessage(leadId: string, text: string, providerProfileId: string): void {
  try {
    const existing = JSON.parse(localStorage.getItem(MOCK_THREADS_KEY) || "{}");
    const threadKey = `mock-lead-${leadId}`;
    const existingThread: ThreadMessage[] = existing[threadKey] || [];
    existingThread.push({
      from_profile_id: providerProfileId,
      text: text.trim(),
      created_at: new Date().toISOString(),
    });
    existing[threadKey] = existingThread;
    localStorage.setItem(MOCK_THREADS_KEY, JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("olera:mock-thread-updated", { detail: threadKey }));
  } catch {
    // localStorage unavailable
  }
}

export function persistMockThread(connectionId: string, thread: ThreadMessage[]): void {
  try {
    const existing = JSON.parse(localStorage.getItem(MOCK_THREADS_KEY) || "{}");
    existing[connectionId] = thread;
    localStorage.setItem(MOCK_THREADS_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable
  }
}

export function getMockThreadOverrides(): Record<string, ThreadMessage[]> {
  try {
    return JSON.parse(localStorage.getItem(MOCK_THREADS_KEY) || "{}");
  } catch {
    return {};
  }
}

// ── Transformer: Lead → ConnectionWithProfile ──

function buildMockThread(lead: LeadDetail, providerProfileId: string): ThreadMessage[] {
  const thread: ThreadMessage[] = [];
  const createdAt = relativeToISO(lead.date);

  // For leads where the provider has replied, add mock messages
  if (lead.activity) {
    for (const event of lead.activity) {
      if (event.label.includes("You sent a message") || event.label.includes("You replied")) {
        thread.push({
          from_profile_id: providerProfileId,
          text: `Thank you for reaching out about care for ${lead.careRecipientName || "your loved one"}. I'd love to learn more about your needs and discuss how we can help. When would be a good time to talk?`,
          created_at: relativeToISO(event.date),
        });
      }
      if (event.label.includes("Family responded")) {
        thread.push({
          from_profile_id: `mock-family-${lead.id}`,
          text: `That sounds great, thank you! I'm available most afternoons this week. Would Thursday or Friday work for a call?`,
          created_at: relativeToISO(event.date),
        });
      }
    }
  }

  return thread;
}

function buildMockFamilyProfile(lead: LeadDetail): Profile {
  const [city, state] = lead.location.split(", ");
  return {
    id: `mock-family-${lead.id}`,
    account_id: null,
    source_provider_id: null,
    slug: lead.name.toLowerCase().replace(/\s+/g, "-"),
    type: "family",
    category: null,
    display_name: lead.name,
    description: null,
    image_url: null,
    phone: lead.phone || null,
    email: lead.email || null,
    website: null,
    address: null,
    city: city || null,
    state: state || null,
    zip: null,
    lat: null,
    lng: null,
    service_area: null,
    care_types: [],
    metadata: {},
    claim_state: "unclaimed",
    verification_state: "unverified",
    source: "user_created",
    is_active: true,
    created_at: relativeToISO(lead.date),
    updated_at: relativeToISO(lead.date),
  };
}

function leadToConnection(lead: LeadDetail, providerProfile: Profile): ConnectionWithProfile {
  const createdAt = relativeToISO(lead.date);
  const firstName = lead.name.split(" ")[0];
  const lastName = lead.name.split(" ").slice(1).join(" ");
  const careType = lead.careType?.[0] ? (CARE_TYPE_MAP[lead.careType[0]] || "home_care") : "home_care";
  const status: ConnectionStatus = lead.status === "replied" ? "accepted" : "pending";

  const baseThread = buildMockThread(lead, providerProfile.id);

  // Merge with any persisted messages from localStorage, normalizing "provider" → actual ID
  const overrides = getMockThreadOverrides();
  const extra = (overrides[`mock-lead-${lead.id}`] || []).map((msg) => ({
    ...msg,
    from_profile_id: msg.from_profile_id === "provider" ? providerProfile.id : msg.from_profile_id,
  }));
  const thread = [...baseThread, ...extra];

  return {
    id: `mock-lead-${lead.id}`,
    from_profile_id: `mock-family-${lead.id}`,
    to_profile_id: providerProfile.id,
    type: "inquiry",
    status,
    message: JSON.stringify({
      care_type: careType,
      care_recipient: mapCareRecipient(lead.careRecipient),
      urgency: URGENCY_MAP[lead.urgency],
      additional_notes: lead.additionalNotes || null,
      seeker_first_name: firstName,
      seeker_last_name: lastName,
    }),
    metadata: {
      auto_intro: lead.additionalNotes || null,
      thread,
    },
    created_at: createdAt,
    updated_at: thread.length > 0 ? thread[thread.length - 1].created_at : createdAt,
    fromProfile: buildMockFamilyProfile(lead),
    toProfile: providerProfile,
  };
}

/**
 * Transform mock leads into ConnectionWithProfile objects for the inbox.
 * Excludes archived leads (matching real inbox behavior).
 */
export function getMockConnections(providerProfile: Profile): ConnectionWithProfile[] {
  return MOCK_LEADS
    .filter((lead) => lead.status !== "archived")
    .map((lead) => leadToConnection(lead, providerProfile));
}

/**
 * Return mock connection IDs (lightweight — no profile needed).
 * Used by the unread count hook to count mock inbox conversations.
 */
export function getMockConnectionIds(): string[] {
  return MOCK_LEADS
    .filter((lead) => lead.status !== "archived")
    .map((lead) => `mock-lead-${lead.id}`);
}
