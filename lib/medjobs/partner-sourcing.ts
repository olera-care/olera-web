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
 *  doesn't scope explicitly. Broad on purpose — any undergraduate department
 *  that commonly serves pre-med / pre-nursing / pre-PA / pre-PT / pre-pharmacy
 *  / allied-health prerequisite coursework. */
const DEFAULT_DEPARTMENTS = [
  "biology",
  "chemistry",
  "biochemistry",
  "microbiology",
  "psychology",
  "neuroscience",
  "public health",
  "health sciences",
  "kinesiology / exercise science",
  "nutrition / dietetics",
  "biomedical sciences",
  "human development / family sciences",
  "nursing",
  "allied health",
  "physiology / anatomy",
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

/** Office-centric extraction (the MVP). The office is the prospect; advisors are
 *  the rare high-bar bonus (own email/phone); ask_for is personalization only. */
export type ExtractedOfficeTag = "advising_office" | "student_org" | "department";

export interface ExtractedAdvisor {
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
}

export interface ExtractedOffice {
  name: string;
  tag: ExtractedOfficeTag;
  email: string | null;
  phone: string | null;
  website: string | null;
  /** Social channels (Instagram / Discord / GroupMe …) — populated for student
   *  orgs; empty for advising offices / departments. */
  socials?: SocialLink[];
  ask_for: string[];
  advisors: ExtractedAdvisor[];
  source_url: string | null;
  // ── Department-head (person-shaped) fields ──────────────────────────────
  // For dept_head, the "office" IS a department and the prospect is ONE person
  // (the chair/head/dean). These carry that person; email/phone above are the
  // CHAIR's direct contact, and `name` is the department. Empty for other tags.
  /** The department chair/head/dean's full name. */
  person_name?: string | null;
  /** The chair's title/role as shown (e.g. "Department Chair", "Dean"). */
  person_title?: string | null;
}

export interface OfficeExtractResult {
  offices: ExtractedOffice[];
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
  if (subtype === "dept_head") {
    return deptHeadSourceMapPrompt(ctx, where);
  }
  if (subtype === "student_org") {
    return studentOrgSourceMapPrompt(ctx, where);
  }
  if (subtype === "advisor") {
    return [
      `Find the BEST official web pages to identify and CONTACT the advising`,
      `office(s) that serve health-profession students at ${where}.`,
      ``,
      `Prioritize, in this order:`,
      ` 1. Pre-health / health-professions advising office (landing or "Contact" page)`,
      ` 2. Pre-nursing / allied-health advising office`,
      ` 3. General career services / career center (contact page)`,
      ` 4. A college advising office that covers pre-health (e.g. College of Natural Sciences)`,
      ``,
      `For each office, prefer the page MOST LIKELY to show the office's GENERAL`,
      `EMAIL and PHONE — a "Contact", "Contact Us", "About", or office landing page`,
      `— NOT a long staff roster.`,
      ``,
      ...institutionConstraint(ctx),
      ``,
      `Quality over quantity: 4-7 links. For each give "why" (worth opening) and`,
      `"likely" (what data you expect, e.g. "office email + phone").`,
      ``,
      `Return ONLY valid JSON shaped exactly:`,
      `{"domain":"<this university's primary website domain, e.g. tamu.edu>",`,
      ` "sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look","why":"...","likely":"..."}]}`,
      `"primary" = most likely to show an office name + email + phone.`,
    ].join("\n");
  }
  // Unreachable: advisor / dept_head / student_org are all handled above.
  return advisorFallbackSourceMapPrompt(ctx, where);
}

/**
 * Student-organization source map (Stage 1). Goal: a COMPREHENSIVE list of
 * pages to reach pre-health CLUBS — and a representative's contact. Unlike
 * advisor/dept_head sourcing, the richest sources are often OFF the .edu domain
 * (the campus engagement platform, Instagram, Linktree), so we ASK for those
 * and the domain filter is relaxed for this subtype (see buildSourceMap).
 */
function studentOrgSourceMapPrompt(ctx: UniversityContext, where: string): string {
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  return [
    `Goal: a COMPREHENSIVE list of pages to reach PRE-HEALTH STUDENT ORGANIZATIONS`,
    `(student-run clubs) at ${where}, each with a way to contact a representative.`,
    ``,
    `Look for clubs serving pre-med, pre-nursing, pre-PA, pre-dental, pre-pharmacy,`,
    `pre-PT/OT, public-health, and allied-health students — e.g. a Pre-Med Society or`,
    `AMSA chapter, Pre-PA / Pre-Nursing / Pre-Dental clubs, HOSA, MAPS / SNMA or other`,
    `identity-based health orgs, a Public Health or Global/Community Health club.`,
    ``,
    `Strongly prefer, in order:`,
    ` 1. The university's STUDENT-ORG DIRECTORY / engagement platform listing (Engage /`,
    `    CampusGroups / Presence / Anthology — often <school>.campuslabs.com or a`,
    `    "getinvolved"/"orgs" subsite) where each club shows a contact email + officers`,
    ` 2. A club's own page, Linktree, or Instagram that shows a contact email or DM handle`,
    ` 3. A department or pre-health office page that lists affiliated student clubs`,
    ``,
    `Prefer pages that show a CONTACT — an org email, a named officer, a faculty advisor,`,
    `or a social handle (Instagram / Discord / GroupMe / Slack). AVOID dead/expired club`,
    `pages, generic news/events, and one-off flyers. If a directory listing exists,`,
    `include it — it is the single richest source.`,
    ``,
    `Every club MUST be a ${ctx.university}${loc ? ` (${loc})` : ""} student organization —`,
    `NOT another school's club, and NOT a different campus of the same system. The PAGE`,
    `itself may live on the university site OR on the club's own social / Linktree /`,
    `engagement-platform page — that is expected and welcome.`,
    ``,
    `Be comprehensive: 6-12 links across the different pre-health club types. For each,`,
    `"why" = which club it reveals, "likely" = e.g. "org email + Instagram".`,
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"domain":"<this university's primary website domain>",`,
    ` "sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look","why":"...","likely":"..."}]}`,
    `"primary" = a directory or club page that shows a contact email or social handle.`,
  ].join("\n");
}

function advisorFallbackSourceMapPrompt(ctx: UniversityContext, where: string): string {
  return [
    `Find the BEST real web pages to research partner contacts at ${where}.`,
    `Prefer official .edu pages. 4-7 links, quality over quantity.`,
    ``,
    ...institutionConstraint(ctx),
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"domain":"<this university's primary website domain>",`,
    ` "sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look","why":"...","likely":"..."}]}`,
  ].join("\n");
}

