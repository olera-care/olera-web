import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  getIntakeVariantWeights,
  saveIntakeVariantWeights,
} from "@/lib/analytics/variant-weights";

/**
 * GET /api/admin/analytics/variant-weights
 *
 * Returns the current intake_variant weights + version. Behind admin
 * auth even though /api/variant-weights/intake is public — this one
 * may grow to surface updated_at / updated_by metadata that the public
 * endpoint shouldn't leak.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const record = await getIntakeVariantWeights();
  return NextResponse.json(record);
}

/**
 * POST /api/admin/analytics/variant-weights
 *
 * Body: { weights: { availability: number, loss: number, empathic: number, outreach: number } }
 *
 * Validates sum=100 + every value an integer >= 0 + every key a known
 * variant. Writes the row and bumps version atomically. The version
 * bump invalidates returning sessions' arm assignments — see
 * assignIntakeVariantWeighted for the hash-namespacing detail.
 *
 * Returns the saved record on success so the admin UI can update its
 * local state without a separate refetch.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }
  const weights = (body as { weights?: unknown }).weights;
  if (!weights || typeof weights !== "object") {
    return NextResponse.json({ error: "Body must include a weights object" }, { status: 400 });
  }

  const result = await saveIntakeVariantWeights(weights as Record<string, unknown>, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.record);
}
