import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { seedSections } from "@/lib/medjobs/scripts-seed";

/**
 * The master scripts document, reading and writing.
 *
 * One row per ladder rung plus one per situation no rung covers. The task
 * screen links here rather than carrying its own copy, so this is the only
 * place any script or email exists and there is nothing to keep in step.
 *
 * Editing is open to any admin on purpose. The document is only worth having
 * if the person who just learned what to say can write it down while they
 * still remember it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ScriptRow {
  id: string;
  slug: string;
  kind: "rung" | "situation";
  section: string | null;
  rungKey: string | null;
  title: string;
  callScript: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  notes: string | null;
  position: number;
  updatedAt: string;
}

/** Long enough for the longest email we have, short enough to bound a write. */
const MAX = 20_000;

const clean = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s.slice(0, MAX);
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  const read = async () =>
    db.from("medjobs_scripts").select("*").order("position", { ascending: true });

  let { data, error } = await read();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Whatever the document is missing, insert. Never update: an edit made in
  // the UI is the better version by definition, and a read must not undo it.
  //
  // Done here rather than in the migration because the copy is thirty-odd
  // kilobytes, which the Supabase editor truncates on paste. It also means a
  // rung added next month gets its section with nothing to remember.
  const have = new Set((data ?? []).map((r) => r.slug as string));
  const missing = seedSections().filter((s) => !have.has(s.slug));
  if (missing.length > 0) {
    const { error: seedError } = await db.from("medjobs_scripts").insert(
      missing.map((s) => ({
        slug: s.slug,
        kind: s.kind,
        section: s.section,
        rung_key: s.rungKey,
        title: s.title,
        call_script: s.callScript,
        email_subject: s.emailSubject,
        email_body: s.emailBody,
        notes: s.notes,
        position: s.position,
      })),
    );
    if (seedError) return NextResponse.json({ error: seedError.message }, { status: 500 });
    ({ data, error } = await read());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: ScriptRow[] = (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    kind: r.kind,
    section: r.section,
    rungKey: r.rung_key,
    title: r.title,
    callScript: r.call_script,
    emailSubject: r.email_subject,
    emailBody: r.email_body,
    notes: r.notes,
    position: r.position,
    updatedAt: r.updated_at,
  }));
  return NextResponse.json({ rows });
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const slug = clean(body.slug);
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  // Only the four editable fields. Everything else — the slug, which rung it
  // belongs to, where it sits — is the document's structure, not its content,
  // and is not the edit box's to change.
  const patch: Record<string, string | null> = {};
  for (const [field, column] of [
    ["callScript", "call_script"],
    ["emailSubject", "email_subject"],
    ["emailBody", "email_body"],
    ["notes", "notes"],
  ] as const) {
    if (field in body) patch[column] = clean(body[field]);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  const { data, error } = await getServiceClient()
    .from("medjobs_scripts")
    .update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No such section" }, { status: 404 });

  return NextResponse.json({ ok: true, slug: data.slug });
}
