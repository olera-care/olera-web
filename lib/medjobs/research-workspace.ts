/**
 * Research workspace — the Site-record "research layer" for partner prospecting.
 *
 * The spine is the LIST OF LINKS. For each link the admin extracts contacts,
 * assigns each to an office (or marks it an individual), and confirms the page.
 * Everything lives on student_outreach_campuses.partner_research.workspace
 * [subtype] (no student_outreach rows until Generate). Model:
 *
 *   links[]    — the approved link set, each with extracted/confirmed flags
 *   searches[] — predefined searches the admin checks off
 *   contacts[] — flat list; each carries the link it came from + its office
 *                assignment ("" unassigned, "individual", or an office id)
 *   offices[]  — named buckets contacts get grouped into
 *
 * No new table: this nests inside the existing partner_research JSONB column.
 */

import type { PartnerSubtype, PartnerCandidate } from "@/lib/medjobs/partner-sourcing";

export interface WorkspaceLink {
  id: string;
  title: string;
  url: string;
  tier?: "primary" | "secondary" | "worth_a_look" | null;
  why?: string | null;
  likely?: string | null;
  source: "ai" | "manual";
  /** AI has run an extraction pass on this page. */
  extracted?: boolean;
  /** Admin reopened the page and confirmed nothing's missing. */
  confirmed?: boolean;
}

/** Sentinel assignment values. Anything else is an office id. */
export const UNASSIGNED = "";
export const INDIVIDUAL = "individual";

export interface WorkspaceContact {
  id: string;
  /** Link this contact was extracted from; null = added by hand. */
  source_link_id: string | null;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  source_url?: string | null;
  /** "" = unassigned (forces a conscious choice), "individual", or an office id. */
  assignment: string;
}

export interface WorkspaceOffice {
  id: string;
  name: string;
}

export interface SearchState {
  key: string;
  label: string;
  url: string;
  ran: boolean;
}

export interface WorkspaceState {
  links: WorkspaceLink[];
  searches: SearchState[];
  contacts: WorkspaceContact[];
  offices: WorkspaceOffice[];
  /** Set when prospects were materialized from this workspace. */
  generated_at: string | null;
}

export function emptyWorkspace(): WorkspaceState {
  return { links: [], searches: [], contacts: [], offices: [], generated_at: null };
}

/** Crypto-id that works in both the browser and the Node route. */
export function wsId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

/** Read one subtype's workspace out of a campus partner_research blob. */
export function readWorkspace(partnerResearch: unknown, subtype: PartnerSubtype): WorkspaceState {
  const pr = (partnerResearch ?? {}) as Record<string, unknown>;
  const ws = (pr.workspace ?? {}) as Record<string, unknown>;
  const cur = (ws[subtype] ?? {}) as Partial<WorkspaceState>;
  return {
    links: Array.isArray(cur.links) ? (cur.links as WorkspaceLink[]) : [],
    searches: Array.isArray(cur.searches) ? (cur.searches as SearchState[]) : [],
    contacts: Array.isArray(cur.contacts) ? (cur.contacts as WorkspaceContact[]) : [],
    offices: Array.isArray(cur.offices) ? (cur.offices as WorkspaceOffice[]) : [],
    generated_at: typeof cur.generated_at === "string" ? cur.generated_at : null,
  };
}

/** Merge a workspace patch back into the partner_research blob (immutable). */
export function writeWorkspace(
  partnerResearch: unknown,
  subtype: PartnerSubtype,
  patch: Partial<WorkspaceState>,
): Record<string, unknown> {
  const pr = { ...((partnerResearch ?? {}) as Record<string, unknown>) };
  const ws = { ...((pr.workspace ?? {}) as Record<string, unknown>) };
  const cur = (ws[subtype] ?? emptyWorkspace()) as WorkspaceState;
  ws[subtype] = { ...cur, ...patch };
  pr.workspace = ws;
  return pr;
}

/** Predefined searches per subtype. Advising = flagship advising web pages only
 *  (no LinkedIn / social — those come later for student orgs). */
