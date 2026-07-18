import { NextResponse } from "next/server";
import { getManagedAdsVariantWeights } from "@/lib/analytics/managed-ads-variant-weights";

export async function GET() {
  const record = await getManagedAdsVariantWeights();
  return NextResponse.json(record, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}
