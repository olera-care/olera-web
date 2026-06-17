import { NextRequest, NextResponse } from "next/server";
import { renderProgramPdf, programPdfFilename } from "@/lib/program-pdf/generate";
import { getProgramPdfConfig, type PdfAudience } from "@/lib/program-pdf/configs";

/**
 * GET /api/medjobs/program-pdf?university=<slug>
 *
 * Renders the Student Caregiver Program PDF for the given
 * university and streams it back as application/pdf. Browser-
 * previewable (paste URL into a tab) + fetchable by the email-
 * send module when attaching to outreach.
 *
 * Defaults to ?university=texas-a-and-m when no slug is provided,
 * since Texas A&M is the only university currently configured.
 * Returns 404 when the slug isn't in lib/program-pdf/configs.
 *
 * No auth — this PDF is the same content recipients receive as
 * an email attachment, so it's safe to serve publicly. Keeps the
 * "preview URL" path simple (no admin session required).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("university") ?? "texas-a-and-m";
  const audience: PdfAudience =
    url.searchParams.get("audience") === "student" ? "student" : "provider";

  if (!getProgramPdfConfig(slug, audience)) {
    return NextResponse.json(
      { error: `No ${audience} program PDF for university: ${slug}` },
      { status: 404 },
    );
  }

  try {
    const buf = await renderProgramPdf(slug, audience);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${programPdfFilename(slug, audience)}"`,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF render failed";
    console.error("[program-pdf] render error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
