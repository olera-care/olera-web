/**
 * Research workspace — the Site-record "research layer" for partner prospecting.
 *
 * Office-centric MVP: the ADVISING OFFICE is the prospect. We capture the
 * office's name, contact channel (email — required for outreach), phone,
 * website, a required type tag, and its source links. Individual advisors are a
 * rare, high-bar bonus: only people with their OWN email/phone get latched under
 * an office; names without contact info become an "ask for" personalization
 * note. Everything lives on student_outreach_campuses.partner_research.workspace
 * [subtype] (no student_outreach rows until Generate).
 */

import type { PartnerSubtype } from "@/lib/medjobs/partner-sourcing";

/** Required type tag on every office prospect. Orgs only — individuals (advisor
 *  / professor) are latched under an org and derive their kind from it. */
export type OfficeTag = "advising_office" | "student_org" | "department";

export const OFFICE_TAGS: { key: OfficeTag; label: string }[] = [
  { key: "advising_office", label: "Advising office" },
  { key: "student_org", label: "Student org" },
  { key: "department", label: "Department" },
];

export interface WorkspaceLink {
  id: string;
  title: string;
  url: string;
  tier?: "primary" | "secondary" | "worth_a_look" | null;
  why?: string | null;
  likely?: string | null;
  source: "ai" | "manual";
  /** Extraction has been run over this link. */
  extracted?: boolean;
}

/** A latched individual — only created when they clear the bar (own email/phone
 *  + name + role). Lives UNDER an office; never a standalone prospect card. */
export interface WorkspaceAdvisor {
  id: string;
  office_id: string;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  source_url?: string | null;
}

export interface WorkspaceOffice {
  id: string;
  name: string;
  tag: OfficeTag;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  /** Verified names tied to this office but without their own contact — used to
   *  personalize the office email ("ask for X"), NOT prospects. */
  ask_for: string[];
  notes?: string | null;
  /** Kept links that support this office record. */
  source_link_ids: string[];
  verified?: boolean;
  /** No email found — kept as a phone "call" lead, out of the email funnel. */
  call_only?: boolean;
  /** Set once this office has been materialized into a prospect
   *  (student_outreach row). Locks it from re-generation so a returning user
   *  can't create duplicate prospects, and drives the "✓ In In-Basket" badge. */
  outreach_id?: string | null;
  generated_at?: string | null;
  // ── Department-head (person-shaped) fields ──────────────────────────────
  // For the dept_head subtype the "office" IS a department and the prospect is
  // ONE person (the chair). `name` is the department; these carry the chair,
  // and email/phone above are the chair's direct contact.
  /** The department chair/head/dean's full name. */
  person_name?: string | null;
  /** The chair's title/role as shown (e.g. "Department Chair", "Dean"). */
  person_title?: string | null;
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
  offices: WorkspaceOffice[];
  advisors: WorkspaceAdvisor[];
  generated_at: string | null;
  /** Un-kept AI link suggestions, persisted so a mid-triage break doesn't lose
   *  them (Task 4). Cleared as the admin keeps/discards each. */
  suggested?: WorkspaceLink[];
  /** Last step the admin was on for this subtype, so reopening resumes there
   *  instead of snapping back to "links". Stored as a plain string (the Step
   *  union lives in the workspace component). */
  last_step?: string;
}

export function emptyWorkspace(): WorkspaceState {
  return { links: [], searches: [], offices: [], advisors: [], generated_at: null, suggested: [] };
}

export function wsId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

/** Normalize an office name for reconciliation across links. */
export function normOffice(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]+$/g, "")
    .trim();
}