/**
 * Department-head source map (Stage 1). The goal is a COMPREHENSIVE set of pages
 * that each reveal a NAMED department chair/head (or dean) we can then extract —
 * not generic department landing pages (which tend to be dead ends with no
 * person). We point the model at the page types that actually list leadership.
 */
function deptHeadSourceMapPrompt(ctx: UniversityContext, where: string): string {
  const depts = (ctx.departments?.length ? ctx.departments : DEFAULT_DEPARTMENTS).join(", ");
  return [
    `Goal: build a COMPREHENSIVE list of the department CHAIRS / HEADS (and DEANS of`,
    `Nursing or Health Sciences colleges) at ${where} for the undergraduate departments`,
    `that serve pre-health students (pre-med, pre-nursing, pre-PA, pre-PT, pre-pharmacy,`,
    `allied health). Consider these departments — include every one that exists here:`,
    `${depts}.`,
    ``,
    `For EACH department, return the SINGLE page most likely to NAME the chair/head and`,
    `show their contact. Strongly prefer, in order:`,
    ` 1. The department's "People" / "Faculty & Staff" / "Directory" page`,
    ` 2. The department's "Leadership" / "Administration" / "About > Chair" page`,
    ` 3. The chair's individual faculty profile page (often .../people/<name>)`,
    ` 4. As a last resort, the department home page IF it shows the chair by name`,
    ``,
    `AVOID (do not return): news/announcement posts, event pages, course catalogs,`,
    `degree/program-overview pages, admissions pages, and any page that does not name a`,
    `specific person. Prefer canonical, stable .edu pages over deep ad-hoc URLs that`,
    `often 404. If unsure a page is live + names a person, leave it out.`,
    ``,
    ...institutionConstraint(ctx),
    ``,
    `Be comprehensive: aim for one strong link PER department that exists here`,
    `(roughly 8-15 links total). For each, "why" = which chair/department it reveals,`,
    `"likely" = e.g. "names the Biology chair + email".`,
    ``,
    `Return ONLY valid JSON shaped exactly:`,
    `{"domain":"<this university's primary website domain, e.g. ufl.edu>",`,
    ` "sources":[{"title":"...","url":"https://...","tier":"primary|secondary|worth_a_look","why":"...","likely":"..."}]}`,
    `"primary" = a page that clearly names the chair + shows their email.`,
  ].join("\n");
}

