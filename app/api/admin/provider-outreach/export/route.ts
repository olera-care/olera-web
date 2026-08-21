import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/export
 *
 * Export provider outreach data as CSV.
 *
 * Query params:
 *   - state (required): State code
 *   - tab: UI tab (needs_email, ready, in_sequence, needs_call, re_engage, not_interested, claimed, archived, hidden)
 *   - assigned_to: Optional admin ID filter
 *   - search: Optional search filter
 *   - type: "providers" (default) or "city_assignments"
 *
 * For "providers" type:
 *   Returns CSV of providers with tab-appropriate columns
 *
 * For "city_assignments" type:
 *   Returns CSV of city assignment data with provider counts
 */

// UI tabs - same as frontend
type UITab = "needs_email" | "ready" | "hidden" | "in_sequence" | "needs_call" | "re_engage" | "not_interested" | "claimed" | "archived";

// Map UI tab to database stage
function getStageForTab(tab: UITab): string {
  if (tab === "needs_email" || tab === "ready") return "not_contacted";
  return tab;
}

// Batch size for .in() queries
const IN_CLAUSE_BATCH_SIZE = 150;

interface ProviderRow {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  slug: string | null;
}

interface TrackingRow {
  id: string;
  provider_id: string;
  stage: string;
  city: string | null;
  state: string | null;
  stage_changed_at: string;
  notes: string | null;
  due_date: string | null;
  resend_count: number;
  no_answer_count: number;
  needs_call_reason: string | null;
  re_engage_entered_at: string | null;
  assigned_to: string | null;
  admin_hidden: boolean | null;
}

