import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  getProgramCardVariantWeights,
  saveProgramCardVariantWeights,
} from "@/lib/analytics/program-card-variant-weights";

/** GET /api/admin/analytics/program-card-variant-weights — current dial. */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json(await getProgramCardVariantWeights());
}

/**
 * POST /api/admin/analytics/program-card-variant-weights
 * Body: { weights: { control: number, three_tap: number } } summing to 100.
 * Bumps the version, which reshuffles returning visitors on their next visit.
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
  const weights = (body as { weights?: unknown } | null)?.weights;
  if (!weights || typeof weights !== "object") {
    return NextResponse.json({ error: "Body must include a weights object" }, { status: 400 });
  }
  const result = await saveProgramCardVariantWeights(weights as Record<string, unknown>, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.record);
}