/** Hard same-institution guardrail — the model kept returning "comparable"
 *  pages from OTHER universities and other campuses of the same system. */
function institutionConstraint(ctx: UniversityContext): string[] {
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  return [
    `CRITICAL — every page MUST belong to ${ctx.university}${loc ? ` in ${loc}` : ""} ITSELF,`,
    `on its OWN official website only. Do NOT return pages from any OTHER`,
    `university. Do NOT return pages from a DIFFERENT campus or branch of the same`,
    `system (e.g. a "Kingsville", "Galveston", "Commerce", or "Corpus Christi"`,
    `campus is a DIFFERENT school — exclude it). If you are not certain a page`,
    `belongs to this EXACT institution, leave it out.`,
  ];
}

/** Does a URL's host belong to the given registrable domain (or a subdomain)? */
function hostInDomain(u: string, domain: string): boolean {
  try {
    const host = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    const d = domain.toLowerCase().replace(/^www\./, "");
    return host === d || host.endsWith(`.${d}`);
  } catch {
    return false;
  }
}

export async function buildSourceMap(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
): Promise<SourceMapResult> {
  const cost = new CostTracker();
  const out = await perplexityJson(sourceMapPrompt(ctx, subtype), cost);
  // Mechanical guardrail: the model returns the university's primary domain;
  // drop any link not on that domain (or a subdomain), so off-institution
  // pages physically can't surface even if the prompt is ignored.
  const domainRaw = str(out?.domain)?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") ?? null;
  const domain = domainRaw && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainRaw) ? domainRaw : null;
  const sources: SourceLink[] = [];
  const seen = new Set<string>();
  // Student orgs are frequently reachable only off the .edu domain (the campus
  // engagement platform, Instagram, Linktree), so the strict same-domain filter
  // would drop the richest sources. Keep the filter for advisor/dept_head only.
  const enforceDomain = subtype !== "student_org";
  for (const raw of arr(out?.sources)) {
    const o = raw as Record<string, unknown>;
    const u = url(o.url);
    if (!u || seen.has(u)) continue;
    if (enforceDomain && domain && !hostInDomain(u, domain)) continue; // off-institution — drop
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
      `Identify the most senior STUDENT-FACING leader for the undergraduate departments at`,
      `${where} that serve pre-health prerequisite coursework (pre-med, pre-nursing, pre-PA,`,
      `pre-PT, pre-pharmacy, and allied health). Reason about which of these departments actually`,
      `exist at this university, then find ONE leader each: the department CHAIR / HEAD, or the`,
      `DEAN for a college of Nursing or Health Sciences. Departments to consider: ${depts}.`,
      sourceHint,
      `Return ONE person per department (the chair/head/dean — not professors or staff).`,
      `For each: department, name, title (e.g. "Chair", "Department Head", "Dean", "Dr."),`,
      `email, phone, profile_url, source_url, confidence (high/medium/low), notes.`,
      `Only include real, named leaders with a source. Skip departments you cannot verify.`,
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

// ---------------------------------------------------------------------------
// Office-centric extraction (the MVP). Output is OFFICES, not a people roster.
// ---------------------------------------------------------------------------

function officeTag(v: unknown): ExtractedOfficeTag {
  const s = str(v)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "student_org" || s === "student_organization") return "student_org";
  if (s === "department" || s === "dept" || s === "dept_head") return "department";
  return "advising_office";
}

