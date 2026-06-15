/**
 * Server-side: render a Program PDF buffer for a given university
 * config. Used by:
 *   - /api/medjobs/program-pdf?university=<slug>  (browser preview
 *     + email-send attachment fetch)
 *   - email-send.ts (direct call to skip the HTTP round-trip when
 *     attaching to outreach emails)
 *
 * Assets (headshots + QR) are loaded from /public and from the
 * qrcode package at render time, encoded as base64 data URIs so
 * @react-pdf/renderer can embed them inline without needing a
 * runtime network fetch.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import QRCode from "qrcode";
import React, { type ReactElement } from "react";
import { ProgramPdfTemplate, type ProgramPdfAssets } from "./Template";
import { getProgramPdfConfig, type PdfAudience, type ProgramPdfConfig } from "./configs";

/**
 * Read a file from /public as a base64 data URI. Returns undefined
 * if the file is missing — the Template renders a text-only
 * signature block when the photo URI is undefined, so the PDF
 * still generates if a headshot is missing.
 */
async function publicAssetDataUri(
  relativePath: string,
  mimeType: string,
): Promise<string | undefined> {
  try {
    const absPath = path.join(process.cwd(), "public", relativePath);
    const buf = await fs.readFile(absPath);
    return `data:${mimeType};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function loadAssets(config: ProgramPdfConfig): Promise<ProgramPdfAssets> {
  const [
    loganPhotoDataUri,
    graziePhotoDataUri,
    oleraLogoDataUri,
    qrDataUri,
  ] = await Promise.all([
    publicAssetDataUri("images/for-providers/team/logan.jpg", "image/jpeg"),
    publicAssetDataUri("images/for-providers/team/grazie.png", "image/png"),
    publicAssetDataUri("images/olera-logo.png", "image/png"),
    QRCode.toDataURL(config.ctaUrl, {
      margin: 1,
      width: 280,
      color: { dark: "#111827", light: "#FFFFFF" },
    }),
  ]);
  return { loganPhotoDataUri, graziePhotoDataUri, oleraLogoDataUri, qrDataUri };
}

/**
 * Render the Program PDF for a university slug. Returns the PDF
 * as a Buffer ready for attachment / HTTP response. Throws if the
 * slug isn't registered in configs/index.ts.
 */
export async function renderProgramPdf(
  universitySlug: string,
  audience: PdfAudience = "provider",
): Promise<Buffer> {
  const config = getProgramPdfConfig(universitySlug, audience);
  if (!config) {
    throw new Error(
      `No ${audience} Program PDF config for university slug: ${universitySlug}`,
    );
  }
  const assets = await loadAssets(config);
  // @react-pdf/renderer's renderToBuffer is typed against
  // ReactElement<DocumentProps>. Our template returns a Document
  // root, so the runtime is correct; the cast quiets the structural
  // mismatch between our wrapper's prop shape and DocumentProps.
  const element = React.createElement(ProgramPdfTemplate, {
    config,
    assets,
  }) as unknown as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);
  return buffer;
}

/** Suggested attachment filename for the given university + audience. */
export function programPdfFilename(
  universitySlug: string,
  audience: PdfAudience = "provider",
): string {
  const config = getProgramPdfConfig(universitySlug, audience);
  const suffix = audience === "student" ? "student-program" : "student-caregiver-program";
  if (!config) return `${suffix}.pdf`;
  return `${config.slug}-${suffix}.pdf`;
}