export function readWorkspace(partnerResearch: unknown, subtype: PartnerSubtype): WorkspaceState {
  const pr = (partnerResearch ?? {}) as Record<string, unknown>;
  const ws = (pr.workspace ?? {}) as Record<string, unknown>;
  const cur = (ws[subtype] ?? {}) as Partial<WorkspaceState>;
  return {
    links: Array.isArray(cur.links) ? (cur.links as WorkspaceLink[]) : [],
    searches: Array.isArray(cur.searches) ? (cur.searches as SearchState[]) : [],
    offices: Array.isArray(cur.offices) ? (cur.offices as WorkspaceOffice[]) : [],
    advisors: Array.isArray(cur.advisors) ? (cur.advisors as WorkspaceAdvisor[]) : [],
    generated_at: typeof cur.generated_at === "string" ? cur.generated_at : null,
    suggested: Array.isArray(cur.suggested) ? (cur.suggested as WorkspaceLink[]) : [],
    last_step: typeof cur.last_step === "string" ? cur.last_step : undefined,
  };
}

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

/** Predefined searches per subtype. Advising = office CONTACT pages (the
 *  general email/phone), ranked pre-health → nursing/allied → career services. */
export function predefinedSearches(subtype: PartnerSubtype, uni: string): SearchState[] {
  const g = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  if (subtype === "advisor") {
    return [
      { key: "office_contact", label: `Google: ${uni} pre-health advising office contact`, url: g(`${uni} pre-health advising office contact`), ran: false },
      { key: "hp_email", label: `Google: ${uni} health professions advising email`, url: g(`${uni} health professions advising email`), ran: false },
      { key: "nursing_allied", label: `Google: ${uni} pre-nursing OR allied health advising office`, url: g(`${uni} pre-nursing OR allied health advising office`), ran: false },
      { key: "career_contact", label: `Google: ${uni} career services contact email phone`, url: g(`${uni} career services contact email phone`), ran: false },
      { key: "prehealth_landing", label: `Google: ${uni} pre-health advising`, url: g(`${uni} pre-health advising`), ran: false },
    ];
  }
  if (subtype === "dept_head") {
    return [
      { key: "dept_bio", label: `Google: ${uni} biology department chair`, url: g(`${uni} biology department chair`), ran: false },
      { key: "dept_chem", label: `Google: ${uni} chemistry department chair`, url: g(`${uni} chemistry department chair`), ran: false },
      { key: "dept_kin", label: `Google: ${uni} kinesiology OR exercise science department chair`, url: g(`${uni} kinesiology OR exercise science department chair`), ran: false },
      { key: "dept_pubh", label: `Google: ${uni} public health department chair`, url: g(`${uni} public health department chair`), ran: false },
      { key: "dept_nursing", label: `Google: ${uni} nursing dean`, url: g(`${uni} nursing dean`), ran: false },
      { key: "dept_hsci", label: `Google: ${uni} health sciences dean`, url: g(`${uni} health sciences dean`), ran: false },
      { key: "dept_biomed", label: `Google: ${uni} biomedical sciences department head`, url: g(`${uni} biomedical sciences department head`), ran: false },
    ];
  }
  return [
    { key: "org_premed", label: `Google: pre-medical student organizations ${uni}`, url: g(`pre-medical student organizations ${uni}`), ran: false },
    { key: "org_prenursing", label: `Google: pre-nursing student organizations ${uni}`, url: g(`pre-nursing student organizations ${uni}`), ran: false },
    { key: "org_prepa", label: `Google: pre-PA student organizations ${uni}`, url: g(`pre-PA student organizations ${uni}`), ran: false },
    { key: "org_prept", label: `Google: pre-PT student organizations ${uni}`, url: g(`pre-PT student organizations ${uni}`), ran: false },
    { key: "org_pubh", label: `Google: public health student organizations ${uni}`, url: g(`public health student organizations ${uni}`), ran: false },
    { key: "org_geriatrics", label: `Google: geriatrics student organizations ${uni}`, url: g(`geriatrics student organizations ${uni}`), ran: false },
  ];
}

export function mergeSearches(saved: SearchState[], defaults: SearchState[]): SearchState[] {
  const ranByKey = new Map(saved.map((s) => [s.key, s.ran]));
  return defaults.map((d) => ({ ...d, ran: ranByKey.get(d.key) ?? false }));
}