function parseAdvisors(v: unknown): ExtractedAdvisor[] {
  const out: ExtractedAdvisor[] = [];
  for (const raw of arr(v)) {
    const o = raw as Record<string, unknown>;
    const name = str(o.name);
    const email = str(o.email);
    const phone = str(o.phone);
    // High bar: a latched advisor must have their OWN reachable contact.
    if (!(email || phone)) continue;
    if (!name) continue;
    out.push({ name, role: str(o.role), email, phone });
  }
  return out;
}

function parseAskFor(v: unknown): string[] {
  const out: string[] = [];
  for (const raw of arr(v)) {
    const s = str(raw) ?? str((raw as Record<string, unknown>)?.name);
    if (s) out.push(s);
  }
  return out.slice(0, 3);
}

/** Parse the model's `{offices:[...]}` into typed offices. The office's email is
 *  the GENERAL office address; advisors are only those with their own contact. */
function parseOffices(raw: Record<string, unknown> | null, sourceUrl: string): ExtractedOffice[] {
  const out: ExtractedOffice[] = [];
  for (const item of arr(raw?.offices)) {
    const o = item as Record<string, unknown>;
    const name = str(o.name);
    if (!name) continue;
    out.push({
      name,
      tag: officeTag(o.tag ?? o.type),
      email: str(o.email),
      phone: str(o.phone),
      website: url(o.website),
      socials: parseSocials(o.socials),
      ask_for: parseAskFor(o.ask_for),
      advisors: parseAdvisors(o.advisors),
      source_url: url(o.source_url) ?? sourceUrl,
    });
  }
  return out;
}

function officeSchema(sourceUrl: string): string {
  return [
    `For EACH office return:`,
    ` - "name": the office name (e.g. "Health Professions Advising Office")`,
    ` - "tag": "advising_office" for ANY advising / career / academic-services /`,
    `   student-services office (this is the DEFAULT — use it unless clearly`,
    `   otherwise); "student_org" only for a student-run club; "department" ONLY`,
    `   for an actual academic department's own page (e.g. "Department of Biology")`,
    ` - "email": the office's GENERAL email (a shared office address, e.g.`,
    `   hpo@uni.edu) — NOT a single staffer's personal address; null if none shown`,
    ` - "phone": the office's general phone, or null`,
    ` - "website": the office URL if shown, or null`,
    ` - "advisors": ONLY people who have their OWN email or phone (distinct from`,
    `   the office) AND a name and role → [{ "name","role","email","phone" }].`,
    `   Return [] if nobody qualifies. NEVER include staff who only share the`,
    `   general office email.`,
    ` - "ask_for": up to 3 names clearly tied to this office and relevant to`,
    `   pre-health (e.g. "An-Janet Smith — Pre-Health Advisor") who DON'T have`,
    `   their own contact — for email personalization only. [] if none.`,
    ` - "socials": for a student organization, an array of {platform,url} for any`,
    `   Instagram / Discord / GroupMe / Slack / LinkedIn shown on the page; []`,
    `   for advising offices / departments.`,
    ` - "source_url": "${sourceUrl}"`,
  ].join("\n");
}

