import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

function pixelResponse(): NextResponse {
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return pixelResponse();
  }

  try {
    const openedAt = new Date().toISOString();
    await getServiceClient()
      .from("email_log")
      .update({
        first_opened_at: openedAt,
        last_event_type: "opened",
        last_event_at: openedAt,
      })
      .eq("id", id)
      .is("first_opened_at", null);
  } catch (err) {
    console.error("[email/open] failed to stamp open:", err);
  }

  return pixelResponse();
}
