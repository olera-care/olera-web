/**
 * POST /api/admin/medjobs/research-workspace/generate
 *
 * Materialize verified OFFICES into prospects (the action layer). For each
 * selected office in the Site's workspace, create ONE student_outreach row:
 *   - tag advising_office → stakeholder_type "advisor" (the office)
 *   - tag student_org     → "student_org"
 *   - tag department      → "dept_head"
 * The office's general email is the cold-outreach target; phone-only offices are
 * created as a "call" lead (no email contact, so Smartlead never fans out).
 * Latched advisors (their own contact) ride along under the office, and are
 * optionally added as their own outreach contacts when the admin promotes them.
 *
 * Body: { campus_slug, subtype,
 *         offices: [{ office_id, advisor_ids?: string[] }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { onStageEnter } from "@/lib/student-outreach/state-machine";
import { PARTNER_SUBTYPES, type PartnerSubtype } from "@/lib/medjobs/partner-sourcing";
import {
  readWorkspace,
  writeWorkspace,
  type OfficeTag,
  type WorkspaceAdvisor,
  type WorkspaceOffice,
} from "@/lib/medjobs/research-workspace";

type DB = ReturnType<typeof getServiceClient>;

const TAG_TO_TYPE: Record<OfficeTag, "advisor" | "student_org" | "dept_head"> = {
  advising_office: "advisor",
  student_org: "student_org",
  department: "dept_head",
};

const TAG_LABEL: Record<OfficeTag, string> = {
  advising_office: "advising office",
  student_org: "student organization",
  department: "department",
};

/** A one-sentence provenance note describing how this prospect was generated. */
function provenanceNote(office: WorkspaceOffice, sources: { title: string; url: string }[]): string {
  const from = sources[0]?.title ? ` from ${sources[0].title}` : "";
  const contact = office.email
    ? `office email ${office.email}`
    : office.phone
      ? `office phone ${office.phone}`
      : "no direct contact";
  return `AI-sourced ${TAG_LABEL[office.tag]}${from}; ${contact} captured for outreach. Confirm by phone before sending.`;
}

interface Selection {
  office_id: string;
  advisor_ids?: string[];
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { campus_slug?: string; subtype?: string; offices?: Selection[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const campusSlug = body.campus_slug?.trim();
  const subtype = body.subtype?.trim() as PartnerSubtype | undefined;
  if (!campusSlug) return NextResponse.json({ error: "campus_slug required" }, { status: 400 });
  if (!subtype || !(PARTNER_SUBTYPES as string[]).includes(subtype)) {
    return NextResponse.json({ error: "Invalid subtype" }, { status: 400 });
  }
  const selections = Array.isArray(body.offices) ? body.offices : [];
  if (selections.length === 0) {
    return NextResponse.json({ error: "No offices selected" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("id, partner_research")
    .eq("slug", campusSlug)
    .maybeSingle();
  if (!campus) return NextResponse.json({ error: "Site not found" }, { status: 404 });
  const campusId = (campus as { id: string }).id;

  const ws = readWorkspace((campus as { partner_research?: unknown }).partner_research, subtype);
  const officeById = new Map(ws.offices.map((o) => [o.id, o]));
  const linkById = new Map(ws.links.map((l) => [l.id, l]));

  let created = 0;
  const ids: string[] = [];

  for (const sel of selections) {
    const office = officeById.get(sel.office_id);
    if (!office) continue;
    if (!office.email && !office.call_only && !office.phone) continue; // not reachable

    const advisors = ws.advisors.filter((a) => a.office_id === office.id);
    const sources = office.source_link_ids
      .map((lid) => linkById.get(lid))
      .filter(Boolean)
      .map((l) => ({ title: l!.title, url: l!.url }));

    const rowId = await createOfficeRow(db, { campusId, office, advisors, sources, userId: user.id });
    if (!rowId) continue;
    ids.push(rowId);
    created += 1;

    // Outreach contacts. The office GENERAL email lives in
    // research_data.general_contact and is the "general" lead at fan-out — we do
    // NOT also create a named contact for it (that would double-count it in the
    // per-recipient launch modal). Call-only offices (no email) get a phone
    // contact so they still surface in the Calls lane.
    const promoted = advisors.filter((a) => (sel.advisor_ids ?? []).includes(a.id) && (a.email || a.phone));
    let primaryDone = false;
    if (!office.email && office.phone) {
      await insertContact(db, rowId, { name: office.name, phone: office.phone, primary: true }, user.id);
      primaryDone = true;
    }
    for (const a of promoted) {
      await insertContact(db, rowId, { name: a.name, role: a.role, email: a.email, phone: a.phone, primary: !primaryDone }, user.id);
      primaryDone = true;
    }

    await db.from("student_outreach_touchpoints").insert({
      outreach_id: rowId,
      touchpoint_type: "contact_added",
      created_by: user.id,
      payload: { initial: true, source: "research_workspace", call_only: !office.email },
    });

    const effects = onStageEnter("prospect", { stakeholderType: TAG_TO_TYPE[office.tag] });
    if (effects.taskToQueue) {
      await db.from("student_outreach_tasks").insert({
        outreach_id: rowId,
        task_type: effects.taskToQueue.task_type,
        due_at: effects.taskToQueue.due_at.toISOString(),
        created_by: user.id,
      });
    }
  }

  if (created === 0) {
    return NextResponse.json({ error: "No reachable office was selected." }, { status: 400 });
  }

  const nextPr = writeWorkspace(
    (campus as { partner_research?: unknown }).partner_research,
    subtype,
    { generated_at: new Date().toISOString() },
  );
  await db
    .from("student_outreach_campuses")
    .update({ partner_research: nextPr, updated_at: new Date().toISOString() })
    .eq("id", campusId);

  return NextResponse.json({ ok: true, created, ids });
}

async function createOfficeRow(
  db: DB,
  args: {
    campusId: string;
    office: WorkspaceOffice;
    advisors: WorkspaceAdvisor[];
    sources: { title: string; url: string }[];
    userId: string;
  },
): Promise<string | null> {
  const { campusId, office, advisors, sources, userId } = args;
  const rowType = TAG_TO_TYPE[office.tag];
  const note = provenanceNote(office, sources);
  const { data, error } = await db
    .from("student_outreach")
    .insert({
      campus_id: campusId,
      stakeholder_type: rowType,
      kind: rowType,
      organization_name: office.name,
      notes: office.notes?.trim() || note,
      status: "prospect",
      research_data: {
        ai_sourced: true,
        from_research_workspace: true,
        office_tag: office.tag,
        channel: office.email ? "email" : "call",
        // research_data.notes is what the drawer's Research notes field reads.
        notes: note,
        // website stored where the drawer reads it (general_contact) + top-level.
        general_contact: { email: office.email ?? null, phone: office.phone ?? null, website: office.website ?? null },
        website: office.website ?? null,
        ask_for: office.ask_for ?? [],
        research_links: sources,
        office_members: advisors.map((a) => ({
          name: a.name ?? null,
          role: a.role ?? null,
          email: a.email ?? null,
          phone: a.phone ?? null,
          source_url: a.source_url ?? null,
        })),
      },
      created_by: userId,
      last_edited_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

async function insertContact(
  db: DB,
  rowId: string,
  c: { name?: string | null; role?: string | null; email?: string | null; phone?: string | null; primary: boolean },
  userId: string,
) {
  await db.from("student_outreach_contacts").insert({
    outreach_id: rowId,
    name: c.name ?? null,
    role: c.role ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    is_primary: c.primary,
    created_by: userId,
  });
}