function officeRules(): string[] {
  return [
    `- The OFFICE is the target. Capture its general contact info first.`,
    `- Use ONLY what is literally present; NEVER invent or construct an email/phone`,
    `  (no "first.last@domain"); if a field is absent use null.`,
    `- Do NOT turn a staff roster into prospects — a person becomes an "advisor"`,
    `  ONLY with their own email/phone; otherwise at most an "ask_for" name.`,
    `- IGNORE generic site nav / legal links (Title IX, Accessibility, Privacy).`,
  ];
}

// ── Department-head (person-shaped) extraction ───────────────────────────
// For dept_head the "office" is a department and the prospect is ONE person:
// the chair / head / dean. We extract that person's name, title, and DIRECT
// contact — never an advising-staff roster or a generic inbox.

function deptHeadRules(): string[] {
  return [
    `- ONE person per department: the CHAIR / HEAD (or the DEAN of a Nursing /`,
    `  Health Sciences college). NOT advising staff, NOT professors who aren't the`,
    `  chair, NOT a roster.`,
    `- Identify the chair as the person whose title contains "Chair", "Head",`,
    `  "Department Head", or "Dean".`,
    `- Use ONLY what is literally present; NEVER invent or construct an email/phone`,
    `  (no "first.last@domain"); if a field is absent use null.`,
    `- Prefer the chair's OWN direct email. If only a shared department / advising`,
    `  inbox is shown (e.g. "bio-advising@..."), set email null — the admin will`,
    `  confirm the chair's address by phone.`,
    `- Skip a department if you cannot identify a NAMED chair/head/dean.`,
    `- IGNORE generic site nav / legal links (Title IX, Accessibility, Privacy).`,
  ];
}

function deptHeadSchema(sourceUrl: string): string {
  return [
    `For EACH department present, return the ONE leader:`,
    ` - "department": the department/college name (e.g. "Department of Biology")`,
    ` - "chair_name": the chair/head/dean's FULL name, or null if none is named`,
    ` - "chair_title": their title as shown (e.g. "Professor & Chair", "Department`,
    `   Head", "Dean"), or null`,
    ` - "email": the CHAIR'S OWN direct email — NOT a generic department/advising`,
    `   inbox; null if only a shared inbox is shown`,
    ` - "phone": the chair's or department office phone, or null`,
    ` - "source_url": "${sourceUrl}"`,
  ].join("\n");
}

/** Parse the model's `{departments:[...]}` into person-shaped ExtractedOffice
 *  records (name = department, person_* = the chair, email/phone = chair direct). */
function parseDeptHeads(raw: Record<string, unknown> | null, sourceUrl: string): ExtractedOffice[] {
  const out: ExtractedOffice[] = [];
  for (const item of arr(raw?.departments)) {
    const o = item as Record<string, unknown>;
    const department = str(o.department) ?? str(o.name);
    const personName = str(o.chair_name) ?? str(o.person_name);
    if (!department && !personName) continue;
    out.push({
      name: department ?? personName ?? "",
      tag: "department",
      email: str(o.email),
      phone: str(o.phone),
      website: url(o.website),
      socials: [],
      ask_for: [],
      advisors: [],
      source_url: url(o.source_url) ?? sourceUrl,
      person_name: personName,
      person_title: str(o.chair_title) ?? str(o.title),
    });
  }
  return out;
}

// ── Student-organization (club) extraction ───────────────────────────────
// Clubs are office-shaped (a parent with a roster) so they reuse the {offices}
// JSON shape + parseOffices, but the framing + emphasis differ: capture the
// club's contact + SOCIALS, and treat the faculty advisor / officers as the
// roster (advisors with their own contact; everyone else as ask_for).

function orgRules(): string[] {
  return [
    `- The student ORGANIZATION (club) is the target — capture a way to reach a rep.`,
    `- Clubs are often reachable ONLY via social, so ALWAYS capture social channels`,
    `  (Instagram / Discord / GroupMe / Slack / LinkedIn / Linktree) when shown.`,
    `- Use ONLY what is literally present; NEVER invent or construct an email/phone`,
    `  (no "first.last@domain"); if a field is absent use null.`,
    `- A person becomes an "advisor" ONLY with their own email/phone; otherwise at`,
    `  most an "ask_for" name. ALWAYS include the FACULTY ADVISOR when shown — it is`,
    `  the highest-value, year-to-year contact.`,
    `- IGNORE generic site nav / legal links (Title IX, Accessibility, Privacy).`,
  ];
}

