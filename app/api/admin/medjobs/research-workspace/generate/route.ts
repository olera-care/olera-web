/**
 * POST /api/admin/medjobs/research-workspace/generate
 *
 * Materialize verified research into prospects (the action layer). For each
 * selected office in the Site's workspace[subtype], create ONE student_outreach
 * row (office-shaped: all people kept in research_data.office_members, so cold
 * fan-out never blasts them) and attach the chosen outreach contacts:
 *   - the office general email (default), and/or
 *   - specific "promoted" members the admin chose to email directly.
 *
 * Only contacts attached as student_outreach_contacts get cold outreach. The
 * full office + roster + links + notes stay on the Site record as the permanent
 * source of truth. Reuses the same insert shape as the stakeholders route.
 *
 * Body:
 *   { campus_slug, subtype,
 *     selections: [{ office_id, include_office: bool, member_ids: string[] }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { onStageEnter } from "@/lib/student-outreach/state-machine";
import { PARTNER_SUBTYPES, type PartnerSubtype } from "@/lib/medjobs/partner-sourcing";
import {
  readWorkspace,
  writeWorkspace,
  type WorkspaceMember,
  type WorkspaceOffice,
} from "@/lib/medjobs/research-workspace";

interface Selection {
  office_id: string;
  include_office?: boolean;
  member_ids?: string[];
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: { campus_slug?: string; subtype?: string; selections?: Selection[] };
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
  const selections = Array.isArray(body.selections) ? body.selections : [];
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
  const linkUrls = ws.links.map((l) => ({ title: l.title, url: l.url }));

  let createdCount = 0;
  let contactCount = 0;
  const createdIds: string[] = [];

  for (const sel of selections) {
    const office = officeById.get(sel.office_id);
    if (!office) continue;

    // Resolve the outreach contacts: office general email + promoted members.
    const promoted = (office.members ?? []).filter(
      (m) => (sel.member_ids ?? []).includes(m.id) && (m.email || m.name),
    );
    const includeOffice = sel.include_office !== false && Boolean(office.general_email);
    if (!includeOffice && promoted.length === 0) continue; // nothing to email

    const row = await createOfficeRow(db, {
      campusId,
      subtype,
      office,
      linkUrls,
      userId: user.id,
    });
    if (!row) continue;
    createdIds.push(row);
    createdCount += 1;

    // Primary contact = the office general email (when chosen). Otherwise the
    // first promoted member becomes primary so the row has an outreach target.
    const contacts: Array<{ member?: WorkspaceMember; primary: boolean; officeEmail?: boolean }> = [];
    if (includeOffice) contacts.push({ primary: true, officeEmail: true });
    promoted.forEach((m, i) =>
      contacts.push({ member: m, primary: !includeOffice && i === 0 }),
    );

    for (const c of contacts) {
      const email = c.officeEmail ? office.general_email : c.member?.email;
      const name = c.officeEmail ? office.name : c.member?.name ?? null;
      if (!email && !name) continue;
      await db.from("student_outreach_contacts").insert({
        outreach_id: row,
        name: name,
        role: c.member?.role ?? null,
        email: email ?? null,
        phone: c.officeEmail ? office.general_phone ?? null : c.member?.phone ?? null,
        is_primary: c.primary,
        created_by: user.id,
      });
      contactCount += 1;
    }

    await db.from("student_outreach_touchpoints").insert({
      outreach_id: row,
      touchpoint_type: "contact_added",
      created_by: user.id,
      payload: { initial: true, source: "research_workspace" },
    });

    // Queue the Day-0 prospect task per state machine.
    const effects = onStageEnter("prospect", { stakeholderType: subtype });
    if (effects.taskToQueue) {
      await db.from("student_outreach_tasks").insert({
        outreach_id: row,
        task_type: effects.taskToQueue.task_type,
        due_at: effects.taskToQueue.due_at.toISOString(),
        created_by: user.id,
      });
    }
  }

  if (createdCount === 0) {
    return NextResponse.json(
      { error: "No outreach contact selected on any office — pick at least one." },
      { status: 400 },
    );
  }

  // Stamp generated_at so the workspace knows prospects were materialized.
  const nextPr = writeWorkspace(
    (campus as { partner_research?: unknown }).partner_research,
    subtype,
    { generated_at: new Date().toISOString() },
  );
  await db
    .from("student_outreach_campuses")
    .update({ partner_research: nextPr, updated_at: new Date().toISOString() })
    .eq("id", campusId);

  return NextResponse.json({ ok: true, created: createdCount, contacts: contactCount, ids: createdIds });
}

async function createOfficeRow(
  db: ReturnType<typeof getServiceClient>,
  args: {
    campusId: string;
    subtype: PartnerSubtype;
    office: WorkspaceOffice;
    linkUrls: { title: string; url: string }[];
    userId: string;
  },
): Promise<string | null> {
  const { campusId, subtype, office, linkUrls, userId } = args;
  const { data, error } = await db
    .from("student_outreach")
    .insert({
      campus_id: campusId,
      stakeholder_type: subtype,
      kind: subtype,
      organization_name: office.name,
      notes: office.notes ?? null,
      status: "prospect",
      research_data: {
        ai_sourced: true,
        from_research_workspace: true,
        general_contact: { email: office.general_email ?? null, phone: office.general_phone ?? null },
        website: office.website ?? null,
        research_links: linkUrls,
        office_members: (office.members ?? []).map((m) => ({
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