interface ExportProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  slug: string | null;
  stage: string;
  stage_changed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  // Tab-specific fields
  emails_sent?: number;
  due_date?: string | null;
  resend_count?: number;
  no_answer_count?: number;
  needs_call_reason?: string | null;
  re_engage_entered_at?: string | null;
  verification_state?: string | null;
  profile_completeness?: number;
  // Email fields
  email_verification_status?: string | null;
  is_email_overridden?: boolean;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const tab = (searchParams.get("tab") || "needs_email") as UITab;
    const assignedTo = searchParams.get("assigned_to");
    const unassignedOnly = searchParams.get("unassigned") === "true";
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const exportType = searchParams.get("type") || "providers";

    if (!state) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Handle city assignments export
    if (exportType === "city_assignments") {
      return await exportCityAssignments(db, state, adminUser.id);
    }

    // Handle provider export
    const providers = await getProvidersForExport(db, state, tab, assignedTo, unassignedOnly, search);

    // Build CSV based on tab
    const csv = buildProviderCsv(providers, tab);
    const filename = `olera-provider-outreach-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "export_provider_outreach",
      targetType: "provider_outreach",
      targetId: "bulk_export",
      details: {
        filters: { state, tab, assignedTo, unassignedOnly, search },
        row_count: providers.length,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Count": String(providers.length),
      },
    });
  } catch (err) {
    console.error("[provider-outreach/export] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

async function getProvidersForExport(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  tab: UITab,
  assignedTo: string | null,
  unassignedOnly: boolean,
  search: string
): Promise<ExportProvider[]> {
  const stage = getStageForTab(tab);

  // Get admin name lookup for assigned_to
  const { data: admins } = await db
    .from("admin_users")
    .select("id, email, display_name");

  const adminNameMap = new Map<string, string>();
  for (const admin of admins || []) {
    adminNameMap.set(admin.id, admin.display_name || admin.email.split("@")[0]);
  }

  // Handle not_contacted (needs_email / ready tabs)
  if (stage === "not_contacted") {
    return await getNotContactedProvidersForExport(db, state, tab, assignedTo, unassignedOnly, search, adminNameMap);
  }

  // Handle claimed tab
  if (tab === "claimed") {
    return await getClaimedProvidersForExport(db, state, search, adminNameMap);
  }

  // Handle hidden tab
  if (tab === "hidden") {
    return await getHiddenProvidersForExport(db, state, search, adminNameMap);
  }

  // Handle archived tab
  if (tab === "archived") {
    return await getArchivedProvidersForExport(db, state, search, adminNameMap);
  }

  // Handle other stages (in_sequence, needs_call, re_engage, not_interested)
  let trackingQuery = db
    .from("provider_outreach_tracking")
    .select("*")
    .eq("state", state)
    .eq("stage", stage)
    .or("admin_hidden.is.null,admin_hidden.eq.false");

  if (assignedTo) {
    trackingQuery = trackingQuery.eq("assigned_to", assignedTo);
  } else if (unassignedOnly) {
    trackingQuery = trackingQuery.is("assigned_to", null);
  }

  const { data: trackingRows, error: trackingError } = await trackingQuery;

  if (trackingError) {
    console.error("[export] Tracking query error:", trackingError);
    throw new Error("Failed to fetch tracking data");
  }

  if (!trackingRows || trackingRows.length === 0) {
    return [];
  }

  // Get provider details
  const providerIds = trackingRows.map((t) => t.provider_id);
  const providers = await batchedProviderQuery(db, providerIds);

  // Apply search filter
  let filteredProviders = providers;
  if (search) {
    filteredProviders = providers.filter((p) =>
      p.provider_name?.toLowerCase().includes(search)
    );
  }

  const providerMap = new Map(filteredProviders.map((p) => [p.provider_id, p]));

  // Exclude claimed providers
  const claimedIds = await getClaimedProviderIds(db, providerIds);

  // For in_sequence: get emails sent counts
  let emailsSentMap = new Map<string, number>();
  if (tab === "in_sequence") {
    const stageChangedMap = new Map<string, string>();
    for (const t of trackingRows as TrackingRow[]) {
      if (t.stage_changed_at) {
        stageChangedMap.set(t.provider_id, t.stage_changed_at);
      }
    }

    const { data: touchpoints } = await db
      .from("provider_outreach_touchpoints")
      .select("provider_id, created_at")
      .in("provider_id", providerIds)
      .eq("touchpoint_type", "email_sent");

    for (const tp of touchpoints || []) {
      const stageChangedAt = stageChangedMap.get(tp.provider_id);
      if (stageChangedAt && tp.created_at >= stageChangedAt) {
        const count = emailsSentMap.get(tp.provider_id) || 0;
        emailsSentMap.set(tp.provider_id, count + 1);
      }
    }
  }

  // Get email verification data
  const emails = filteredProviders
    .map((p) => p.email?.toLowerCase().trim())
    .filter((e): e is string => !!e);

  // Only query if there are emails to check
  let verificationMap = new Map<string, string>();
  let overrideSet = new Set<string>();

  if (emails.length > 0) {
    const [{ data: verifications }, { data: overrides }] = await Promise.all([
      db.from("email_verifications").select("email, status").in("email", emails),
      db.from("email_overrides").select("email").in("email", emails),
    ]);

    verificationMap = new Map(
      (verifications || []).map((v) => [v.email.toLowerCase(), v.status])
    );
    overrideSet = new Set(
      (overrides || []).map((o) => o.email.toLowerCase())
    );
  }

  // Build export records
  const exportProviders: ExportProvider[] = [];

  for (const t of trackingRows as TrackingRow[]) {
    const p = providerMap.get(t.provider_id);
    if (!p) continue;
    if (claimedIds.has(p.provider_id)) continue;

    const emailKey = p.email?.toLowerCase().trim();

    exportProviders.push({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      provider_category: p.provider_category,
      city: p.city,
      state: p.state,
      email: p.email,
      phone: p.phone,
      website: p.website,
      slug: p.slug,
      stage: t.stage,
      stage_changed_at: t.stage_changed_at,
      assigned_to: t.assigned_to ? adminNameMap.get(t.assigned_to) || t.assigned_to : null,
      notes: t.notes,
      // Tab-specific fields
      emails_sent: tab === "in_sequence" ? emailsSentMap.get(p.provider_id) || 0 : undefined,
      due_date: tab === "needs_call" ? t.due_date : undefined,
      resend_count: tab === "needs_call" ? t.resend_count : undefined,
      no_answer_count: tab === "needs_call" ? t.no_answer_count : undefined,
      needs_call_reason: tab === "needs_call" ? t.needs_call_reason : undefined,
      re_engage_entered_at: tab === "re_engage" ? t.re_engage_entered_at : undefined,
      // Email fields
      email_verification_status: emailKey ? verificationMap.get(emailKey) : null,
      is_email_overridden: emailKey ? overrideSet.has(emailKey) : false,
    });
  }

  return exportProviders.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

async function getNotContactedProvidersForExport(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  tab: UITab,
  assignedTo: string | null,
  unassignedOnly: boolean,
  search: string,
  adminNameMap: Map<string, string>
): Promise<ExportProvider[]> {
  // Get all claimed provider IDs
  const { data: allClaimedBps } = await db
    .from("business_profiles")
    .select("source_provider_id")
    .not("source_provider_id", "is", null)
    .not("account_id", "is", null);

  const claimedProviderIds = new Set(
    (allClaimedBps || []).map((bp) => bp.source_provider_id).filter(Boolean)
  );

  // Get tracked providers for this state
  const { data: trackedInState } = await db
    .from("provider_outreach_tracking")
    .select("provider_id, id, stage, stage_changed_at, notes, assigned_to, admin_hidden")
    .eq("state", state);

  // Use truthy checks to handle any DB type variations
  const hiddenProviderIds = new Set(
    (trackedInState || [])
      .filter((t) => t.admin_hidden)
      .map((t) => t.provider_id)
  );

  const nonNotContactedIds = new Set(
    (trackedInState || [])
      .filter((t) => t.stage !== "not_contacted" && !t.admin_hidden)
      .map((t) => t.provider_id)
  );

  const notContactedMap = new Map(
    (trackedInState || [])
      .filter((t) => t.stage === "not_contacted" && !t.admin_hidden)
      .map((t) => [t.provider_id, t])
  );

  // Get city owners for assignment inheritance
  const { data: cityOwners } = await db
    .from("provider_outreach_city_owners")
    .select("city, owner_id")
    .eq("state", state)
    .not("owner_id", "is", null);

  const cityOwnerMap = new Map<string, string>();
  for (const co of cityOwners || []) {
    if (co.city && co.owner_id) {
      cityOwnerMap.set(co.city, co.owner_id);
    }
  }

  // Query providers
  let providerQuery = db
    .from("olera-providers")
    .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false");

  const { data: providerRows, error: provError } = await providerQuery;

  if (provError) {
    console.error("[export] Provider query error:", provError);
    throw new Error("Failed to fetch providers");
  }

  // Filter providers
  let filteredProviders = (providerRows || []).filter((p: ProviderRow) => {
    if (claimedProviderIds.has(p.provider_id)) return false;
    if (hiddenProviderIds.has(p.provider_id)) return false;
    if (nonNotContactedIds.has(p.provider_id)) return false;

    // Filter by email presence based on tab
    const hasEmail = p.email && p.email.trim().length > 0;
    if (tab === "needs_email" && hasEmail) return false;
    if (tab === "ready" && !hasEmail) return false;

    // Apply search
    if (search && !p.provider_name?.toLowerCase().includes(search)) return false;

    return true;
  });

  // Apply assigned_to filter
  if (assignedTo) {
    filteredProviders = filteredProviders.filter((p: ProviderRow) => {
      const tracking = notContactedMap.get(p.provider_id);
      const effectiveAssignedTo = tracking?.assigned_to || (p.city ? cityOwnerMap.get(p.city) : null);
      return effectiveAssignedTo === assignedTo;
    });
  } else if (unassignedOnly) {
    filteredProviders = filteredProviders.filter((p: ProviderRow) => {
      const tracking = notContactedMap.get(p.provider_id);
      const effectiveAssignedTo = tracking?.assigned_to || (p.city ? cityOwnerMap.get(p.city) : null);
      return !effectiveAssignedTo;
    });
  }

  // Get email verification data
  const emails = filteredProviders
    .map((p: ProviderRow) => p.email?.toLowerCase().trim())
    .filter((e): e is string => !!e);

  // Only query if there are emails to check
  let verificationMap = new Map<string, string>();
  let overrideSet = new Set<string>();

  if (emails.length > 0) {
    const [{ data: verifications }, { data: overrides }] = await Promise.all([
      db.from("email_verifications").select("email, status").in("email", emails),
      db.from("email_overrides").select("email").in("email", emails),
    ]);

    verificationMap = new Map(
      (verifications || []).map((v) => [v.email.toLowerCase(), v.status])
    );
    overrideSet = new Set(
      (overrides || []).map((o) => o.email.toLowerCase())
    );
  }

  // Build export records
  return filteredProviders.map((p: ProviderRow): ExportProvider => {
    const tracking = notContactedMap.get(p.provider_id);
    const effectiveAssignedTo = tracking?.assigned_to || (p.city ? cityOwnerMap.get(p.city) : null);
    const emailKey = p.email?.toLowerCase().trim();

    return {
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      provider_category: p.provider_category,
      city: p.city,
      state: p.state,
      email: p.email,
      phone: p.phone,
      website: p.website,
      slug: p.slug,
      stage: "not_contacted",
      stage_changed_at: tracking?.stage_changed_at || null,
      assigned_to: effectiveAssignedTo ? adminNameMap.get(effectiveAssignedTo) || effectiveAssignedTo : null,
      notes: tracking?.notes || null,
      email_verification_status: emailKey ? verificationMap.get(emailKey) : null,
      is_email_overridden: emailKey ? overrideSet.has(emailKey) : false,
    };
  }).sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

async function getClaimedProvidersForExport(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  search: string,
  adminNameMap: Map<string, string>
): Promise<ExportProvider[]> {
  // Get claimed business profiles
  const { data: claimedBps, error } = await db
    .from("business_profiles")
    .select("source_provider_id, slug, display_name, email, phone, city, state, account_id, verification_state, profile_completeness")
    .eq("state", state)
    .not("source_provider_id", "is", null)
    .not("account_id", "is", null);

  if (error) {
    console.error("[export] Claimed query error:", error);
    throw new Error("Failed to fetch claimed providers");
  }

  // Get tracking data for these providers
  const providerIds = (claimedBps || []).map((bp) => bp.source_provider_id).filter(Boolean);
  const trackingMap = new Map<string, TrackingRow>();

  if (providerIds.length > 0) {
    for (let i = 0; i < providerIds.length; i += IN_CLAUSE_BATCH_SIZE) {
      const batch = providerIds.slice(i, i + IN_CLAUSE_BATCH_SIZE);
      const { data: trackingRows } = await db
        .from("provider_outreach_tracking")
        .select("*")
        .in("provider_id", batch);

      for (const t of (trackingRows || []) as TrackingRow[]) {
        trackingMap.set(t.provider_id, t);
      }
    }
  }

  // Get original provider data for category
  const providerDataMap = new Map<string, ProviderRow>();
  if (providerIds.length > 0) {
    const providers = await batchedProviderQuery(db, providerIds);
    for (const p of providers) {
      providerDataMap.set(p.provider_id, p);
    }
  }

  // Get email verification data
  const emails = (claimedBps || [])
    .map((bp) => bp.email?.toLowerCase().trim())
    .filter((e): e is string => !!e);

  // Only query if there are emails to check
  let verificationMap = new Map<string, string>();
  let overrideSet = new Set<string>();

  if (emails.length > 0) {
    const [{ data: verifications }, { data: overrides }] = await Promise.all([
      db.from("email_verifications").select("email, status").in("email", emails),
      db.from("email_overrides").select("email").in("email", emails),
    ]);

    verificationMap = new Map(
      (verifications || []).map((v) => [v.email.toLowerCase(), v.status])
    );
    overrideSet = new Set(
      (overrides || []).map((o) => o.email.toLowerCase())
    );
  }

  // Build export records
  let exportProviders: ExportProvider[] = (claimedBps || []).map((bp): ExportProvider => {
    const tracking = trackingMap.get(bp.source_provider_id);
    const originalProvider = providerDataMap.get(bp.source_provider_id);
    const emailKey = bp.email?.toLowerCase().trim();

    return {
      provider_id: bp.source_provider_id,
      provider_name: bp.display_name || originalProvider?.provider_name || "",
      provider_category: originalProvider?.provider_category || null,
      city: bp.city,
      state: bp.state,
      email: bp.email,
      phone: bp.phone,
      website: originalProvider?.website || null,
      slug: bp.slug,
      stage: "claimed",
      stage_changed_at: tracking?.stage_changed_at || null,
      assigned_to: tracking?.assigned_to ? adminNameMap.get(tracking.assigned_to) || tracking.assigned_to : null,
      notes: tracking?.notes || null,
      verification_state: bp.verification_state,
      profile_completeness: bp.profile_completeness,
      email_verification_status: emailKey ? verificationMap.get(emailKey) : null,
      is_email_overridden: emailKey ? overrideSet.has(emailKey) : false,
    };
  });

  // Apply search filter
  if (search) {
    exportProviders = exportProviders.filter((p) =>
      p.provider_name?.toLowerCase().includes(search)
    );
  }

  return exportProviders.sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

async function getHiddenProvidersForExport(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  search: string,
  adminNameMap: Map<string, string>
): Promise<ExportProvider[]> {
  const { data: trackingRows, error } = await db
    .from("provider_outreach_tracking")
    .select("*")
    .eq("state", state)
    .eq("admin_hidden", true);

  if (error) {
    console.error("[export] Hidden query error:", error);
    throw new Error("Failed to fetch hidden providers");
  }

  if (!trackingRows || trackingRows.length === 0) {
    return [];
  }

  const providerIds = trackingRows.map((t) => t.provider_id);
  const providers = await batchedProviderQuery(db, providerIds);

  let filteredProviders = providers;
  if (search) {
    filteredProviders = providers.filter((p) =>
      p.provider_name?.toLowerCase().includes(search)
    );
  }

  const providerMap = new Map(filteredProviders.map((p) => [p.provider_id, p]));

  return (trackingRows as TrackingRow[])
    .map((t): ExportProvider | null => {
      const p = providerMap.get(t.provider_id);
      if (!p) return null;

      return {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        email: p.email,
        phone: p.phone,
        website: p.website,
        slug: p.slug,
        stage: "hidden",
        stage_changed_at: t.stage_changed_at,
        assigned_to: t.assigned_to ? adminNameMap.get(t.assigned_to) || t.assigned_to : null,
        notes: t.notes,
      };
    })
    .filter((p): p is ExportProvider => p !== null)
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

async function getArchivedProvidersForExport(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  search: string,
  adminNameMap: Map<string, string>
): Promise<ExportProvider[]> {
  // Get tracking-archived providers
  const { data: trackingRows, error } = await db
    .from("provider_outreach_tracking")
    .select("*")
    .eq("state", state)
    .eq("stage", "archived")
    .or("admin_hidden.is.null,admin_hidden.eq.false");

  if (error) {
    console.error("[export] Archived tracking query error:", error);
    throw new Error("Failed to fetch archived providers");
  }

  const trackingProviderIds = (trackingRows || []).map((t) => t.provider_id);
  const trackingMap = new Map(
    (trackingRows || []).map((t) => [t.provider_id, t as TrackingRow])
  );

  // Get system-archived providers (from business_profiles metadata)
  const { data: archivedBps } = await db
    .from("business_profiles")
    .select("source_provider_id")
    .eq("state", state)
    .not("source_provider_id", "is", null)
    .filter("metadata->>admin_archived", "eq", "true");

  const systemArchivedIds = (archivedBps || [])
    .map((bp) => bp.source_provider_id)
    .filter(Boolean);

  // Combine all archived provider IDs
  const allArchivedIds = [...new Set([...trackingProviderIds, ...systemArchivedIds])];

  if (allArchivedIds.length === 0) {
    return [];
  }

  const providers = await batchedProviderQuery(db, allArchivedIds);

  let filteredProviders = providers;
  if (search) {
    filteredProviders = providers.filter((p) =>
      p.provider_name?.toLowerCase().includes(search)
    );
  }

  return filteredProviders
    .map((p): ExportProvider => {
      const tracking = trackingMap.get(p.provider_id);

      return {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        provider_category: p.provider_category,
        city: p.city,
        state: p.state,
        email: p.email,
        phone: p.phone,
        website: p.website,
        slug: p.slug,
        stage: "archived",
        stage_changed_at: tracking?.stage_changed_at || null,
        assigned_to: tracking?.assigned_to ? adminNameMap.get(tracking.assigned_to) || tracking.assigned_to : null,
        notes: tracking?.notes || null,
      };
    })
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

async function exportCityAssignments(
  db: ReturnType<typeof getServiceClient>,
  state: string,
  adminUserId: string
): Promise<NextResponse> {
  // Get city owners
  const { data: cityOwners, error: ownersError } = await db
    .from("provider_outreach_city_owners")
    .select("city, owner_id, owner_name")
    .eq("state", state)
    .order("city", { ascending: true });

  if (ownersError) {
    console.error("[export] City owners query error:", ownersError);
    throw new Error("Failed to fetch city owners");
  }

  // Get provider counts by city
  const { data: providerCounts, error: countsError } = await db
    .from("olera-providers")
    .select("city, email")
    .eq("state", state)
    .or("deleted.is.null,deleted.eq.false");

  if (countsError) {
    console.error("[export] Provider counts query error:", countsError);
    throw new Error("Failed to fetch provider counts");
  }

  // Aggregate counts by city
  const cityStats = new Map<string, { total: number; has_email: number; needs_email: number }>();
  for (const p of providerCounts || []) {
    const city = p.city || "(No City)";
    const stats = cityStats.get(city) || { total: 0, has_email: 0, needs_email: 0 };
    stats.total++;
    if (p.email && p.email.trim()) {
      stats.has_email++;
    } else {
      stats.needs_email++;
    }
    cityStats.set(city, stats);
  }

  // Build CSV
  const headers = ["State", "City", "Owner Name", "Owner ID", "Total Providers", "Has Email", "Needs Email"];
  const lines = [headers.join(",")];

  // Include all cities with owners or providers
  const allCities = new Set([
    ...(cityOwners || []).map((co) => co.city),
    ...cityStats.keys(),
  ]);

  const ownerMap = new Map(
    (cityOwners || []).map((co) => [co.city, { owner_id: co.owner_id, owner_name: co.owner_name }])
  );

  for (const city of [...allCities].sort()) {
    const owner = ownerMap.get(city);
    const stats = cityStats.get(city) || { total: 0, has_email: 0, needs_email: 0 };

    lines.push([
      csvEscape(state),
      csvEscape(city),
      csvEscape(owner?.owner_name),
      csvEscape(owner?.owner_id),
      String(stats.total),
      String(stats.has_email),
      String(stats.needs_email),
    ].join(","));
  }

  const csv = lines.join("\n");
  const filename = `olera-city-assignments-${state}-${new Date().toISOString().slice(0, 10)}.csv`;

  await logAuditAction({
    adminUserId,
    action: "export_city_assignments",
    targetType: "city_assignments",
    targetId: state,
    details: {
      state,
      city_count: allCities.size,
    },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Export-Count": String(allCities.size),
    },
  });
}

function buildProviderCsv(providers: ExportProvider[], tab: UITab): string {
  // Common columns
  const commonHeaders = [
    "Provider ID",
    "Provider Name",
    "Category",
    "City",
    "State",
    "Email",
    "Phone",
    "Website",
    "Slug",
    "Stage",
    "Stage Changed At",
    "Assigned To",
    "Notes",
  ];

  // Tab-specific columns
  let tabHeaders: string[] = [];
  if (tab === "in_sequence") {
    tabHeaders = ["Emails Sent"];
  } else if (tab === "needs_call") {
    tabHeaders = ["Due Date", "Resend Count", "No Answer Count", "Needs Call Reason"];
  } else if (tab === "re_engage") {
    tabHeaders = ["Re-engage Entered At"];
  } else if (tab === "claimed") {
    tabHeaders = ["Verification State", "Profile Completeness"];
  }

  // Email columns (for tabs that show email data)
  const emailHeaders = ["Email Verification Status", "Is Email Overridden"];

  const headers = [...commonHeaders, ...tabHeaders, ...emailHeaders];
  const lines = [headers.join(",")];

  for (const p of providers) {
    const commonValues = [
      csvEscape(p.provider_id),
      csvEscape(p.provider_name),
      csvEscape(p.provider_category),
      csvEscape(p.city),
      csvEscape(p.state),
      csvEscape(p.email),
      csvEscape(p.phone),
      csvEscape(p.website),
      csvEscape(p.slug),
      csvEscape(p.stage),
      p.stage_changed_at ? new Date(p.stage_changed_at).toISOString().slice(0, 10) : "",
      csvEscape(p.assigned_to),
      csvEscape(p.notes),
    ];

    let tabValues: string[] = [];
    if (tab === "in_sequence") {
      tabValues = [String(p.emails_sent ?? 0)];
    } else if (tab === "needs_call") {
      tabValues = [
        p.due_date || "",
        String(p.resend_count ?? 0),
        String(p.no_answer_count ?? 0),
        csvEscape(p.needs_call_reason),
      ];
    } else if (tab === "re_engage") {
      tabValues = [
        p.re_engage_entered_at || "",
      ];
    } else if (tab === "claimed") {
      tabValues = [
        csvEscape(p.verification_state),
        p.profile_completeness != null ? String(p.profile_completeness) : "",
      ];
    }

    const emailValues = [
      csvEscape(p.email_verification_status),
      p.is_email_overridden ? "Yes" : "No",
    ];

    lines.push([...commonValues, ...tabValues, ...emailValues].join(","));
  }

  return lines.join("\n");
}

async function batchedProviderQuery(
  db: ReturnType<typeof getServiceClient>,
  providerIds: string[]
): Promise<ProviderRow[]> {
  if (providerIds.length === 0) return [];

  const results: ProviderRow[] = [];
  for (let i = 0; i < providerIds.length; i += IN_CLAUSE_BATCH_SIZE) {
    const batch = providerIds.slice(i, i + IN_CLAUSE_BATCH_SIZE);
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, email, phone, website, slug")
      .in("provider_id", batch)
      .or("deleted.is.null,deleted.eq.false");

    if (error) {
      console.error("[export] Provider batch query error:", error);
      continue;
    }
    if (data) {
      results.push(...(data as ProviderRow[]));
    }
  }
  return results;
}

async function getClaimedProviderIds(
  db: ReturnType<typeof getServiceClient>,
  providerIds: string[]
): Promise<Set<string>> {
  if (providerIds.length === 0) return new Set();

  const claimedIds = new Set<string>();
  for (let i = 0; i < providerIds.length; i += IN_CLAUSE_BATCH_SIZE) {
    const batch = providerIds.slice(i, i + IN_CLAUSE_BATCH_SIZE);
    const { data } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .in("source_provider_id", batch)
      .not("account_id", "is", null);

    for (const bp of data || []) {
      if (bp.source_provider_id) {
        claimedIds.add(bp.source_provider_id);
      }
    }
  }
  return claimedIds;
}
