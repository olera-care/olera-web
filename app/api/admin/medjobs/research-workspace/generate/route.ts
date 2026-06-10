/**
 * POST /api/admin/medjobs/research-workspace/generate
 *
 * Materialize verified research into prospects (the action layer). Reads the
 * Site's saved workspace[subtype] and the admin's outreach selection, then:
 *   - For each office bucket with a selected outreach contact → ONE office-shaped
 *     student_outreach row (all assigned people kept in research_data
 *     .office_members, so cold fan-out never blasts them); selected contacts
 *     become student_outreach_contacts (the cold targets).
 *   - For each selected INDIVIDUAL contact → one person-shaped row.
 * The full roster + links stay on the Site record as the source of truth.
 *
 * Body: { campus_slug, subtype, outreach_contact_ids: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { onStageEnter } from "@/lib/student-outreach/state-machine";
import { PARTNER_SUBTYPES, type PartnerSubtype } from "@/lib/medjobs/partner-sourcing";
import {
  readWorkspace,
  writeWorkspace,
  isGeneralContact,
  INDIVIDUAL,
  type WorkspaceContact,
} from "@/lib/medjobs/research-workspace";

type DB = ReturnType<typeof getServiceClient>;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { campus_slug?: string; subtype?: string; outreach_contact_ids?: string[] };
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
  const outreachIds = new Set(Array.isArray(body.outreach_contact_ids) ? body.outreach_contact_ids : []);
  if (outreachIds.size === 0) {
    return NextResponse.json({ error: "Pick at least one outreach contact." }, { status: 400 });
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
  const linkUrls = ws.links.map((l) => ({ title: l.title, url: l.url }));
  const officeById = new Map(ws.offices.map((o) => [o.id, o]));

  let created = 0;
  const ids: string[] = [];

  // Offices: group assigned contacts; create a row per office with a selection.
  const byOffice = new Map<string, WorkspaceContact[]>();
  const individuals: WorkspaceContact[] = [];
  for (const c of ws.contacts) {
    if (c.assignment === INDIVIDUAL) individuals.push(c);
    else if (c.assignment) {
      const list = byOffice.get(c.assignment) ?? [];
      list.push(c);
      byOffice.set(c.assignment, list);
    }
  }

  for (const [oid, members] of byOffice) {
    const selected = members.filter((m) => outreachIds.has(m.id));
    if (selected.length === 0) continue; // office not outreach-ready
    const general = members.find(isGeneralContact) ?? null;
    const people = members.filter((m) => !isGeneralContact(m));
    const office = officeById.get(oid);
    // An office can be recategorized (e.g. a pre-med student org found while
    // researching advisors) — generate it as its own kind.
    const rowType = office?.type ?? subtype;
    const id = await createRow(db, {
      campusId,
      rowType,
      userId: user.id,
      organizationName: office?.name ?? "Advising office",
      generalEmail: general?.email ?? null,
      generalPhone: general?.phone ?? null,
      members: people,
      linkUrls,
    });
    if (!id) continue;
    ids.push(id);
    created += 1;
    await attachContacts(db, id, selected, general, user.id);
    await queueAndLog(db, id, rowType, user.id);
  }

  // Individuals: one person-shaped row each.
  for (const c of individuals) {
    if (!outreachIds.has(c.id)) continue;
    const id = await createRow(db, {
      campusId,
      rowType: subtype,
      userId: user.id,
      organizationName: c.name?.trim() || c.email || "Individual",
      generalEmail: null,
      generalPhone: null,
      members: [],
      linkUrls,
    });
    if (!id) continue;
    ids.push(id);
    created += 1;
    await attachContacts(db, id, [c], null, user.id);
    await queueAndLog(db, id, subtype, user.id);
  }

  if (created === 0) {
    return NextResponse.json({ error: "Nothing outreach-ready was selected." }, { status: 400 });
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

async function createRow(
  db: DB,
  args: {
    campusId: string;
    rowType: PartnerSubtype;
    userId: string;
    organizationName: string;
    generalEmail: string | null;
    generalPhone: string | null;
    members: WorkspaceContact[];
    linkUrls: { title: string; url: string }[];
  },
): Promise<string | null> {
  const { campusId, rowType, userId, organizationName, generalEmail, generalPhone, members, linkUrls } = args;
  const { data, error } = await db
    .from("student_outreach")
    .insert({
      campus_id: campusId,
      stakeholder_type: rowType,
      kind: rowType,
      organization_name: organizationName,
      status: "prospect",
      research_data: {
        ai_sourced: true,
        from_research_workspace: true,
        general_contact: { email: generalEmail, phone: generalPhone },
        research_links: linkUrls,
        office_members: members.map((m) => ({
          name: m.name ?? null,
          role: m.role ?? null,
          email: m.email ?? null,
          phone: m.phone ?? null,
          notes: m.notes ?? null,
          source_url: m.source_url ?? null,
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

async function attachContacts(
  db: DB,
  rowId: string,
  selected: WorkspaceContact[],
  general: WorkspaceContact | null,
  userId: string,
) {
  // The office general contact (when selected) is primary; otherwise the first
  // selected person is primary so the row always has an outreach target.
  let primaryAssigned = false;
  for (const c of selected) {
    const isPrimary = general ? c.id === general.id : !primaryAssigned;
    if (isPrimary) primaryAssigned = true;
    await db.from("student_outreach_contacts").insert({
      outreach_id: rowId,
      name: c.name ?? null,
      role: c.role ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      is_primary: isPrimary,
      created_by: userId,
    });
  }
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: rowId,
    touchpoint_type: "contact_added",
    created_by: userId,
    payload: { initial: true, source: "research_workspace" },
  });
}

async function queueAndLog(db: DB, rowId: string, subtype: PartnerSubtype, userId: string) {
  const effects = onStageEnter("prospect", { stakeholderType: subtype });
  if (effects.taskToQueue) {
    await db.from("student_outreach_tasks").insert({
      outreach_id: rowId,
      task_type: effects.taskToQueue.task_type,
      due_at: effects.taskToQueue.due_at.toISOString(),
      created_by: userId,
    });
  }
}
