import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { getDeliveryStatus } from "@/lib/connections/delivery.server";

/**
 * GET /api/connections/delivery?connectionId=…
 *
 * Whether the family's request reached the agency (lib/connections/delivery.server.ts).
 * Only the family who sent it may ask; anyone else, including a guest with no
 * session yet, gets a 401 and the card keeps its neutral "Request saved".
 */
export async function GET(request: Request) {
  const connectionId = new URL(request.url).searchParams.get("connectionId");
  if (!connectionId) return NextResponse.json({ error: "connectionId is required" }, { status: 400 });

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = getServiceClient();
  const { data: account } = await db.from("accounts").select("id").eq("user_id", user.id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Not your request" }, { status: 403 });

  const { data: connection } = await db
    .from("connections")
    .select("id, from_profile_id, to_profile_id, type, metadata")
    .eq("id", connectionId)
    .maybeSingle();
  if (!connection || connection.type !== "inquiry") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: family } = await db
    .from("business_profiles")
    .select("id")
    .eq("id", connection.from_profile_id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!family) return NextResponse.json({ error: "Not your request" }, { status: 403 });

  try {
    const status = await getDeliveryStatus(db, connection);
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[connections/delivery] lookup failed", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
