import { NextResponse } from "next/server";
import { getProgramCardVariantWeights } from "@/lib/analytics/program-card-variant-weights";

// Public read of the live program card flow weights (control vs three_tap).
// Non-sensitive; the client assignment in useProgramCardFlow needs it on
// every program page. Short CDN cache, same as the other variant routes.
export async function GET() {
  const record = await getProgramCardVariantWeights();
  return NextResponse.json(record, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}