function orgSchema(sourceUrl: string): string {
  return [
    `For EACH student organization return:`,
    ` - "name": the club name (e.g. "Pre-Medical Society", "AMSA Chapter")`,
    ` - "tag": "student_org"`,
    ` - "email": the club's contact email (a shared club address OR a named officer's`,
    `   email), or null if none is shown`,
    ` - "phone": a phone if shown, or null`,
    ` - "website": the club page / Linktree URL, or null`,
    ` - "socials": array of {platform,url} for any Instagram / Discord / GroupMe /`,
    `   Slack / LinkedIn / Linktree shown; [] if none`,
    ` - "advisors": the FACULTY ADVISOR + any officer (President, VP, Recruitment`,
    `   Chair) who has their OWN email/phone → [{ "name","role","email","phone" }]; []`,
    `   if nobody qualifies`,
    ` - "ask_for": up to 3 named officers/advisor WITHOUT their own contact, for`,
    `   personalization only; [] if none`,
    ` - "source_url": "${sourceUrl}"`,
  ].join("\n");
}

/** Extract OFFICES (or, for dept_head, department CHAIRS; for student_org,
 *  CLUBS) by having the AI browse a page. Fallback for when the page can't be
 *  fetched server-side. */
export async function extractFromUrl(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  pageUrl: string,
): Promise<OfficeExtractResult> {
  const cost = new CostTracker();
  if (subtype === "student_org") {
    const prompt = [
      `Read the web page at ${pageUrl} (University: ${ctx.university}).`,
      `Identify the pre-health STUDENT ORGANIZATION(s) (student-run clubs) on the page`,
      `and capture each club's contact + social channels.`,
      ``,
      ...orgRules(),
      `- If you cannot actually read the page, return {"offices":[]} — never guess.`,
      ``,
      orgSchema(pageUrl),
      ``,
      `If no student organization is present, return {"offices":[]}.`,
      `Return ONLY valid JSON: {"offices":[ ... ]}`,
    ].join("\n");
    const out = await perplexityJson(prompt, cost, 4000);
    return { offices: parseOffices(out, pageUrl), cost: cost.cost };
  }
  if (subtype === "dept_head") {
    const prompt = [
      `Read the web page at ${pageUrl} (University: ${ctx.university}).`,
      `Identify the academic DEPARTMENT(S) on this page and, for each, the`,
      `department CHAIR / HEAD (or DEAN) plus their contact info.`,
      ``,
      ...deptHeadRules(),
      `- If you cannot actually read the page, return {"departments":[]} — never guess.`,
      ``,
      deptHeadSchema(pageUrl),
      ``,
      `If no named department chair/head is present, return {"departments":[]}.`,
      `Return ONLY valid JSON: {"departments":[ ... ]}`,
    ].join("\n");
    const out = await perplexityJson(prompt, cost, 4000);
    return { offices: parseDeptHeads(out, pageUrl), cost: cost.cost };
  }
  const prompt = [
    `Read the web page at ${pageUrl} (University: ${ctx.university}).`,
    `Identify the advising OFFICE(s) relevant to health-profession students and`,
    `capture each office's CONTACT info.`,
    ``,
    ...officeRules(),
    `- If you cannot actually read the page, return {"offices":[]} — never guess.`,
    ``,
    officeSchema(pageUrl),
    ``,
    `If no relevant advising office is present, return {"offices":[]}.`,
    `Return ONLY valid JSON: {"offices":[ ... ]}`,
  ].join("\n");
  const out = await perplexityJson(prompt, cost, 4000);
  return { offices: parseOffices(out, pageUrl), cost: cost.cost };
}

