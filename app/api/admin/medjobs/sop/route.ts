import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getAuthUser, getAdminUser } from "@/lib/admin";

/**
 * Serves the four MedJobs SOP documents to signed-in admins.
 *
 * `system` is the master implementation matrix; the other three are role views
 * of it, built from the same source by docs/medjobs/roles-src/build_roles.py.
 *
 * None of them is in `public/` on purpose: the matrix's thirty exhibits are
 * screenshots of this admin panel, so all four go out behind the same guard as
 * the rest of /api/admin rather than to anyone holding the URL. They ship with
 * the repo and are traced into the function by `outputFileTracingIncludes` in
 * next.config.ts; without those entries they exist in git and not in the bundle.
 */

export const runtime = "nodejs";

/** The whitelist is the security boundary: `doc` never reaches a path join. */
const DOCS: Record<string, { file: string; download: string }> = {
  system: {
    file: "docs/medjobs/MedJobs_2.0_Master_Implementation_Matrix.pdf",
    download: "MedJobs-2.0-Implementation-Matrix.pdf",
  },
  admin: {
    file: "docs/medjobs/MedJobs_Admin_Team_Operations.pdf",
    download: "MedJobs-Admin-Team-Operations.pdf",
  },
  sales: {
    file: "docs/medjobs/MedJobs_Sales_Lead_Operations.pdf",
    download: "MedJobs-Sales-Lead-Operations.pdf",
  },
  crm: {
    file: "docs/medjobs/MedJobs_User_Success_Manager_Operations.pdf",
    download: "MedJobs-User-Success-Manager-Operations.pdf",
  },
};

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // No doc named means the master, which is what the route served before.
  const doc = DOCS[request.nextUrl.searchParams.get("doc") ?? "system"];
  if (!doc) return NextResponse.json({ error: "Unknown document" }, { status: 400 });

  let file: Buffer;
  try {
    file = await readFile(path.join(process.cwd(), doc.file));
  } catch {
    return NextResponse.json(
      { error: "SOP not found in this deployment" },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.download}"`,
      // private: it is per-admin content, so no shared cache should hold it
      "Cache-Control": "private, max-age=300",
    },
  });
}
