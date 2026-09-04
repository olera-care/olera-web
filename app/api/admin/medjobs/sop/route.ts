import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * Serves the MedJobs implementation matrix to signed-in admins.
 *
 * The PDF is not in `public/` on purpose: every one of its thirty exhibits is a
 * screenshot of this admin panel, so it goes out behind the same guard as the
 * rest of /api/admin rather than to anyone holding the URL. The file ships with
 * the repo and is traced into the function by `outputFileTracingIncludes` in
 * next.config.ts; without that entry it exists in git and not in the bundle.
 */

export const runtime = "nodejs";

const SOP_FILE = "docs/medjobs/MedJobs_2.0_Master_Implementation_Matrix.pdf";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let file: Buffer;
  try {
    file = await readFile(path.join(process.cwd(), SOP_FILE));
  } catch {
    return NextResponse.json(
      { error: "SOP not found in this deployment" },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="MedJobs-2.0-Implementation-Matrix.pdf"',
      // private: it is per-admin content, so no shared cache should hold it
      "Cache-Control": "private, max-age=300",
    },
  });
}
