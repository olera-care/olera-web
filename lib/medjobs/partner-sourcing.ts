/**
 * Partner sourcing — AI research accelerator for the MedJobs partner
 * (university stakeholder) funnel. Chunk 1.1 of the Partner Recruitment System
 * (see docs/medjobs/PARTNER_RECRUITMENT_SYSTEM.md §15).
 *
 * Two stages, both read-only (this module NEVER writes to student_outreach):
 *   1. buildSourceMap()  → the university pages worth checking for a subtype,
 *      tiered primary/secondary/worth_a_look. Optimized for BREADTH so it
 *      doubles as the human-audit research map (R3/R4).
 *   2. extractPartners() → structured candidate records per subtype, every
 *      field carrying a source URL where possible, all unverified. The admin
 *      reviews + accepts in the widget (Chunk 1.2); accepted records flow
 *      through the EXISTING POST /api/admin/student-outreach/stakeholders path.
 *
 * The AI is an accelerator, never a truth source — human-in-the-loop verifies
 * everything (mirrors provider pre-flight). Branding rule R1 applies to any
 * copy downstream, not here.
 *
 * House pattern mirrors lib/medjobs/outreach-enrichment.ts: Perplexity Sonar,
 * env-gated, cost-tracked, fail-closed (no key / no result → empty, never
 * throws out of a stage).
 */

import { perplexityJson, CostTracker } from "@/lib/medjobs/outreach-enrichment";

/** MVP subtypes. Professor is deferred (P-D1) — gated on dept-head permission. */
export type PartnerSubtype = "advisor" | "student_org" | "dept_head";

export const PARTNER_SUBTYPES: PartnerSubtype[] = ["advisor", "student_org", "dept_head"];

/** Default prerequisite departments to sweep for dept heads when the admin
 *  doesn't scope explicitly. */
const DEFAULT_DEPARTMENTS = [
  "biology",
  "chemistry",
  "psychology",
  "public health",
  "kinesiology",
  "nursing",
  "allied health",
];

export interface UniversityContext {
  university: string;
  city?: string | null;
  state?: string | null;
  /** Optional scope for dept_head (and to focus org/advisor search). */
  departments?: string[];
}

export type SourceTier = "primary" | "secondary" | "worth_a_look";

export interface SourceLink {
  title: string;
  url: string;
  tier: SourceTier;
}

export interface OrgOfficer {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  source_url?: string | null;
}

export interface FacultyAdvisor {
  name?: string | null;
  email?: string | null;
  profile_url?: string | null;
  source_url?: string | null;
}

export interface SocialLink {
  platform: string;
  url: string;
}

/** One AI-suggested candidate. Shape is a superset across subtypes; the widget
 *  renders the fields relevant to the chosen subtype. Everything is unverified. */
export interface PartnerCandidate {
  subtype: PartnerSubtype;
  /** Person name (advisor/dept head) OR org name (student_org). */
  name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_url?: string | null;
  source_url?: string | null;
  notes?: string | null;
  confidence?: "high" | "medium" | "low" | null;

  // dept_head
  department?: string | null;

  // student_org
  org_email?: string | null;
  website?: string | null;
  directory_url?: string | null;
  socials?: SocialLink[];
  officers?: OrgOfficer[];
  faculty_advisor?: FacultyAdvisor | null;
}

export interface SourceMapResult {
  sources: SourceLink[];
  cost: number;
}

export interface ExtractResult {
  candidates: PartnerCandidate[];
  cost: number;
}

// ---------------------------------------------------------------------------
// Defensive parsing helpers — the model output is untrusted.
// ---------------------------------------------------------------------------

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function confidence(v: unknown): PartnerCandidate["confidence"] {
  const s = str(v)?.toLowerCase();
  return s === "high" || s === "medium" || s === "low" ? s : null;
}

function tier(v: unknown): SourceTier {
  const s = str(v)?.toLowerCase();
  if (s === "primary") return "primary";
  if (s === "worth_a_look" || s === "worth a look") return "worth_a_look";
  return "secondary";
}

