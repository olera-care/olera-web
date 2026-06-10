/**
 * Research workspace — the Site-record "research layer" for partner prospecting.
 *
 * Everything the admin builds while researching a university (the approved link
 * set, the predefined searches they ran, and the offices + people they verify)
 * lives on the Site's `partner_research.workspace[subtype]` JSONB — NOT as
 * student_outreach rows. Prospects are only materialized at the Generate step
 * (see /api/admin/medjobs/research-workspace/generate), after attestation.
 *
 * This keeps the model the user asked for:
 *   - Site record  = research layer (links, offices, members, notes — permanent)
 *   - Prospects tab = action layer  (outreach-ready contacts, created on Generate)
 *
 * No new table: this nests inside the existing partner_research JSONB column.
 */

import type { PartnerSubtype } from "@/lib/medjobs/partner-sourcing";

export interface WorkspaceLink {
  id: string;
  title: string;
  url: string;
  tier?: "primary" | "secondary" | "worth_a_look" | null;
  why?: string | null;
  likely?: string | null;
  /** Where the link came from — AI discovery vs. typed by hand. */
  source: "ai" | "manual";
}

export interface WorkspaceMember {
  id: string;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  source_url?: string | null;
}

export interface WorkspaceOffice {
  id: string;
  name: string;
  general_email?: string | null;
  general_phone?: string | null;
  website?: string | null;
  notes?: string | null;
  members: WorkspaceMember[];
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
  /** Set when prospects were materialized from this workspace. */
  generated_at: string | null;
}

export function emptyWorkspace(): WorkspaceState {
  return { links: [], searches: [], offices: [], generated_at: null };
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
export function readWorkspace(
  partnerResearch: unknown,
  subtype: PartnerSubtype,
): WorkspaceState {
  const pr = (partnerResearch ?? {}) as Record<string, unknown>;
  const ws = (pr.workspace ?? {}) as Record<string, unknown>;
  const cur = (ws[subtype] ?? {}) as Partial<WorkspaceState>;
  return {
    links: Array.isArray(cur.links) ? (cur.links as WorkspaceLink[]) : [],
    searches: Array.isArray(cur.searches) ? (cur.searches as SearchState[]) : [],
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

/** Predefined manual searches per subtype (the admin checks them off in Step 1). */
export function predefinedSearches(subtype: PartnerSubtype, uni: string): SearchState[] {
  const g = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const li = (q: string) =>
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
  if (subtype === "advisor") {
    return [
      { key: "advisor_office", label: `Google: "${uni} pre-health advisor"`, url: g(`${uni} pre-health advisor`), ran: false },
      { key: "advisor_staff", label: `Google: "${uni} health professions advising staff"`, url: g(`${uni} health professions advising staff`), ran: false },
      { key: "advisor_cns", label: `Google: ${uni} college of science academic advising`, url: g(`${uni} college of natural sciences academic advising`), ran: false },
      { key: "advisor_li", label: `LinkedIn: pre-health advisor ${uni}`, url: li(`pre-health advisor ${uni}`), ran: false },
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
    { key: "org_ig", label: `Google: ${uni} pre-health club instagram`, url: g(`${uni} pre-health club instagram`), ran: false },
    { key: "org_advisor", label: `Google: ${uni} pre-med society faculty advisor`, url: g(`${uni} pre-med society faculty advisor`), ran: false },
  ];
}

/** Merge predefined searches with any saved "ran" state. */
export function mergeSearches(saved: SearchState[], defaults: SearchState[]): SearchState[] {
  const ranByKey = new Map(saved.map((s) => [s.key, s.ran]));
  return defaults.map((d) => ({ ...d, ran: ranByKey.get(d.key) ?? false }));
}