export function predefinedSearches(subtype: PartnerSubtype, uni: string): SearchState[] {
  const g = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  if (subtype === "advisor") {
    return [
      { key: "advisor_office", label: `Google: ${uni} pre-health advising office`, url: g(`${uni} pre-health advising office`), ran: false },
      { key: "advisor_staff", label: `Google: ${uni} health professions advising staff`, url: g(`${uni} health professions advising staff`), ran: false },
      { key: "advisor_premed", label: `Google: ${uni} pre-med advisor`, url: g(`${uni} pre-med advisor`), ran: false },
      { key: "advisor_cns", label: `Google: ${uni} college of natural sciences health professions advising`, url: g(`${uni} college of natural sciences health professions advising`), ran: false },
    ];
  }
  if (subtype === "dept_head") {
    return [
      { key: "dept_bio", label: `Google: ${uni} biology department chair`, url: g(`${uni} biology department chair`), ran: false },
      { key: "dept_chem", label: `Google: ${uni} chemistry department chair`, url: g(`${uni} chemistry department chair`), ran: false },
      { key: "dept_health", label: `Google: ${uni} public health / kinesiology department head`, url: g(`${uni} public health kinesiology department head`), ran: false },
      { key: "dept_dir", label: `Google: ${uni} department chairs directory`, url: g(`${uni} department chairs directory`), ran: false },
    ];
  }
  return [
    { key: "org_premed", label: `Google: ${uni} pre-med society`, url: g(`${uni} pre-med society`), ran: false },
    { key: "org_dir", label: `Google: ${uni} student organizations directory pre-health`, url: g(`${uni} student organizations directory pre-health`), ran: false },
    { key: "org_advisor", label: `Google: ${uni} pre-med society faculty advisor`, url: g(`${uni} pre-med society faculty advisor`), ran: false },
  ];
}

/** Merge predefined searches with any saved "ran" state. */
export function mergeSearches(saved: SearchState[], defaults: SearchState[]): SearchState[] {
  const ranByKey = new Map(saved.map((s) => [s.key, s.ran]));
  return defaults.map((d) => ({ ...d, ran: ranByKey.get(d.key) ?? false }));
}

/**
 * Flatten one AI candidate into workspace contacts (a general-office contact +
 * each named person). Contacts come back UNASSIGNED — the admin makes the
 * office choice consciously. Returns the candidate's office name so the caller
 * can seed an office bucket for the dropdown.
 */
export function contactsFromCandidate(
  c: PartnerCandidate,
  sourceLinkId: string | null,
): { contacts: WorkspaceContact[]; officeName: string | null } {
  const contacts: WorkspaceContact[] = [];
  const officeName =
    c.subtype === "dept_head" && c.department ? `${c.department} Department` : c.name ?? null;

  // General office contact (an org email with no personal name).
  const orgEmail = c.org_email ?? (c.subtype === "dept_head" ? null : null);
  if (orgEmail) {
    contacts.push({
      id: wsId(),
      source_link_id: sourceLinkId,
      name: null,
      role: "General contact",
      email: orgEmail,
      phone: c.phone ?? null,
      source_url: c.source_url ?? null,
      assignment: UNASSIGNED,
    });
  }
  for (const o of c.officers ?? []) {
    if (!o.name && !o.email) continue;
    contacts.push({
      id: wsId(),
      source_link_id: sourceLinkId,
      name: o.name ?? null,
      role: o.role ?? null,
      email: o.email ?? null,
      source_url: o.source_url ?? null,
      assignment: UNASSIGNED,
    });
  }
  if (c.faculty_advisor?.name || c.faculty_advisor?.email) {
    contacts.push({
      id: wsId(),
      source_link_id: sourceLinkId,
      name: c.faculty_advisor.name ?? null,
      role: "Faculty advisor",
      email: c.faculty_advisor.email ?? null,
      source_url: c.faculty_advisor.source_url ?? null,
      assignment: UNASSIGNED,
    });
  }
  // dept_head is person-shaped — the chair is a single person contact.
  if (c.subtype === "dept_head" && (c.name || c.email)) {
    contacts.push({
      id: wsId(),
      source_link_id: sourceLinkId,
      name: c.name ?? null,
      role: c.title ?? "Department chair",
      email: c.email ?? null,
      phone: c.phone ?? null,
      source_url: c.source_url ?? null,
      assignment: UNASSIGNED,
    });
  }
  return { contacts, officeName };
}

/** True when a contact is the office's general contact (org email, no person). */
export function isGeneralContact(c: WorkspaceContact): boolean {
  if (c.role && /general/i.test(c.role)) return true;
  return !c.name?.trim() && Boolean(c.email?.trim());
}
