import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/favorites
 *
 * Replaces the caller's pinned sidebar pages. Body: { favorites: string[] }.
 * Each entry is an /admin href; the sidebar resolves labels from its own
 * nav config, so stale hrefs are harmless (they just don't render).
 */

const MAX_FAVORITES = 24;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const raw = body?.favorites;
    if (
      !Array.isArray(raw) ||
      !raw.every((f) => typeof f === "string" && f.startsWith("/admin") && f.length <= 200)
    ) {
      return NextResponse.json({ error: "favorites must be an array of /admin hrefs" }, { status: 400 });
    }
    const favorites = [...new Set(raw)].slice(0, MAX_FAVORITES);

    const db = getServiceClient();
    const { error } = await db
      .from("admin_users")
      .update({ favorites })
      .eq("id", adminUser.id);
    if (error) {
      console.error("Failed to save favorites:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("Favorites error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
