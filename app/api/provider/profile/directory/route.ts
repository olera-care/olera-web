import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * Provider dashboard ↔ directory bridge (Chunk 4, Step 1).
 *
 * For a directory-linked, claimed provider, the PUBLIC page renders the
 * `olera-providers` row, but the dashboard historically read/wrote the thin
 * `business_profiles` account row — so the editor showed blanks and edits
 * never reached the public page. This route lets the dashboard read and write
 * the CORE display fields on the directory row (the single display record),
 * mirroring them onto `business_profiles` so the cached account row stays in
 * sync for the app-wide AuthProvider reads.
 *
 * Scope (Step 1): the clean 1:1 top-level fields only — name, description,
 * contact, address, category. Photos / pricing / editorial metadata are a
 * separate, careful pass (they need transforms or a public-page change).
 *
 * `olera-providers` has NO RLS and is service-role-only, so writes go through
 * the service client AFTER a manual ownership check: the authenticated user's
 * account must own the business_profile, and that profile must be linked to a
 * directory row (`source_provider_id`).
 */
export const runtime = "nodejs";

// business_profiles field → olera-providers column. zip handled separately
// (olera-providers.zipcode is numeric).
const FIELD_MAP: Record<string, string> = {
  display_name: "provider_name",
  description: "provider_description",
  category: "provider_category",
  phone: "phone",
  email: "email",
  website: "website",
  address: "address",
  city: "city",
  state: "state",
};
const BP_CORE_FIELDS = [
  "display_name",
  "description",
  "category",
  "phone",
  "email",
  "website",
  "address",
  "city",
  "state",
  "zip",
] as const;

/** Resolve + ownership-check. Returns the linked directory id or an error. */
async function authorize(profileId: string) {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 as const };

  const db = getServiceClient();
  const { data: bp } = await db
    .from("business_profiles")
    .select("id, account_id, source_provider_id")
    .eq("id", profileId)
    .maybeSingle();
  const profile = bp as
    | { id: string; account_id: string | null; source_provider_id: string | null }
    | null;
  if (!profile) return { error: "Profile not found", status: 404 as const };
  if (!profile.source_provider_id) {
    return { error: "Profile is not directory-linked", status: 400 as const };
  }
  if (!profile.account_id) return { error: "Not authorized", status: 403 as const };

  const { data: acc } = await db
    .from("accounts")
    .select("user_id")
    .eq("id", profile.account_id)
    .maybeSingle();
  const ownerUserId = (acc as { user_id: string | null } | null)?.user_id ?? null;
  if (ownerUserId !== user.id) return { error: "Not authorized", status: 403 as const };

  return { db, sourceProviderId: profile.source_provider_id };
}

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId")?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const auth = await authorize(profileId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { data: op } = await auth.db
    .from("olera-providers")
    .select(
      "provider_name, provider_description, provider_category, main_category, phone, email, website, address, city, state, zipcode, provider_images, provider_logo, google_rating",
    )
    .eq("provider_id", auth.sourceProviderId)
    .maybeSingle();
  const o = (op as Record<string, unknown> | null) ?? {};
  // Care services on the public page are derived from the directory category +
  // main_category. Mirror that so the portal shows the SAME services.
  const careTypes = [o.provider_category, o.main_category]
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .filter((v, i, arr) => arr.indexOf(v) === i);
  // Gallery photos: olera-providers stores them pipe-joined ("url1 | url2").
  // Parse to the array shape the dashboard gallery expects; lead with the logo.
  const galleryImages = (o.provider_images as string | null)
    ? (o.provider_images as string).split(" | ").map((s) => s.trim()).filter(Boolean)
    : [];
  const images = (o.provider_logo as string | null)
    ? [o.provider_logo as string, ...galleryImages]
    : galleryImages;
  // `overlay` is the business_profiles field shape the dashboard overlays onto
  // the profile object (core 1:1 fields). The rich display fields (images,
  // rating) are returned alongside for the dashboard data hook, which reads
  // them directly — olera-providers is service-role-only, so this server bridge
  // is the only way the browser can see them.
  return NextResponse.json({
    overlay: {
      display_name: o.provider_name ?? null,
      description: o.provider_description ?? null,
      category: o.provider_category ?? null,
      phone: o.phone ?? null,
      email: o.email ?? null,
      website: o.website ?? null,
      address: o.address ?? null,
      city: o.city ?? null,
      state: o.state ?? null,
      zip: o.zipcode != null ? String(o.zipcode) : null,
      // care_types is overlaid only when the provider hasn't set their own (see
      // useDirectoryProfileOverlay), so their edits aren't clobbered.
      care_types: careTypes.length > 0 ? careTypes : null,
    },
    images,
    rating: (o.google_rating as number | null) ?? null,
  });
}

export async function POST(request: NextRequest) {
  let body: { profileId?: string; fields?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const profileId = body.profileId?.trim();
  const fields = body.fields ?? {};
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const auth = await authorize(profileId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Build the directory patch (olera-providers columns) + a business_profiles
  // mirror patch (so the cached account row stays current for AuthProvider).
  const dirPatch: Record<string, unknown> = {};
  const bpMirror: Record<string, unknown> = {};
  for (const key of BP_CORE_FIELDS) {
    if (!(key in fields)) continue;
    const raw = fields[key];
    const value =
      typeof raw === "string" ? (raw.trim() === "" ? null : raw.trim()) : raw ?? null;
    if (key === "zip") {
      bpMirror.zip = value;
      // olera-providers.zipcode is numeric — only write a clean 5-digit value.
      if (typeof value === "string" && /^\d{5}$/.test(value)) {
        dirPatch.zipcode = Number(value);
      }
      continue;
    }
    bpMirror[key] = value;
    const col = FIELD_MAP[key];
    if (col) dirPatch[col] = value;
  }

  if (Object.keys(dirPatch).length > 0) {
    const { error: dirErr } = await auth.db
      .from("olera-providers")
      .update(dirPatch)
      .eq("provider_id", auth.sourceProviderId);
    if (dirErr) {
      return NextResponse.json({ error: dirErr.message }, { status: 500 });
    }
  }
  if (Object.keys(bpMirror).length > 0) {
    await auth.db.from("business_profiles").update(bpMirror).eq("id", profileId);
  }

  return NextResponse.json({ ok: true });
}
