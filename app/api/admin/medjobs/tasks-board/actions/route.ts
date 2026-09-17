import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { ContactField } from "@/lib/medjobs/ladders";

/**
 * The Tasks board, writing.
 *
 * The board itself is one GET next door. This is the other half: the small
 * set of changes an admin makes while reviewing records. It is deliberately
 * narrow — archive, delete, and edit the contact details — because those are
 * what a review pass needs. Completing and deferring tasks come later.
 *
 * Archive and delete are different promises, not two words for the same
 * thing:
 *
 *   archive  the record leaves the board and keeps everything. Reversible,
 *            and self-protecting: the catchment populate skips a provider
 *            that already has a record, archived or not.
 *   delete   the record is destroyed. The foreign keys cascade, so its
 *            tasks, contacts, touchpoints and approvals go with it. Because
 *            nothing is left to skip, the populate would recreate it on the
 *            next run — so a row goes into medjobs_excluded_records first,
 *            carrying a snapshot of what was destroyed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | { op: "archive_record"; recordId: string; reason?: string }
  | { op: "unarchive_record"; recordId: string }
  | { op: "delete_record"; recordId: string; reason?: string }
  | {
      op: "save_fields";
      recordId: string;
      fields: Partial<Record<ContactField, string>>;
      /** An admin correction. Absent means keep using the directory. */
      website?: string;
      second?: Partial<Record<ContactField, string>>;
    };