/** Organize text the admin copy/pasted into office (or dept-head chair) records.
 *  The primary capture path when a page can't be fetched server-side. */
export async function extractFromText(
  ctx: UniversityContext,
  subtype: PartnerSubtype,
  text: string,
  sourceUrl: string,
): Promise<OfficeExtractResult> {
  const cost = new CostTracker();
  if (subtype === "student_org") {
    const prompt = [
      `Below is text copied from a ${ctx.university} web page. Identify the pre-health`,
      `STUDENT ORGANIZATION(s) (clubs) it describes and capture each club's contact +`,
      `social channels.`,
      ``,
      ...orgRules(),
      ``,
      orgSchema(sourceUrl || "the page"),
      ``,
      `If the text describes no student organization, return {"offices":[]}.`,
      `Return ONLY valid JSON: {"offices":[ ... ]}`,
      ``,
      `--- PAGE TEXT ---`,
      text.slice(0, 18000),
    ].join("\n");
    const out = await perplexityJson(prompt, cost, 4000);
    return { offices: parseOffices(out, sourceUrl), cost: cost.cost };
  }
  if (subtype === "dept_head") {
    const prompt = [
      `Below is text copied from a ${ctx.university} web page. Identify the academic`,
      `DEPARTMENT(S) it describes and, for each, the department CHAIR / HEAD (or DEAN).`,
      ``,
      ...deptHeadRules(),
      ``,
      deptHeadSchema(sourceUrl || "the page"),
      ``,
      `If the text names no department chair/head, return {"departments":[]}.`,
      `Return ONLY valid JSON: {"departments":[ ... ]}`,
      ``,
      `--- PAGE TEXT ---`,
      text.slice(0, 18000),
    ].join("\n");
    const out = await perplexityJson(prompt, cost, 4000);
    return { offices: parseDeptHeads(out, sourceUrl), cost: cost.cost };
  }
  const prompt = [
    `Below is text copied from a ${ctx.university} web page. Identify the advising`,
    `OFFICE(s) it describes and capture each office's CONTACT info.`,
    ``,
    ...officeRules(),
    ``,
    officeSchema(sourceUrl || "the page"),
    ``,
    `If the text describes no advising office, return {"offices":[]}.`,
    `Return ONLY valid JSON: {"offices":[ ... ]}`,
    ``,
    `--- PAGE TEXT ---`,
    text.slice(0, 18000),
  ].join("\n");
  const out = await perplexityJson(prompt, cost, 4000);
  return { offices: parseOffices(out, sourceUrl), cost: cost.cost };
}

export interface AdvisorExtractResult {
  advisors: ExtractedAdvisor[];
  cost: number;
}

/** Organize pasted text about ONE (or a few) advisor(s) into structured records
 *  to latch under an office. Lenient — name required, contact optional (the
 *  admin chose to add them) — but never invents. */
export async function extractAdvisorsFromText(
  ctx: UniversityContext,
  text: string,
): Promise<AdvisorExtractResult> {
  const cost = new CostTracker();
  const prompt = [
    `Below is text about advising staff at ${ctx.university}. Extract each PERSON`,
    `as a contact: name, role/title, email, phone.`,
    `Use ONLY what is literally present; NEVER invent or construct an email/phone`,
    `(no "first.last@domain"); if a field is absent use null. IGNORE caption lines`,
    `like "Headshot of <name>".`,
    `Return ONLY valid JSON: {"advisors":[{"name","role","email","phone"}]}`,
    ``,
    `--- TEXT ---`,
    text.slice(0, 8000),
  ].join("\n");
  const out = await perplexityJson(prompt, cost, 2000);
  const advisors: ExtractedAdvisor[] = [];
  for (const raw of arr(out?.advisors)) {
    const o = raw as Record<string, unknown>;
    const name = str(o.name);
    if (!name) continue;
    advisors.push({ name, role: str(o.role), email: str(o.email), phone: str(o.phone) });
  }
  return { advisors, cost: cost.cost };
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