/** Accept only http(s) URLs. */
function url(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

// ---------------------------------------------------------------------------
// Stage 1 — source map
// ---------------------------------------------------------------------------

function sourceMapPrompt(ctx: UniversityContext, subtype: PartnerSubtype): string {
  const where = [ctx.university, ctx.city, ctx.state].filter(Boolean).join(", ");
  const pageTypes: Record<PartnerSubtype, string> = {
    advisor:
      "pre-health / pre-med / pre-nursing / health-professions advising office pages, " +
      "advising staff directories, college-of-science advising pages, career center health tracks, " +
      "and relevant LinkedIn search pages",
    student_org:
      "student-organization directories, pre-health / pre-med / pre-nursing / allied-health club pages, " +
      "student affairs org listings, and the clubs' own websites / Instagram / Discord pages",
    dept_head:
      "department home pages and faculty/staff directories for biology, chemistry, psychology, " +
      "public health, kinesiology, nursing, and allied-health departments (chair / department-head pages)",
  };
  return [
    `List as MANY relevant, real web pages as possible to research ${subtype.replace("_", " ")} contacts`,
    `at ${where}.`,
    `Focus on: ${pageTypes[subtype]}.`,
    `Prefer official .edu pages. Include directory and listing pages even when they don't name a person —`,
    `they are valuable for manual research. Be comprehensive (aim for 8-15 links).`,
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look"}]}`,
    `"primary" = most likely to directly yield contacts; "worth_a_look" = broad pages an admin should mine by hand.`,
  ].join("\n");
}

export async function buildSourceMap(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
): Promise<SourceMapResult> {
  const cost = new CostTracker();
  const out = await perplexityJson(sourceMapPrompt(ctx, subtype), cost);
  const sources: SourceLink[] = [];
  const seen = new Set<string>();
  for (const raw of arr(out?.sources)) {
    const o = raw as Record<string, unknown>;
    const u = url(o.url);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    sources.push({ title: str(o.title) ?? u, url: u, tier: tier(o.tier) });
  }
  return { sources, cost: cost.cost };
}

// ---------------------------------------------------------------------------
// Stage 2 — extract candidates
// ---------------------------------------------------------------------------

function extractPrompt(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  sources?: SourceLink[],
): string {
  const where = [ctx.university, ctx.city, ctx.state].filter(Boolean).join(", ");
  const sourceHint =
    sources && sources.length
      ? `\nPrioritize these pages:\n${sources.map((s) => `- ${s.url}`).join("\n")}\n`
      : "";
  const depts = (ctx.departments?.length ? ctx.departments : DEFAULT_DEPARTMENTS).join(", ");

  if (subtype === "advisor") {
    return [
      `Find pre-health / health-professions ACADEMIC OR CAREER ADVISORS at ${where}.`,
      sourceHint,
      `For each advisor return: name, title, email, phone, profile_url (LinkedIn or staff page),`,
      `source_url (the page the info came from), confidence (high/medium/low), notes.`,
      `Only include real, named people or clearly-labeled advising contacts. Skip pure guesses.`,
      ``,
      `Return ONLY valid JSON shaped exactly:`,
      `{"candidates":[{"name":"...","title":"...","email":"...","phone":"...","profile_url":"...","source_url":"...","confidence":"...","notes":"..."}]}`,
    ].join("\n");
  }

  if (subtype === "dept_head") {
    return [
      `Find the DEPARTMENT CHAIR / HEAD for these departments at ${where}: ${depts}.`,
      sourceHint,
      `For each: department, name, title, email, phone, profile_url, source_url, confidence (high/medium/low), notes.`,
      `Only include real, named chairs/heads with a source. Skip departments you cannot verify.`,
      ``,
      `Return ONLY valid JSON shaped exactly:`,
      `{"candidates":[{"department":"...","name":"...","title":"...","email":"...","phone":"...","profile_url":"...","source_url":"...","confidence":"...","notes":"..."}]}`,
    ].join("\n");
  }

  // student_org — org-shaped, multi-contact, ALWAYS attempt the faculty advisor (R6).
  return [
    `Find pre-health / pre-med / pre-nursing / allied-health STUDENT ORGANIZATIONS at ${where}.`,
    sourceHint,
    `For each organization return: name (org name), org_email, website, directory_url, source_url,`,
    `confidence (high/medium/low), notes, socials (array of {platform, url} for Instagram/Discord/GroupMe/etc),`,
    `officers (array of {name, role, email, source_url} — e.g. President, Vice President, Recruitment Chair),`,
    `and faculty_advisor ({name, email, profile_url, source_url}).`,
    `ALWAYS attempt to find the faculty advisor for each org even when officers are found — the faculty`,
    `advisor is the most valuable long-term contact (year-to-year continuity).`,
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"candidates":[{"name":"...","org_email":"...","website":"...","directory_url":"...","source_url":"...","confidence":"...","notes":"...","socials":[{"platform":"...","url":"..."}],"officers":[{"name":"...","role":"...","email":"...","source_url":"..."}],"faculty_advisor":{"name":"...","email":"...","profile_url":"...","source_url":"..."}}]}`,
  ].join("\n");
}

function parseSocials(v: unknown): SocialLink[] {
  const out: SocialLink[] = [];
  for (const raw of arr(v)) {
    const o = raw as Record<string, unknown>;
    const u = url(o.url) ?? str(o.url);
    const platform = str(o.platform);
    if (u && platform) out.push({ platform, url: u });
  }
  return out;
}

function parseOfficers(v: unknown): OrgOfficer[] {
  const out: OrgOfficer[] = [];
  for (const raw of arr(v)) {
    const o = raw as Record<string, unknown>;
    const name = str(o.name);
    const email = str(o.email);
    if (!name && !email) continue;
    out.push({
      name,
      role: str(o.role),
      email,
      source_url: url(o.source_url),
    });
  }
  return out;
}

function parseFacultyAdvisor(v: unknown): FacultyAdvisor | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = str(o.name);
  const email = str(o.email);
  if (!name && !email) return null;
  return {
    name,
    email,
    profile_url: url(o.profile_url),
    source_url: url(o.source_url),
  };
}

export async function extractPartners(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  sources?: SourceLink[],
): Promise<ExtractResult> {
  const cost = new CostTracker();
  const out = await perplexityJson(extractPrompt(ctx, subtype, sources), cost);
  const candidates: PartnerCandidate[] = [];

  for (const raw of arr(out?.candidates)) {
    const o = raw as Record<string, unknown>;

    if (subtype === "student_org") {
      const name = str(o.name);
      const orgEmail = str(o.org_email);
      const officers = parseOfficers(o.officers);
      const advisor = parseFacultyAdvisor(o.faculty_advisor);
      // Need at least an org name to be useful.
      if (!name) continue;
      candidates.push({
        subtype,
        name,
        org_email: orgEmail,
        email: orgEmail, // convenience: primary email for the row
        website: url(o.website),
        directory_url: url(o.directory_url),
        source_url: url(o.source_url),
        confidence: confidence(o.confidence),
        notes: str(o.notes),
        socials: parseSocials(o.socials),
        officers,
        faculty_advisor: advisor,
      });
      continue;
    }

    // advisor / dept_head — person-shaped.
    const name = str(o.name);
    const email = str(o.email);
    if (!name && !email) continue;
    candidates.push({
      subtype,
      name,
      title: str(o.title),
      department: subtype === "dept_head" ? str(o.department) : null,
      email,
      phone: str(o.phone),
      profile_url: url(o.profile_url),
      source_url: url(o.source_url),
      confidence: confidence(o.confidence),
      notes: str(o.notes),
    });
  }

  return { candidates, cost: cost.cost };
}