const ARCHIVED_STATUS = "archived";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("op" in body) || !body.recordId) {
    return NextResponse.json({ error: "Missing op or recordId" }, { status: 400 });
  }

  const db = getServiceClient();

  const { data: outreach } = await db
    .from("student_outreach")
    .select("id, campus_id, kind, organization_name, status, research_data")
    .eq("id", body.recordId)
    .maybeSingle();

  if (!outreach) {
    // A synthetic starter row ("new:campus:section") has no database record
    // behind it, so there is nothing to archive, delete or edit.
    return NextResponse.json(
      { error: "That record does not exist yet. Start it before editing it." },
      { status: 404 },
    );
  }

  switch (body.op) {
    // ── archive ───────────────────────────────────────────────────────────
    case "archive_record": {
      const { error } = await db
        .from("student_outreach")
        .update({
          status: ARCHIVED_STATUS,
          research_data: {
            ...((outreach.research_data ?? {}) as Record<string, unknown>),
            archived_reason: body.reason ?? null,
            archived_by: user.id,
            archived_at: new Date().toISOString(),
          },
        })
        .eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Nobody should be given work on a record that has left the board.
      await db
        .from("student_outreach_tasks")
        .update({ status: "cancelled" })
        .eq("outreach_id", outreach.id)
        .eq("status", "pending");

      return NextResponse.json({ ok: true, archived: outreach.organization_name });
    }

    // ── put it back ───────────────────────────────────────────────────────
    case "unarchive_record": {
      const research = { ...((outreach.research_data ?? {}) as Record<string, unknown>) };
      delete research.archived_reason;
      delete research.archived_by;
      delete research.archived_at;

      const { error } = await db
        .from("student_outreach")
        .update({ status: "researched", research_data: research })
        .eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Give it something to do again, but only if nothing is open already.
      const { count } = await db
        .from("student_outreach_tasks")
        .select("id", { count: "exact", head: true })
        .eq("outreach_id", outreach.id)
        .eq("status", "pending");
      if (!count) {
        await db.from("student_outreach_tasks").insert({
          outreach_id: outreach.id,
          task_type: "outreach_contact",
          status: "pending",
          due_at: new Date().toISOString().slice(0, 10),
          payload: { step: outreach.kind === "provider" ? 0 : 1, round: 0 },
        });
      }
      return NextResponse.json({ ok: true, restored: outreach.organization_name });
    }

    // ── delete ────────────────────────────────────────────────────────────
    case "delete_record": {
      // Everything about to be destroyed, kept so the decision can be
      // explained or undone by hand later.
      const [{ data: tasks }, { data: contacts }] = await Promise.all([
        db
          .from("student_outreach_tasks")
          .select("task_type, status, due_at, completed_at, payload, notes")
          .eq("outreach_id", outreach.id),
        db
          .from("student_outreach_contacts")
          .select("name, role, email, phone")
          .eq("outreach_id", outreach.id),
      ]);

      const research = (outreach.research_data ?? {}) as { olera_provider_id?: string };

      const { error: logError } = await db.from("medjobs_excluded_records").upsert(
        {
          campus_id: outreach.campus_id,
          olera_provider_id: research.olera_provider_id ?? null,
          organization_name: outreach.organization_name,
          kind: outreach.kind,
          reason: body.reason ?? null,
          snapshot: { record: outreach, tasks: tasks ?? [], contacts: contacts ?? [] },
          deleted_by: user.id,
        },
        { onConflict: "campus_id,olera_provider_id" },
      );
      // The exclusion row is what makes a delete stick. Without it the
      // populate brings the record back, so a failure here stops the delete
      // rather than letting it quietly undo itself.
      if (logError) {
        return NextResponse.json(
          { error: `Could not record the exclusion, so nothing was deleted: ${logError.message}` },
          { status: 500 },
        );
      }

      // student_outreach_touchpoints is append-only and its guard fires on a
      // cascade delete too, so those rows go first through a function that
      // is allowed to remove them.
      const { error: purgeError } = await db.rpc("medjobs_purge_touchpoints", {
        p_outreach_id: outreach.id,
      });
      if (purgeError && !/does not exist/i.test(purgeError.message)) {
        return NextResponse.json({ error: purgeError.message }, { status: 500 });
      }

      const { error } = await db.from("student_outreach").delete().eq("id", outreach.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ ok: true, deleted: outreach.organization_name });
    }

    // ── contact details ───────────────────────────────────────────────────
    case "save_fields": {
      const f = body.fields ?? {};
      const patch: Record<string, string> = {};
      if (typeof f.contact === "string") patch.name = f.contact.trim();
      if (typeof f.role === "string") patch.role = f.role.trim();
      if (typeof f.email === "string") patch.email = f.email.trim();
      if (typeof f.phone === "string") patch.phone = f.phone.trim();

      // ── the primary contact ───────────────────────────────────────────
      if (Object.keys(patch).length > 0) {
        const { data: primary } = await db
          .from("student_outreach_contacts")
          .select("id")
          .eq("outreach_id", outreach.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const { error } = primary
          ? await db.from("student_outreach_contacts").update(patch).eq("id", primary.id)
          : await db
              .from("student_outreach_contacts")
              .insert({ outreach_id: outreach.id, is_primary: true, ...patch });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // ── the second contact ────────────────────────────────────────────
      // Written only when something was actually typed, so opening the
      // disclosure and closing it again does not leave an empty person
      // behind for the next reader to wonder about.
      const s2 = body.second ?? {};
      const patch2: Record<string, string> = {};
      if (typeof s2.contact === "string") patch2.name = s2.contact.trim();
      if (typeof s2.role === "string") patch2.role = s2.role.trim();
      if (typeof s2.email === "string") patch2.email = s2.email.trim();
      if (typeof s2.phone === "string") patch2.phone = s2.phone.trim();
      const second_has_content = Object.values(patch2).some((v) => v !== "");

      if (second_has_content) {
        const { data: rows } = await db
          .from("student_outreach_contacts")
          .select("id")
          .eq("outreach_id", outreach.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true });

        const existingSecond = (rows ?? [])[1];
        const { error } = existingSecond
          ? await db.from("student_outreach_contacts").update(patch2).eq("id", existingSecond.id)
          : await db
              .from("student_outreach_contacts")
              .insert({ outreach_id: outreach.id, is_primary: false, name: "", ...patch2 });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // ── the website ───────────────────────────────────────────────────
      // Stored on the record, never written back to the directory. A
      // MedJobs admin correcting a link here should not silently edit a
      // row that the whole public site reads from.
      if (typeof body.website === "string") {
        const site = body.website.trim();
        const research = { ...((outreach.research_data ?? {}) as Record<string, unknown>) };
        if (site) research.website = site;
        else delete research.website;

        const { error } = await db
          .from("student_outreach")
          .update({ research_data: research })
          .eq("id", outreach.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown op" }, { status: 400 });
  }
}
