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
  /** Why this page is worth opening (one short phrase). */
  why?: string | null;
  /** What data the admin is likely to find there (e.g. "advisor names + emails"). */
  likely?: string | null;
}

export interface OrgOfficer {
  name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
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
      "official pre-health / pre-med / pre-nursing / health-professions advising office pages, " +
      "advising staff/team directories, and college-of-science advising pages. " +
      "ONLY flagship official university (.edu) web pages — do NOT include LinkedIn, " +
      "Instagram, Facebook, or other social-media pages",
    student_org:
      "student-organization directories, pre-health / pre-med / pre-nursing / allied-health club pages, " +
      "student affairs org listings, and the clubs' own websites / Instagram / Discord pages",
    dept_head:
      "department home pages and faculty/staff directories for biology, chemistry, psychology, " +
      "public health, kinesiology, nursing, and allied-health departments (chair / department-head pages)",
  };
  return [
    `Find the BEST real web pages to research ${subtype.replace("_", " ")} contacts at ${where}.`,
    `Focus on: ${pageTypes[subtype]}.`,
    `Prefer official .edu pages. Quality over quantity — do NOT pad the list.`,
    `Return at most 3-4 "primary" flagship pages (the single best places to find named`,
    `contacts), plus up to ~5 "secondary" / "worth_a_look" directory or listing pages an`,
    `admin should mine by hand. Aim for ~6-9 links total, not 15.`,
    `Skip duplicates, dead links, and generic homepages with no path to contacts.`,
    `For each link give a short "why" (why it's worth opening) and "likely"`,
    `(what data you expect to find there, e.g. "advisor names + office email").`,
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look","why":"...","likely":"..."}]}`,
    `"primary" = most likely to directly yield named contacts; "worth_a_look" = broad pages to mine by hand.`,
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
    sources.push({
      title: str(o.title) ?? u,
      url: u,
      tier: tier(o.tier),
      why: str(o.why),
      likely: str(o.likely),
    });
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
      `Find the pre-health / health-professions ADVISING OFFICE(S) at ${where}.`,
      sourceHint,
      `Treat each office as ONE organization with a roster of people. For each office return:`,
      `name (the office name, e.g. "Health Professions Advising Office"), org_email (general office email),`,
      `phone (general office phone), website, directory_url, source_url, confidence (high/medium/low), notes,`,
      `and officers: an array of the people at that office — {name, role (e.g. "Pre-Health Advisor",`,
      `"Director"), email, phone, source_url}. Include advisors listed by name even when their direct`,
      `email is not shown. Do NOT create a separate office per person — group people under their office.`,
      ``,
      `Return ONLY valid JSON shaped exactly:`,
      `{"candidates":[{"name":"...","org_email":"...","phone":"...","website":"...","directory_url":"...","source_url":"...","confidence":"...","notes":"...","officers":[{"name":"...","role":"...","email":"...","phone":"...","source_url":"..."}]}]}`,
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
      phone: str(o.phone),
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

/** Parse the model's `{candidates:[...]}` output into typed candidates. Shared
 *  by the search-based extract and the paste-a-URL extract. */
function parseCandidates(raw: Record<string, unknown> | null, subtype: PartnerSubtype): PartnerCandidate[] {
  const candidates: PartnerCandidate[] = [];
  for (const item of arr(raw?.candidates)) {
    const o = item as Record<string, unknown>;

    // Org-shaped: student orgs AND advising offices — one organization with a
    // roster of people (officers/members). dept_head is the only person-shaped
    // subtype (the chair).
    if (subtype === "student_org" || subtype === "advisor") {
      const officers = parseOfficers(o.officers);
      const orgEmail = str(o.org_email);
      const facultyAdvisor =
        subtype === "student_org" ? parseFacultyAdvisor(o.faculty_advisor) : null;
      // Don't drop a candidate just because the model omitted an office name —
      // if it found officers / a general email, keep it with a fallback name so
      // those contacts survive (the admin renames/assigns in the workspace).
      const name =
        str(o.name) ??
        (officers.length || orgEmail || facultyAdvisor
          ? subtype === "advisor"
            ? "Advising office"
            : "Student organization"
          : null);
      if (!name) continue;
      candidates.push({
        subtype,
        name,
        org_email: orgEmail,
        email: orgEmail,
        phone: str(o.phone),
        website: url(o.website),
        directory_url: url(o.directory_url),
        source_url: url(o.source_url),
        confidence: confidence(o.confidence),
        notes: str(o.notes),
        socials: parseSocials(o.socials),
        officers,
        faculty_advisor: facultyAdvisor,
      });
      continue;
    }

    // dept_head — person-shaped (the department chair).
    const name = str(o.name);
    const email = str(o.email);
    if (!name && !email) continue;
    candidates.push({
      subtype,
      name,
      title: str(o.title),
      department: str(o.department),
      email,
      phone: str(o.phone),
      profile_url: url(o.profile_url),
      source_url: url(o.source_url),
      confidence: confidence(o.confidence),
      notes: str(o.notes),
    });
  }
  return candidates;
}

export async function extractPartners(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  sources?: SourceLink[],
): Promise<ExtractResult> {
  const cost = new CostTracker();
  const out = await perplexityJson(extractPrompt(ctx, subtype, sources), cost);
  return { candidates: parseCandidates(out, subtype), cost: cost.cost };
}

/** Flat-people output schema — the model just lists EVERY person; WE build the
 *  offices from each person's "team". Far more robust than asking the model to
 *  nest people inside an "office" object, which broke on both single-person
 *  profile pages (no office name) and large directories. */
function peopleSchema(): string {
  return [
    `Return a FLAT list — one object per PERSON:`,
    `{"people":[`,
    `  { "name":"<full name>", "role":"<title/role>", "email":"<email or null>",`,
    `    "phone":"<phone or null>", "team":"<the section heading this person sits`,
    `    under, e.g. 'Career Advising' / 'Graduate & Professional School Advising',`,
    `    or null if there are no section headings>" }`,
    `]}`,
  ].join("\n");
}

function peopleRules(): string[] {
  return [
    `- Include EVERY person — even if there is only ONE on the page, and even if a`,
    `  directory has 40+. Return ALL of them; never summarize, sample, or stop early.`,
    `- It is NORMAL for many people to share the SAME email (a shared office alias).`,
    `  Include each person anyway — NEVER merge or drop people because emails match.`,
    `- Use ONLY what is literally in the content. NEVER invent, guess, or construct a`,
    `  name, email, or phone (no "first.last@domain"); if a field is absent use null.`,
    `- IGNORE image-caption lines like "Headshot of <name>" or "<name> headshot", and`,
    `  generic site nav / legal links (Title IX, Accessibility, Privacy).`,
  ];
}

interface FlatPerson {
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  team: string | null;
}

function parsePeople(raw: Record<string, unknown> | null): FlatPerson[] {
  const out: FlatPerson[] = [];
  for (const item of arr(raw?.people)) {
    const o = item as Record<string, unknown>;
    const name = str(o.name);
    const email = str(o.email);
    if (!name && !email) continue;
    out.push({ name, role: str(o.role), email, phone: str(o.phone), team: str(o.team) });
  }
  return out;
}

/** Build candidates from a flat people list. advisor/student_org group people
 *  by their "team" into office candidates (teamless people fall under one
 *  default office); dept_head returns one person-shaped candidate each. */
function peopleToCandidates(
  raw: Record<string, unknown> | null,
  subtype: PartnerSubtype,
  sourceUrl: string,
): PartnerCandidate[] {
  const people = parsePeople(raw);
  if (people.length === 0) return [];

  if (subtype === "dept_head") {
    return people.map((p) => ({
      subtype,
      name: p.name,
      title: p.role,
      department: p.team,
      email: p.email,
      phone: p.phone,
      source_url: sourceUrl,
      confidence: null,
    }));
  }

  const fallback = subtype === "advisor" ? "Advising office" : "Student organization";
  const byTeam = new Map<string, FlatPerson[]>();
  for (const p of people) {
    const key = p.team?.trim() || fallback;
    const list = byTeam.get(key) ?? [];
    list.push(p);
    byTeam.set(key, list);
  }
  const candidates: PartnerCandidate[] = [];
  for (const [team, members] of byTeam) {
    candidates.push({
      subtype,
      name: team,
      source_url: sourceUrl,
      confidence: null,
      officers: members.map((m) => ({
        name: m.name,
        role: m.role,
        email: m.email,
        phone: m.phone,
        source_url: sourceUrl,
      })),
    });
  }
  return candidates;
}

/** Extract contacts by having the AI BROWSE a page. Fallback for when the page
 *  can't be fetched server-side (see the source-partners route). */
export async function extractFromUrl(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  pageUrl: string,
): Promise<ExtractResult> {
  const cost = new CostTracker();
  const prompt = [
    `Carefully read ALL of the visible content on this web page: ${pageUrl}`,
    `(University: ${ctx.university}.)`,
    `Scan the ENTIRE page — header, body, sidebars, "Contact"/"Advising team"/`,
    `"Meet the team" sections, and the footer/contact block — and list every`,
    `${subtype.replace("_", " ")} person shown.`,
    ``,
    ...peopleRules(),
    `- If you cannot actually read the page content, return {"people":[]} rather`,
    `  than guessing. A made-up contact is far worse than none.`,
    ``,
    peopleSchema(),
    ``,
    `Return ONLY valid JSON: {"people":[ ... ]}`,
  ].join("\n");
  const out = await perplexityJson(prompt, cost, 4000);
  return { candidates: peopleToCandidates(out, subtype, pageUrl), cost: cost.cost };
}

/** Organize raw text the admin copy/pasted (a profile or a staff directory) into
 *  contacts. The PRIMARY capture path — must get EVERYONE, from a single person
 *  to a 40-person directory where many share one office email. */
export async function extractFromText(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  text: string,
  sourceUrl: string,
): Promise<ExtractResult> {
  const cost = new CostTracker();
  const prompt = [
    `Below is text copied from a ${ctx.university} web page — it could be ONE`,
    `person's profile or a whole staff/advisor directory with section headings.`,
    `List every ${subtype.replace("_", " ")} person it contains.`,
    ``,
    ...peopleRules(),
    ``,
    peopleSchema(),
    ``,
    `Return ONLY valid JSON: {"people":[ ... ]}`,
    ``,
    `--- PAGE TEXT ---`,
    text.slice(0, 18000),
  ].join("\n");
  const out = await perplexityJson(prompt, cost, 4000);
  return { candidates: peopleToCandidates(out, subtype, sourceUrl), cost: cost.cost };
}

/**
 * Map an accepted candidate to the POST body for the existing
 * /api/admin/student-outreach/stakeholders endpoint. Shared by the sourcing
 * widget and the audit's paste-a-URL tool so accept behavior stays identical.
 */
export function stakeholderBodyFromCandidate(
  campusSlug: string,
  c: PartnerCandidate,
): Record<string, unknown> {
  const sharedResearch: Record<string, unknown> = {
    ai_sourced: true,
    source_url: c.source_url ?? null,
    profile_url: c.profile_url ?? null,
    notes: c.notes ?? null,
  };
  if (c.subtype === "student_org") {
    const advisor = c.faculty_advisor;
    const firstOfficer = c.officers?.find((o) => o.name || o.email) ?? null;
    const primary = advisor?.name || advisor?.email ? advisor : firstOfficer;
    return {
      campus_slug: campusSlug,
      stakeholder_type: "student_org",
      organization_name: c.name,
      notes: c.notes ?? null,
      research_data: {
        ...sharedResearch,
        general_contact: { email: c.org_email ?? null },
        org_email: c.org_email ?? null,
        website: c.website ?? null,
        directory_url: c.directory_url ?? null,
        socials: c.socials ?? [],
        officers: c.officers ?? [],
        faculty_advisor: c.faculty_advisor ?? null,
      },
      initial_contact: primary
        ? {
            name: primary.name ?? null,
            email: primary.email ?? null,
            role: advisor && primary === advisor ? "faculty_advisor" : (firstOfficer?.role ?? null),
          }
        : null,
    };
  }

  // Advising office — org-shaped: one office row, general office contact for
  // outreach, advisors stored as office_members (NOT outreach contacts, so no
  // fan-out). Mirrors the student-org model.
  if (c.subtype === "advisor") {
    return {
      campus_slug: campusSlug,
      stakeholder_type: "advisor",
      organization_name: c.name,
      notes: c.notes ?? null,
      research_data: {
        ...sharedResearch,
        general_contact: { email: c.org_email ?? null, phone: c.phone ?? null },
        org_email: c.org_email ?? null,
        website: c.website ?? null,
        directory_url: c.directory_url ?? null,
        office_members: (c.officers ?? []).map((o) => ({
          name: o.name ?? null,
          role: o.role ?? null,
          email: o.email ?? null,
          source_url: o.source_url ?? null,
        })),
      },
      // Outreach targets the general office contact (email only). Members are
      // logged in research_data and promoted individually when appropriate.
      initial_contact: c.org_email ? { name: null, email: c.org_email, role: null } : null,
    };
  }

  // dept_head — person-shaped (the chair).
  return {
    campus_slug: campusSlug,
    stakeholder_type: c.subtype,
    department: c.subtype === "dept_head" ? (c.department ?? null) : null,
    organization_name:
      c.subtype === "dept_head" && c.department ? `${c.department} Department` : c.name,
    notes: c.notes ?? null,
    research_data: {
      ...sharedResearch,
      general_contact: { email: c.email ?? null, phone: c.phone ?? null },
    },
    initial_contact: {
      name: c.name ?? null,
      title: c.title ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
    },
  };
}
