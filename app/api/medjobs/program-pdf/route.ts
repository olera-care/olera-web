import { NextRequest, NextResponse } from "next/server";
import { renderProgramPdf, programPdfFilename } from "@/lib/program-pdf/generate";
import { resolveProgramPdfConfig, type PdfAudience } from "@/lib/program-pdf/configs";

/**
 * GET /api/medjobs/program-pdf?university=<slug>
 *
 * Renders the Student Caregiver Program PDF for the given
 * university and streams it back as application/pdf. Browser-
 * previewable (paste URL into a tab) + fetchable by the email-
 * send module when attaching to outreach.
 *
 * A campus without its own config falls back to the generic, campus-
 * agnostic config for the audience (the "floor") — so the emailed
 * link for any campus always resolves and the flyer promise holds.
 * Returns 404 only if even the generic config is missing.
 *
 * No auth — this PDF is the same content recipients receive as
 * an email attachment, so it's safe to serve publicly. Keeps the
 * "preview URL" path simple (no admin session required).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const asked = url.searchParams.get("audience");
  const audience: PdfAudience =
    asked === "student" || asked === "advisor" ? asked : "provider";
  // Default to the generic config so a bare URL always renders something
  // campus-agnostic. Providers used to default to the Texas A&M brochure,
  // from when that was the only provider config there was — which meant a
  // link shared without a university told an agency in Utah about Texas A&M.
  const requestedSlug = url.searchParams.get("university") ?? "generic";

  // Resolve to the requested config or the generic floor for this audience.
  const config = resolveProgramPdfConfig(requestedSlug, audience);
  if (!config) {
    return NextResponse.json(
      { error: `No ${audience} program PDF for university: ${requestedSlug}` },
      { status: 404 },
    );
  }
  // Render the resolved config's slug (the campus slug when configured, else
  // "generic") so the buffer + filename match what actually rendered.
  const slug = config.slug;

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
