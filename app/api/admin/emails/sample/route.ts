import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import { getVariant, EMAIL_VARIANTS } from "@/lib/email-samples";
import { resolveFromAddress } from "@/lib/email";

/**
 * GET /api/admin/emails/sample
 *   - no `id`  → JSON list of every variant's metadata (for the gallery to enumerate)
 *   - `?id=X`  → JSON { id, subject, html, … } for one variant
 *   - `?id=X&raw=1` → the rendered HTML (text/html) for iframe src / open-in-tab
 *
 * Renders the LIVE templates from canned PII-free fixtures (lib/email-samples.ts),
 * so every variant is viewable in-product before any real send. Stable per-variant
 * URLs double as shareable links. Admin-gated. See plans/email-gallery.md.
 */
export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const raw = searchParams.get("raw") === "1";

  if (!id) {
    return NextResponse.json({
      variants: EMAIL_VARIANTS.map((v) => ({
        id: v.id, audience: v.audience, group: v.group, label: v.label,
        subject: v.subject, emailType: v.emailType, cron: v.cron ?? null,
        who: v.who ?? null, why: v.why ?? null,
        // The real From this type sends from (mirrors the live send path).
        from: resolveFromAddress(undefined, v.emailType),
      })),
    });
  }

  const v = getVariant(id);
  if (!v) return NextResponse.json({ error: `Unknown variant "${id}"` }, { status: 404 });

  let html: string;
  try {
    html = v.render();
  } catch (e) {
    return NextResponse.json({ error: `Render failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  if (raw) return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  return NextResponse.json({
    id: v.id, subject: v.subject, html, audience: v.audience, group: v.group,
    emailType: v.emailType, cron: v.cron ?? null,
  });
}
