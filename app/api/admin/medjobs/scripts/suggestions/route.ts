import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Process improvements raised against a step.
 *
 * Anyone with admin access can raise one and anyone with admin access can
 * resolve it. That is deliberate: a queue only one person can clear is a
 * queue, and a queue nobody clears teaches people not to raise things.
 *
 * Resolving asks for a reply. Accepting a suggestion silently is the same
 * to the person who raised it as ignoring it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 5_000;

const clean = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s.slice(0, MAX);
};

export async function POST(req: Request) {
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

  const text = clean(body.body);
  if (!text) return NextResponse.json({ error: "Say what should change" }, { status: 400 });

  const kind = body.kind === "new_step" ? "new_step" : "improvement";
  // A new step belongs to no section yet, which is the whole point of it.
  const slug = kind === "new_step" ? null : clean(body.scriptSlug);
  if (kind === "improvement" && !slug) {
    return NextResponse.json({ error: "Missing the section" }, { status: 400 });
  }

  const { error } = await getServiceClient().from("medjobs_script_suggestions").insert({
    script_slug: slug,
    kind,
    body: text,
    raised_by: user.id,
    raised_email: user.email ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
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

  const id = clean(body.id);
  const status = body.status;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (status !== "accepted" && status !== "declined" && status !== "open") {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }

  const reopening = status === "open";
  const { data, error } = await getServiceClient()
    .from("medjobs_script_suggestions")
    .update({
      status,
      response: clean(body.response),
      resolved_by: reopening ? null : user.id,
      resolved_at: reopening ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No such suggestion" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
