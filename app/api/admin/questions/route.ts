import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { generateProviderSlug } from "@/lib/slugify";
import { US_STATES } from "@/lib/us-states";
import { notifyQuestionAskers } from "@/lib/notifications/question-answer-notifications.server";

/**
 * Humanize a provider_id that looks like a slug into a readable name.
 * Examples:
 *   "springfield-tn-0022" -> "Springfield, TN (0022)"
 *   "lake-wales-fl-0019" -> "Lake Wales, FL (0019)"
 *   "sW2jaHF" -> "Unknown Provider (sW2jaHF)"
 *   "sure-care-at-home" -> "Sure Care At Home"
 */
function humanizeProviderId(providerId: string): string | null {
  if (!providerId) return null;

  // Pattern 1: city-state-NNNN (auto-generated location-based slugs)
  // e.g., "springfield-tn-0022", "lake-wales-fl-0019"
  const locationPattern = /^([a-z-]+)-([a-z]{2})-(\d{4})$/i;
  const locationMatch = providerId.match(locationPattern);
  if (locationMatch) {
    const [, citySlug, stateCode, num] = locationMatch;
    const cityName = citySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const stateUpper = stateCode.toUpperCase();
    // Verify it's a valid US state
    if (US_STATES.some((s) => s.value === stateUpper)) {
      return `${cityName}, ${stateUpper} (${num})`;
    }
  }

  // Pattern 2: Regular slug with letters/numbers/hyphens (business name slugs)
  // e.g., "sure-care-at-home" -> "Sure Care At Home"
  // e.g., "care-4-seniors" -> "Care 4 Seniors"
  // Must have at least one hyphen (multiple words) and look like a readable slug
  const nameSlugPattern = /^[a-z0-9]+(-[a-z0-9]+)+$/i;
  if (nameSlugPattern.test(providerId)) {
    const words = providerId.split("-");
    // Require at least 2 words, each at least 1 char (allow single digits like "4")
    if (words.length >= 2 && words.every((w) => w.length >= 1)) {
      return words
        .map((word) => {
          // Keep numbers as-is, title-case letters
          if (/^\d+$/.test(word)) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    }
  }

  // Pattern 3: Random alphanumeric strings (legacy IDs)
  // e.g., "sW2jaHF", "z79aLLA"
  // Return a labeled fallback so it's clear this is an unknown provider
  return `Unknown Provider (${providerId})`;
}
/**
 * GET /api/admin/questions
 *
 * List all questions for admin moderation.
 * Query params: status, provider_id, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const providerId = searchParams.get("provider_id");
    const needsEmail = searchParams.get("needs_email") === "true";
    const deliveryIssues = searchParams.get("delivery_issues") === "true";
    const noContact = searchParams.get("no_contact") === "true";
    const notInterested = searchParams.get("not_interested") === "true";
    const unanswered = searchParams.get("unanswered") === "true";
    const countOnly = searchParams.get("count_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const dateFrom = searchParams.get("date_from"); // ISO date string (inclusive)
    const dateTo = searchParams.get("date_to"); // ISO date string (exclusive — next day)
    const search = searchParams.get("search")?.trim() || "";

    const db = getServiceClient();

    // Helper to fetch tab counts - called by each response path
    // Count unique providers per tab (not questions)
    // Note: We use .limit(50000) to override Supabase's default 1000 row limit
    // Now accepts optional date filters to match the data query
    async function getTabCounts(filterDateFrom?: string | null, filterDateTo?: string | null) {
      // Helper to apply date filters to a query
      const applyDateFilters = <T extends { gte: (col: string, val: string) => T; lt: (col: string, val: string) => T }>(query: T): T => {
        let q = query;
        if (filterDateFrom) q = q.gte("created_at", filterDateFrom);
        if (filterDateTo) q = q.lt("created_at", filterDateTo);
        return q;
      };

      const [pendingQuestions, needsEmailQuestions, deliveryIssuesQuestions, noContactQuestions, notInterestedQuestions, archivedQuestions, answeredQuestions, allQuestions] = await Promise.all([
        applyDateFilters(db.from("provider_questions").select("provider_id, metadata").is("canonical_question_id", null).eq("status", "pending")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).contains("metadata", { needs_provider_email: true }).not("metadata", "cs", '{"email_dead":true}').not("metadata", "cs", '{"provider_not_interested":true}').not("metadata", "cs", '{"provider_no_contact":true}').neq("status", "archived").neq("status", "rejected")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).contains("metadata", { email_dead: true }).not("metadata", "cs", '{"provider_not_interested":true}').not("metadata", "cs", '{"provider_no_contact":true}').neq("status", "archived").neq("status", "rejected")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).contains("metadata", { provider_no_contact: true }).neq("status", "archived").neq("status", "rejected")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).contains("metadata", { provider_not_interested: true }).neq("status", "archived").neq("status", "rejected")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).eq("status", "archived")).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null).in("status", ["answered", "approved"])).limit(50000),
        applyDateFilters(db.from("provider_questions").select("provider_id").is("canonical_question_id", null)).limit(50000),
      ]);

      // Helper to count unique providers
      const countUniqueProviders = (data: { provider_id: string }[] | null) =>
        new Set((data ?? []).map(q => q.provider_id).filter(Boolean)).size;

      // Filter pending questions to exclude those belonging to other tabs
      const truePendingProviders = new Set(
        (pendingQuestions.data ?? [])
          .filter((q) => {
            const meta = q.metadata as Record<string, unknown> | null;
            if (meta?.email_dead === true) return false;
            if (meta?.provider_not_interested === true) return false;
            if (meta?.provider_no_contact === true) return false;
            if (meta?.needs_provider_email === true) return false;
            return true;
          })
          .map(q => q.provider_id)
          .filter(Boolean)
      );

      // For needs_email, we must filter by provider status (exists, not archived, not claimed, no email)
      // This matches the display filtering logic
      let needsEmailCount = 0;
      const needsEmailProviderIds = [...new Set((needsEmailQuestions.data ?? []).map(q => q.provider_id).filter(Boolean))];

      if (needsEmailProviderIds.length > 0) {
        // Batch provider lookups to avoid URL length limits (50 IDs per batch)
        // Run bp and olera queries in parallel within each batch for speed
        const BATCH_SIZE = 50;
        const bpForNeedsEmail: { slug: string | null; email: string | null; is_active: boolean | null; source_provider_id: string | null; account_id: string | null }[] = [];
        const oleraForNeedsEmail: { slug: string | null; email: string | null; provider_id: string | null }[] = [];

        const batchPromises = [];
        for (let i = 0; i < needsEmailProviderIds.length; i += BATCH_SIZE) {
          const batch = needsEmailProviderIds.slice(i, i + BATCH_SIZE);
          const bpOrConditions = [
            `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
            `source_provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
          ];
          const oleraOrConditions = [
            `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
            `provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
          ];
          batchPromises.push(
            Promise.all([
              db.from("business_profiles").select("slug, email, is_active, source_provider_id, account_id").or(bpOrConditions.join(',')),
              db.from("olera-providers").select("slug, email, provider_id").or(oleraOrConditions.join(',')).not("deleted", "is", true)
            ])
          );
        }
        const batchResults = await Promise.all(batchPromises);
        for (const [bpResult, oleraResult] of batchResults) {
          if (bpResult.data) bpForNeedsEmail.push(...bpResult.data);
          if (oleraResult.data) oleraForNeedsEmail.push(...oleraResult.data);
        }

        // Build olera email lookup
        const oleraEmailMap = new Map<string, string>();
        for (const p of oleraForNeedsEmail) {
          if (p.provider_id && p.email) oleraEmailMap.set(p.provider_id, p.email);
        }

        // Reverse lookup for claim status (also batched)
        const oleraProviderIdsForNeedsEmail = oleraForNeedsEmail
          .map(p => p.provider_id)
          .filter((id): id is string => !!id);
        const linkedBpForNeedsEmail: { source_provider_id: string | null; email: string | null; account_id: string | null }[] = [];
        for (let i = 0; i < oleraProviderIdsForNeedsEmail.length; i += BATCH_SIZE) {
          const batch = oleraProviderIdsForNeedsEmail.slice(i, i + BATCH_SIZE);
          const { data } = await db
            .from("business_profiles")
            .select("source_provider_id, email, account_id")
            .in("source_provider_id", batch);
          if (data) linkedBpForNeedsEmail.push(...data);
        }
        const bpBySourceIdNeedsEmail = new Map<string, { email: string | null; account_id: string | null }>();
        for (const bp of linkedBpForNeedsEmail) {
          if (bp.source_provider_id) {
            bpBySourceIdNeedsEmail.set(bp.source_provider_id, { email: bp.email, account_id: bp.account_id });
          }
        }

        // Build provider status map
        const needsEmailStatus = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean; isClaimed: boolean }>();
        for (const id of needsEmailProviderIds) {
          needsEmailStatus.set(id, { exists: false, hasEmail: false, isArchived: false, isClaimed: false });
        }
        for (const p of bpForNeedsEmail) {
          const hasEmail = !!p.email || (p.source_provider_id ? !!oleraEmailMap.get(p.source_provider_id) : false);
          const isClaimed = !!p.account_id;
          const status = { exists: true, hasEmail, isArchived: p.is_active === false, isClaimed };
          if (p.slug) needsEmailStatus.set(p.slug, status);
          if (p.source_provider_id) needsEmailStatus.set(p.source_provider_id, status);
        }
        for (const p of oleraForNeedsEmail) {
          const linkedBp = p.provider_id ? bpBySourceIdNeedsEmail.get(p.provider_id) : null;
          const hasEmail = !!p.email || !!linkedBp?.email;
          const isClaimed = !!linkedBp?.account_id;
          if (p.slug && !needsEmailStatus.get(p.slug)?.exists) {
            needsEmailStatus.set(p.slug, { exists: true, hasEmail, isArchived: false, isClaimed });
          }
          if (p.provider_id && !needsEmailStatus.get(p.provider_id)?.exists) {
            needsEmailStatus.set(p.provider_id, { exists: true, hasEmail, isArchived: false, isClaimed });
          }
        }

        // Count valid providers
        for (const id of needsEmailProviderIds) {
          const status = needsEmailStatus.get(id);
          if (status?.exists && !status.isArchived && !status.isClaimed && !status.hasEmail) {
            needsEmailCount++;
          }
        }
      }

      return {
        pending: truePendingProviders.size,
        needs_email: needsEmailCount,
        delivery_issues: countUniqueProviders(deliveryIssuesQuestions.data),
        no_contact: countUniqueProviders(noContactQuestions.data),
        not_interested: countUniqueProviders(notInterestedQuestions.data),
        archived: countUniqueProviders(archivedQuestions.data),
        answered: countUniqueProviders(answeredQuestions.data),
        all: countUniqueProviders(allQuestions.data),
      };
    }

    // Helper for provider-based pagination
    // Groups questions by provider, paginates by provider (not question), returns questions for current page of providers
    function paginateByProvider<T extends { provider_id: string; created_at: string }>(
      allQuestions: T[],
      providerOffset: number,
      providerLimit: number
    ): { questions: T[]; providerCount: number } {
      // Group by provider, preserving order of most recent question per provider
      // Filter out questions with missing provider_id or created_at
      const providerLatest = new Map<string, string>();
      for (const q of allQuestions) {
        if (!q.provider_id || !q.created_at) continue;
        const existing = providerLatest.get(q.provider_id);
        if (!existing || q.created_at > existing) {
          providerLatest.set(q.provider_id, q.created_at);
        }
      }

      // Sort providers by most recent question (descending)
      const sortedProviders = Array.from(providerLatest.entries())
        .sort((a, b) => b[1].localeCompare(a[1]))
        .map(([providerId]) => providerId);

      const providerCount = sortedProviders.length;

      // Get providers for current page
      const pageProviders = new Set(sortedProviders.slice(providerOffset, providerOffset + providerLimit));

      // Filter questions to only include those from paginated providers
      const questions = allQuestions.filter(q => pageProviders.has(q.provider_id));

      return { questions, providerCount };
    }

    // If searching, find matching provider slugs first
    let searchSlugs: string[] | null = null;
    if (search) {
      const [{ data: bpMatches }, { data: iosMatches }] = await Promise.all([
        db.from("business_profiles").select("slug").in("type", ["organization", "caregiver"]).ilike("display_name", `%${search}%`).limit(200),
        db.from("olera-providers").select("slug").ilike("provider_name", `%${search}%`).not("deleted", "is", true).limit(200),
      ]);
      const slugs = new Set<string>();
      for (const p of bpMatches ?? []) if (p.slug) slugs.add(p.slug);
      for (const p of iosMatches ?? []) if (p.slug) slugs.add(p.slug);
      searchSlugs = Array.from(slugs);
    }

    // Fast path: return only the count (used by admin dashboard overview)
    if (countOnly) {
      // For needs_email, we must verify provider status (exists, not archived, no email)
      // Exclude email_dead questions - they belong in Delivery Issues tab
      if (needsEmail) {
        let countQuery = db
          .from("provider_questions")
          .select("provider_id, metadata")
          .is("canonical_question_id", null)
          .contains("metadata", { needs_provider_email: true })
          .not("metadata", "cs", '{"email_dead":true}')
          .not("metadata", "cs", '{"provider_not_interested":true}')
          .not("metadata", "cs", '{"provider_no_contact":true}')
          .neq("status", "archived")
          .neq("status", "rejected");
        if (searchSlugs) {
          if (searchSlugs.length === 0) return NextResponse.json({ count: 0 });
          countQuery = (countQuery as any).in("provider_id", searchSlugs);
        }
        if (dateFrom) countQuery = (countQuery as any).gte("created_at", dateFrom);
        if (dateTo) countQuery = (countQuery as any).lt("created_at", dateTo);

        const { data: questionsForCount, error: countFetchError } = await countQuery;
        if (countFetchError) {
          console.error("Admin questions count error:", countFetchError);
          return NextResponse.json({ error: "Failed to count questions" }, { status: 500 });
        }

        // Get unique provider IDs and check their status
        const providerIds = [...new Set((questionsForCount ?? []).map((q) => q.provider_id).filter(Boolean))];

        // Batch provider lookups to avoid URL length limits (50 IDs per batch)
        // Run bp and olera queries in parallel within each batch for speed
        const BATCH_SIZE = 50;
        const bpProviders: { slug: string | null; email: string | null; is_active: boolean | null; source_provider_id: string | null; account_id: string | null }[] = [];
        const oleraProviders: { slug: string | null; email: string | null; provider_id: string | null }[] = [];

        const batchPromises = [];
        for (let i = 0; i < providerIds.length; i += BATCH_SIZE) {
          const batch = providerIds.slice(i, i + BATCH_SIZE);
          const bpOrConditions = [
            `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
            `source_provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
          ];
          const oleraOrConditions = [
            `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
            `provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
          ];
          batchPromises.push(
            Promise.all([
              db.from("business_profiles").select("slug, email, is_active, source_provider_id, account_id").or(bpOrConditions.join(',')),
              db.from("olera-providers").select("slug, email, provider_id").or(oleraOrConditions.join(',')).not("deleted", "is", true)
            ])
          );
        }
        const batchResults = await Promise.all(batchPromises);
        for (const [bpResult, oleraResult] of batchResults) {
          if (bpResult.data) bpProviders.push(...bpResult.data);
          if (oleraResult.data) oleraProviders.push(...oleraResult.data);
        }

        // Build olera email lookup by provider_id for fallback
        const oleraEmailByProviderId = new Map<string, string>();
        for (const p of oleraProviders ?? []) {
          if (p.provider_id && p.email) oleraEmailByProviderId.set(p.provider_id, p.email);
        }

        // Reverse lookup: find business_profiles linked via source_provider_id for claim status (batched)
        const oleraProviderIdsToCheck = (oleraProviders ?? [])
          .map((p) => p.provider_id)
          .filter((id): id is string => !!id);
        const linkedBpForCount: { source_provider_id: string | null; email: string | null; account_id: string | null }[] = [];
        for (let i = 0; i < oleraProviderIdsToCheck.length; i += BATCH_SIZE) {
          const batch = oleraProviderIdsToCheck.slice(i, i + BATCH_SIZE);
          const { data } = await db
            .from("business_profiles")
            .select("source_provider_id, email, account_id")
            .in("source_provider_id", batch);
          if (data) linkedBpForCount.push(...data);
        }
        const bpBySourceIdForCount = new Map<string, { email: string | null; account_id: string | null }>();
        for (const bp of linkedBpForCount ?? []) {
          if (bp.source_provider_id) {
            bpBySourceIdForCount.set(bp.source_provider_id, { email: bp.email, account_id: bp.account_id });
          }
        }

        // Build provider status map with claimed status
        const providerStatus = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean; isClaimed: boolean }>();
        for (const id of providerIds) {
          providerStatus.set(id, { exists: false, hasEmail: false, isArchived: false, isClaimed: false });
        }
        for (const p of bpProviders ?? []) {
          // Check business_profiles email first, then fallback to olera-providers via source_provider_id
          const hasEmail = !!p.email || (p.source_provider_id ? !!oleraEmailByProviderId.get(p.source_provider_id) : false);
          const isClaimed = !!p.account_id;
          const status = { exists: true, hasEmail, isArchived: p.is_active === false, isClaimed };
          // Set status for both slug and source_provider_id to handle legacy lookups
          if (p.slug) {
            providerStatus.set(p.slug, status);
          }
          if (p.source_provider_id) {
            providerStatus.set(p.source_provider_id, status);
          }
        }
        for (const p of oleraProviders ?? []) {
          // Check if this olera-provider has a linked business_profile (for claim status and email)
          const linkedBp = p.provider_id ? bpBySourceIdForCount.get(p.provider_id) : null;
          const hasEmail = !!p.email || !!linkedBp?.email;
          const isClaimed = !!linkedBp?.account_id;

          // Set status using slug if not already set
          if (p.slug && !providerStatus.get(p.slug)?.exists) {
            providerStatus.set(p.slug, { exists: true, hasEmail, isArchived: false, isClaimed });
          }
          // Also set status using provider_id for legacy lookups
          if (p.provider_id && !providerStatus.get(p.provider_id)?.exists) {
            providerStatus.set(p.provider_id, { exists: true, hasEmail, isArchived: false, isClaimed });
          }
        }

        // Count only providers (not questions) where provider exists, not archived, not claimed, and has no email
        // Claimed providers are excluded because they have email from claiming - stale flags should be cleared
        const validProviderIds = new Set<string>();
        for (const q of questionsForCount ?? []) {
          const status = providerStatus.get(q.provider_id);
          if (status?.exists && !status.isArchived && !status.isClaimed && !status.hasEmail) {
            validProviderIds.add(q.provider_id);
          }
        }
        const validCount = validProviderIds.size;

        return NextResponse.json({ count: validCount });
      }

      // Standard count query for non-needs_email filters
      let countQuery = db.from("provider_questions").select("*", { count: "exact", head: true }).is("canonical_question_id", null);
      if (status) countQuery = (countQuery as any).eq("status", status);
      if (providerId) countQuery = (countQuery as any).eq("provider_id", providerId);
      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ count: 0 });
        countQuery = (countQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) countQuery = (countQuery as any).gte("created_at", dateFrom);
      if (dateTo) countQuery = (countQuery as any).lt("created_at", dateTo);
      const { count, error } = await countQuery;
      if (error) {
        console.error("Admin questions count error:", error);
        return NextResponse.json({ error: "Failed to count questions" }, { status: 500 });
      }
      return NextResponse.json({ count: count ?? 0 });
    }

    // For needs_email, we need to verify provider status before pagination
    // to ensure count and results match
    // Exclude email_dead questions - they belong in Delivery Issues tab
    if (needsEmail) {
      let needsEmailQuery = db
        .from("provider_questions")
        .select("*")
        .is("canonical_question_id", null)
        .contains("metadata", { needs_provider_email: true })
        .not("metadata", "cs", '{"email_dead":true}')
        .not("metadata", "cs", '{"provider_not_interested":true}')
        .not("metadata", "cs", '{"provider_no_contact":true}')
        .neq("status", "archived")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10000); // Match reasonable admin limit

      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
        needsEmailQuery = (needsEmailQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) needsEmailQuery = (needsEmailQuery as any).gte("created_at", dateFrom);
      if (dateTo) needsEmailQuery = (needsEmailQuery as any).lt("created_at", dateTo);

      const { data: allNeedsEmailQuestions, error: needsEmailError } = await needsEmailQuery;
      if (needsEmailError) {
        console.error("Admin questions fetch error:", needsEmailError);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      // Get unique provider IDs and check their status
      const providerIds = [...new Set((allNeedsEmailQuestions ?? []).map((q) => q.provider_id).filter(Boolean))];

      // Batch provider lookups to avoid URL length limits (50 IDs per batch)
      // Run bp and olera queries in parallel within each batch for speed
      const BATCH_SIZE = 50;
      const bpProvidersForFilter: { slug: string | null; email: string | null; is_active: boolean | null; source_provider_id: string | null; account_id: string | null }[] = [];
      const oleraProvidersForFilter: { slug: string | null; email: string | null; provider_id: string | null }[] = [];

      const filterBatchPromises = [];
      for (let i = 0; i < providerIds.length; i += BATCH_SIZE) {
        const batch = providerIds.slice(i, i + BATCH_SIZE);
        const bpOrConditions = [
          `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
          `source_provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
        ];
        const oleraOrConditions = [
          `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
          `provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
        ];
        filterBatchPromises.push(
          Promise.all([
            db.from("business_profiles").select("slug, email, is_active, source_provider_id, account_id").or(bpOrConditions.join(',')),
            db.from("olera-providers").select("slug, email, provider_id").or(oleraOrConditions.join(',')).not("deleted", "is", true)
          ])
        );
      }
      const filterBatchResults = await Promise.all(filterBatchPromises);
      for (const [bpResult, oleraResult] of filterBatchResults) {
        if (bpResult.data) bpProvidersForFilter.push(...bpResult.data);
        if (oleraResult.data) oleraProvidersForFilter.push(...oleraResult.data);
      }

      // Build olera email lookup by provider_id for fallback
      const oleraEmailByProviderIdForFilter = new Map<string, string>();
      for (const p of oleraProvidersForFilter ?? []) {
        if (p.provider_id && p.email) oleraEmailByProviderIdForFilter.set(p.provider_id, p.email);
      }

      // Reverse lookup: find business_profiles linked via source_provider_id for claim status (batched)
      const oleraProviderIdsForFilter = (oleraProvidersForFilter ?? [])
        .map((p) => p.provider_id)
        .filter((id): id is string => !!id);
      const linkedBpForFilter: { source_provider_id: string | null; email: string | null; account_id: string | null }[] = [];
      for (let i = 0; i < oleraProviderIdsForFilter.length; i += BATCH_SIZE) {
        const batch = oleraProviderIdsForFilter.slice(i, i + BATCH_SIZE);
        const { data } = await db
          .from("business_profiles")
          .select("source_provider_id, email, account_id")
          .in("source_provider_id", batch);
        if (data) linkedBpForFilter.push(...data);
      }
      const bpBySourceIdForFilter = new Map<string, { email: string | null; account_id: string | null }>();
      for (const bp of linkedBpForFilter ?? []) {
        if (bp.source_provider_id) {
          bpBySourceIdForFilter.set(bp.source_provider_id, { email: bp.email, account_id: bp.account_id });
        }
      }

      // Build provider status map with claimed status
      const providerStatusMap = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean; isClaimed: boolean }>();
      for (const id of providerIds) {
        providerStatusMap.set(id, { exists: false, hasEmail: false, isArchived: false, isClaimed: false });
      }
      for (const p of bpProvidersForFilter ?? []) {
        // Check business_profiles email first, then fallback to olera-providers via source_provider_id
        const hasEmail = !!p.email || (p.source_provider_id ? !!oleraEmailByProviderIdForFilter.get(p.source_provider_id) : false);
        const isClaimed = !!p.account_id;
        const status = { exists: true, hasEmail, isArchived: p.is_active === false, isClaimed };
        // Set status for both slug and source_provider_id to handle legacy lookups
        if (p.slug) {
          providerStatusMap.set(p.slug, status);
        }
        if (p.source_provider_id) {
          providerStatusMap.set(p.source_provider_id, status);
        }
      }
      for (const p of oleraProvidersForFilter ?? []) {
        // Check if this olera-provider has a linked business_profile (for claim status and email)
        const linkedBp = p.provider_id ? bpBySourceIdForFilter.get(p.provider_id) : null;
        const hasEmail = !!p.email || !!linkedBp?.email;
        const isClaimed = !!linkedBp?.account_id;

        // Set status using slug if not already set
        if (p.slug && !providerStatusMap.get(p.slug)?.exists) {
          providerStatusMap.set(p.slug, { exists: true, hasEmail, isArchived: false, isClaimed });
        }
        // Also set status using provider_id for legacy lookups where question.provider_id = alphanumeric ID
        if (p.provider_id && !providerStatusMap.get(p.provider_id)?.exists) {
          providerStatusMap.set(p.provider_id, { exists: true, hasEmail, isArchived: false, isClaimed });
        }
      }

      // Filter to valid questions only: provider exists, not archived, not claimed, and has no email on file
      // Claimed providers are excluded because they have email from claiming - stale flags should be cleared
      const validQuestions = (allNeedsEmailQuestions ?? []).filter((q) => {
        const pStatus = providerStatusMap.get(q.provider_id);
        return pStatus?.exists && !pStatus.isArchived && !pStatus.isClaimed && !pStatus.hasEmail;
      });

      // Apply provider-based pagination (paginate by provider, not question)
      const { questions, providerCount: count } = paginateByProvider(validQuestions, offset, limit);

      // Continue to enrichment below with these filtered questions
      // (fall through to the enrichment code)
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      let providerPhones: Record<string, string> = {};
      let providerClaimStatus: Record<string, boolean> = {};
      let providerVerificationState: Record<string, string> = {};
      if (slugs.length > 0) {
        // Try business_profiles first
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone) providerPhones[p.slug] = p.phone;
        }

        // Build claim/verification status maps
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerClaimStatus[p.slug] = !!p.account_id;
            providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
          }
        }

        // UUID fallback: Some questions store provider_id as business_profiles.id (UUID)
        const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
        if (missingFromSlugLookup.length > 0) {
          const { data: bpByUuid } = await db
            .from("business_profiles")
            .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
            .in("id", missingFromSlugLookup);
          for (const p of bpByUuid ?? []) {
            if (p.id) {
              providerNames[p.id] = p.display_name;
              if (p.source_provider_id) providerEditorIds[p.id] = p.source_provider_id;
              if (p.email) providerEmails[p.id] = p.email;
              if (p.phone) providerPhones[p.id] = p.phone;
              providerClaimStatus[p.id] = !!p.account_id;
              providerVerificationState[p.id] = (p.verification_state as string) || "unverified";
            }
          }
        }

        // Collect source_provider_ids for email fallback (where business_profiles has no email)
        const sourceIdsForEmailFallback = (bpProviders ?? [])
          .filter((p) => p.slug && !p.email && p.source_provider_id)
          .map((p) => ({ slug: p.slug as string, sourceId: p.source_provider_id as string }));

        // For slugs not found in business_profiles, try olera-providers
        const missingSlugs = slugs.filter((s) => !providerNames[s]);

        // Query olera-providers for missing slugs AND for email fallback via source_provider_id
        const sourceIdsToQuery = sourceIdsForEmailFallback.map((x) => x.sourceId);

        // Build OR conditions (only include non-empty arrays)
        const iosOrConditions: string[] = [];
        if (missingSlugs.length > 0) {
          iosOrConditions.push(`slug.in.(${missingSlugs.map(s => `"${s}"`).join(',')})`);
        }
        if (sourceIdsToQuery.length > 0) {
          iosOrConditions.push(`provider_id.in.(${sourceIdsToQuery.map(s => `"${s}"`).join(',')})`);
        }

        if (iosOrConditions.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email, phone")
            .or(iosOrConditions.join(','))
            .not("deleted", "is", true);

          // Build lookup by provider_id for email fallback
          const iosEmailByProviderId = new Map<string, string>();
          const iosPhoneByProviderId = new Map<string, string>();
          for (const p of iosProviders ?? []) {
            if (p.provider_id && p.email) iosEmailByProviderId.set(p.provider_id, p.email);
            if (p.provider_id && p.phone) iosPhoneByProviderId.set(p.provider_id, p.phone);
          }

          // Fill in email/phone for business_profiles providers via source_provider_id fallback
          for (const { slug, sourceId } of sourceIdsForEmailFallback) {
            if (!providerEmails[slug] && iosEmailByProviderId.has(sourceId)) {
              providerEmails[slug] = iosEmailByProviderId.get(sourceId)!;
            }
            if (!providerPhones[slug] && iosPhoneByProviderId.has(sourceId)) {
              providerPhones[slug] = iosPhoneByProviderId.get(sourceId)!;
            }
          }

          // Fill in data for providers only in olera-providers
          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
            if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          }

          // Lookup linked business_profiles via source_provider_id for claim status
          const iosProviderIds = (iosProviders ?? []).map((p) => p.provider_id).filter((id): id is string => !!id);
          if (iosProviderIds.length > 0) {
            const { data: linkedBpProfiles } = await db
              .from("business_profiles")
              .select("slug, source_provider_id, email, phone, account_id, verification_state")
              .in("source_provider_id", iosProviderIds);
            const bpBySourceId = new Map<string, typeof linkedBpProfiles extends (infer T)[] | null ? T : never>();
            for (const bp of linkedBpProfiles ?? []) {
              if (bp.source_provider_id) bpBySourceId.set(bp.source_provider_id, bp);
            }
            for (const ios of iosProviders ?? []) {
              if (ios.provider_id) {
                const linkedBp = bpBySourceId.get(ios.provider_id);
                if (linkedBp) {
                  // Populate using ios.slug (if exists)
                  if (ios.slug) {
                    providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                    if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                    if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                    providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
                  }
                  // Also populate using ios.provider_id (for legacy lookups where question.provider_id = alphanumeric ID)
                  providerClaimStatus[ios.provider_id] = !!linkedBp.account_id;
                  if (linkedBp.email && !providerEmails[ios.provider_id]) providerEmails[ios.provider_id] = linkedBp.email;
                  if (linkedBp.phone && !providerPhones[ios.provider_id]) providerPhones[ios.provider_id] = linkedBp.phone;
                  providerVerificationState[ios.provider_id] = (linkedBp.verification_state as string) || "unverified";
                }
              }
            }
          }
        }
      }

      // Fetch apollo_contact from provider_outreach_tracking for Apollo decision-maker lookup
      // This is keyed by provider_id (olera-providers.provider_id), so we need to map via providerEditorIds
      const apolloContactLookup: Record<string, {
        email: string;
        first_name: string | null;
        last_name: string | null;
        title: string | null;
        linkedin_url: string | null;
        found_at: string;
      }> = {};
      const apolloEmailSourceLookup: Record<string, string> = {};

      const providerIdsForApollo = [...new Set(
        Object.values(providerEditorIds).filter(Boolean)
      )];

      if (providerIdsForApollo.length > 0) {
        const { data: outreachData } = await db
          .from("provider_outreach_tracking")
          .select("provider_id, apollo_contact, email_source")
          .in("provider_id", providerIdsForApollo);

        // Build lookup map from provider_id to outreach data
        const outreachByProviderId = new Map<string, { apollo_contact: unknown; email_source: string | null }>();
        for (const d of outreachData ?? []) {
          if (d.provider_id) {
            outreachByProviderId.set(d.provider_id, { apollo_contact: d.apollo_contact, email_source: d.email_source });
          }
        }

        // Populate lookup for ALL slug variants that map to each provider_id
        for (const [slug, editorId] of Object.entries(providerEditorIds)) {
          if (editorId) {
            const outreach = outreachByProviderId.get(editorId);
            if (outreach?.apollo_contact) {
              apolloContactLookup[slug] = outreach.apollo_contact as typeof apolloContactLookup[string];
            }
            if (outreach?.email_source) {
              apolloEmailSourceLookup[slug] = outreach.email_source;
            }
          }
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
        provider_phone: providerPhones[q.provider_id] || null,
        is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
        verification_state: providerVerificationState[q.provider_id] || null,
        apollo_contact: apolloContactLookup[q.provider_id] || null,
        email_source: apolloEmailSourceLookup[q.provider_id] || null,
      }));

      return NextResponse.json({ questions: enriched, count, tabCounts: await getTabCounts(dateFrom, dateTo) });
    }

    // For delivery_issues, show questions where email was on file but delivery failed
    // Include answered questions — the email channel is still broken and needs trust override
    if (deliveryIssues) {
      let deliveryIssuesQuery = db
        .from("provider_questions")
        .select("*")
        .is("canonical_question_id", null)
        .contains("metadata", { email_dead: true })
        .not("metadata", "cs", '{"provider_not_interested":true}')
        .neq("status", "archived")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
        deliveryIssuesQuery = (deliveryIssuesQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) deliveryIssuesQuery = (deliveryIssuesQuery as any).gte("created_at", dateFrom);
      if (dateTo) deliveryIssuesQuery = (deliveryIssuesQuery as any).lt("created_at", dateTo);

      const { data: allDeliveryIssuesQuestions, error: deliveryIssuesError } = await deliveryIssuesQuery;
      if (deliveryIssuesError) {
        console.error("Admin questions fetch error:", deliveryIssuesError);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      // Apply provider-based pagination (paginate by provider, not question)
      const { questions, providerCount: count } = paginateByProvider(
        allDeliveryIssuesQuestions ?? [],
        offset,
        limit
      );

      // Enrich with provider data
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      let providerPhones: Record<string, string> = {};
      let providerClaimStatus: Record<string, boolean> = {};
      let providerVerificationState: Record<string, string> = {};
      if (slugs.length > 0) {
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone) providerPhones[p.slug] = p.phone;
        }
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerClaimStatus[p.slug] = !!p.account_id;
            providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
          }
        }

        // UUID fallback: Some questions store provider_id as business_profiles.id (UUID)
        const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
        if (missingFromSlugLookup.length > 0) {
          const { data: bpByUuid } = await db
            .from("business_profiles")
            .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
            .in("id", missingFromSlugLookup);
          for (const p of bpByUuid ?? []) {
            if (p.id) {
              providerNames[p.id] = p.display_name;
              if (p.source_provider_id) providerEditorIds[p.id] = p.source_provider_id;
              if (p.email) providerEmails[p.id] = p.email;
              if (p.phone) providerPhones[p.id] = p.phone;
              providerClaimStatus[p.id] = !!p.account_id;
              providerVerificationState[p.id] = (p.verification_state as string) || "unverified";
            }
          }
        }

        // Collect source_provider_ids for email fallback (where business_profiles has no email)
        const sourceIdsForFallback = (bpProviders ?? [])
          .filter((p) => p.slug && !p.email && p.source_provider_id)
          .map((p) => ({ slug: p.slug as string, sourceId: p.source_provider_id as string }));

        const missingSlugs = slugs.filter((s) => !providerNames[s]);
        const sourceIdsToQuery = sourceIdsForFallback.map((x) => x.sourceId);

        // Build OR conditions (only include non-empty arrays)
        const iosOrConditions: string[] = [];
        if (missingSlugs.length > 0) {
          iosOrConditions.push(`slug.in.(${missingSlugs.map(s => `"${s}"`).join(',')})`);
        }
        if (sourceIdsToQuery.length > 0) {
          iosOrConditions.push(`provider_id.in.(${sourceIdsToQuery.map(s => `"${s}"`).join(',')})`);
        }

        if (iosOrConditions.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email, phone")
            .or(iosOrConditions.join(','))
            .not("deleted", "is", true);

          // Build lookup by provider_id for email fallback
          const iosEmailById = new Map<string, string>();
          const iosPhoneById = new Map<string, string>();
          for (const p of iosProviders ?? []) {
            if (p.provider_id && p.email) iosEmailById.set(p.provider_id, p.email);
            if (p.provider_id && p.phone) iosPhoneById.set(p.provider_id, p.phone);
          }

          // Fill in email/phone for business_profiles providers via source_provider_id fallback
          for (const { slug, sourceId } of sourceIdsForFallback) {
            if (!providerEmails[slug] && iosEmailById.has(sourceId)) providerEmails[slug] = iosEmailById.get(sourceId)!;
            if (!providerPhones[slug] && iosPhoneById.has(sourceId)) providerPhones[slug] = iosPhoneById.get(sourceId)!;
          }

          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
            if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          }

          // Lookup linked business_profiles via source_provider_id for claim status
          const iosProviderIds = (iosProviders ?? []).map((p) => p.provider_id).filter((id): id is string => !!id);
          if (iosProviderIds.length > 0) {
            const { data: linkedBpProfiles } = await db
              .from("business_profiles")
              .select("slug, source_provider_id, email, phone, account_id, verification_state")
              .in("source_provider_id", iosProviderIds);
            const bpBySourceId = new Map<string, typeof linkedBpProfiles extends (infer T)[] | null ? T : never>();
            for (const bp of linkedBpProfiles ?? []) {
              if (bp.source_provider_id) bpBySourceId.set(bp.source_provider_id, bp);
            }
            for (const ios of iosProviders ?? []) {
              if (ios.provider_id) {
                const linkedBp = bpBySourceId.get(ios.provider_id);
                if (linkedBp) {
                  // Populate using ios.slug (if exists)
                  if (ios.slug) {
                    providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                    if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                    if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                    providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
                  }
                  // Also populate using ios.provider_id (for legacy lookups where question.provider_id = alphanumeric ID)
                  providerClaimStatus[ios.provider_id] = !!linkedBp.account_id;
                  if (linkedBp.email && !providerEmails[ios.provider_id]) providerEmails[ios.provider_id] = linkedBp.email;
                  if (linkedBp.phone && !providerPhones[ios.provider_id]) providerPhones[ios.provider_id] = linkedBp.phone;
                  providerVerificationState[ios.provider_id] = (linkedBp.verification_state as string) || "unverified";
                }
              }
            }
          }
        }
      }

      // Fetch email history for question notifications sent to these providers
      const providerEmailHistory: Record<string, Array<{
        id: string;
        recipient: string | null;
        created_at: string;
        subject: string;
        delivered_at: string | null;
        first_opened_at: string | null;
        bounced_at: string | null;
        complained_at: string | null;
      }>> = {};

      const uniqueProviderIdsForEmail = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      if (uniqueProviderIdsForEmail.length > 0) {
        const { data: emailLogs } = await db
          .from("email_log")
          .select("id, provider_id, recipient, created_at, subject, delivered_at, first_opened_at, bounced_at, complained_at")
          .in("provider_id", uniqueProviderIdsForEmail)
          .eq("email_type", "question_received")
          .eq("recipient_type", "provider")
          .order("created_at", { ascending: false })
          .limit(500);

        for (const log of emailLogs ?? []) {
          if (!log.provider_id) continue;
          if (!providerEmailHistory[log.provider_id]) {
            providerEmailHistory[log.provider_id] = [];
          }
          providerEmailHistory[log.provider_id].push({
            id: log.id,
            recipient: log.recipient,
            created_at: log.created_at,
            subject: log.subject,
            delivered_at: log.delivered_at,
            first_opened_at: log.first_opened_at,
            bounced_at: log.bounced_at,
            complained_at: log.complained_at,
          });
        }
      }

      // Fetch apollo_contact from provider_outreach_tracking for Apollo decision-maker lookup
      const apolloContactLookup: Record<string, {
        email: string;
        first_name: string | null;
        last_name: string | null;
        title: string | null;
        linkedin_url: string | null;
        found_at: string;
      }> = {};
      const apolloEmailSourceLookup: Record<string, string> = {};

      const providerIdsForApollo = [...new Set(
        Object.values(providerEditorIds).filter(Boolean)
      )];

      if (providerIdsForApollo.length > 0) {
        const { data: outreachData } = await db
          .from("provider_outreach_tracking")
          .select("provider_id, apollo_contact, email_source")
          .in("provider_id", providerIdsForApollo);

        // Build lookup map from provider_id to outreach data
        const outreachByProviderId = new Map<string, { apollo_contact: unknown; email_source: string | null }>();
        for (const d of outreachData ?? []) {
          if (d.provider_id) {
            outreachByProviderId.set(d.provider_id, { apollo_contact: d.apollo_contact, email_source: d.email_source });
          }
        }

        // Populate lookup for ALL slug variants that map to each provider_id
        for (const [slug, editorId] of Object.entries(providerEditorIds)) {
          if (editorId) {
            const outreach = outreachByProviderId.get(editorId);
            if (outreach?.apollo_contact) {
              apolloContactLookup[slug] = outreach.apollo_contact as typeof apolloContactLookup[string];
            }
            if (outreach?.email_source) {
              apolloEmailSourceLookup[slug] = outreach.email_source;
            }
          }
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
        provider_phone: providerPhones[q.provider_id] || null,
        is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
        verification_state: providerVerificationState[q.provider_id] || null,
        provider_email_history: providerEmailHistory[q.provider_id] || [],
        apollo_contact: apolloContactLookup[q.provider_id] || null,
        email_source: apolloEmailSourceLookup[q.provider_id] || null,
      }));

      return NextResponse.json({ questions: enriched, count, tabCounts: await getTabCounts(dateFrom, dateTo) });
    }

    // For not_interested, show questions where provider is marked as not interested
    if (notInterested) {
      let notInterestedQuery = db
        .from("provider_questions")
        .select("*")
        .is("canonical_question_id", null)
        .contains("metadata", { provider_not_interested: true })
        .neq("status", "archived")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
        notInterestedQuery = (notInterestedQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) notInterestedQuery = (notInterestedQuery as any).gte("created_at", dateFrom);
      if (dateTo) notInterestedQuery = (notInterestedQuery as any).lt("created_at", dateTo);

      const { data: allNotInterestedQuestions, error: notInterestedError } = await notInterestedQuery;
      if (notInterestedError) {
        console.error("Admin questions fetch error:", notInterestedError);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      // Apply provider-based pagination (paginate by provider, not question)
      const { questions, providerCount: count } = paginateByProvider(
        allNotInterestedQuestions ?? [],
        offset,
        limit
      );

      // Enrich with provider data
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      let providerPhones: Record<string, string> = {};
      let providerClaimStatus: Record<string, boolean> = {};
      let providerVerificationState: Record<string, string> = {};
      if (slugs.length > 0) {
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone) providerPhones[p.slug] = p.phone;
        }
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerClaimStatus[p.slug] = !!p.account_id;
            providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
          }
        }

        // UUID fallback: Some questions store provider_id as business_profiles.id (UUID)
        const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
        if (missingFromSlugLookup.length > 0) {
          const { data: bpByUuid } = await db
            .from("business_profiles")
            .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
            .in("id", missingFromSlugLookup);
          for (const p of bpByUuid ?? []) {
            if (p.id) {
              providerNames[p.id] = p.display_name;
              if (p.source_provider_id) providerEditorIds[p.id] = p.source_provider_id;
              if (p.email) providerEmails[p.id] = p.email;
              if (p.phone) providerPhones[p.id] = p.phone;
              providerClaimStatus[p.id] = !!p.account_id;
              providerVerificationState[p.id] = (p.verification_state as string) || "unverified";
            }
          }
        }

        // Collect source_provider_ids for email fallback (where business_profiles has no email)
        const sourceIdsForFallback = (bpProviders ?? [])
          .filter((p) => p.slug && !p.email && p.source_provider_id)
          .map((p) => ({ slug: p.slug as string, sourceId: p.source_provider_id as string }));

        const missingSlugs = slugs.filter((s) => !providerNames[s]);
        const sourceIdsToQuery = sourceIdsForFallback.map((x) => x.sourceId);

        // Build OR conditions (only include non-empty arrays)
        const iosOrConditions: string[] = [];
        if (missingSlugs.length > 0) {
          iosOrConditions.push(`slug.in.(${missingSlugs.map(s => `"${s}"`).join(',')})`);
        }
        if (sourceIdsToQuery.length > 0) {
          iosOrConditions.push(`provider_id.in.(${sourceIdsToQuery.map(s => `"${s}"`).join(',')})`);
        }

        if (iosOrConditions.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email, phone")
            .or(iosOrConditions.join(','))
            .not("deleted", "is", true);

          // Build lookup by provider_id for email fallback
          const iosEmailById = new Map<string, string>();
          const iosPhoneById = new Map<string, string>();
          for (const p of iosProviders ?? []) {
            if (p.provider_id && p.email) iosEmailById.set(p.provider_id, p.email);
            if (p.provider_id && p.phone) iosPhoneById.set(p.provider_id, p.phone);
          }

          // Fill in email/phone for business_profiles providers via source_provider_id fallback
          for (const { slug, sourceId } of sourceIdsForFallback) {
            if (!providerEmails[slug] && iosEmailById.has(sourceId)) providerEmails[slug] = iosEmailById.get(sourceId)!;
            if (!providerPhones[slug] && iosPhoneById.has(sourceId)) providerPhones[slug] = iosPhoneById.get(sourceId)!;
          }

          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
            if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          }

          // Lookup linked business_profiles via source_provider_id for claim status
          const iosProviderIds = (iosProviders ?? []).map((p) => p.provider_id).filter((id): id is string => !!id);
          if (iosProviderIds.length > 0) {
            const { data: linkedBpProfiles } = await db
              .from("business_profiles")
              .select("slug, source_provider_id, email, phone, account_id, verification_state")
              .in("source_provider_id", iosProviderIds);
            const bpBySourceId = new Map<string, typeof linkedBpProfiles extends (infer T)[] | null ? T : never>();
            for (const bp of linkedBpProfiles ?? []) {
              if (bp.source_provider_id) bpBySourceId.set(bp.source_provider_id, bp);
            }
            for (const ios of iosProviders ?? []) {
              if (ios.provider_id) {
                const linkedBp = bpBySourceId.get(ios.provider_id);
                if (linkedBp) {
                  // Populate using ios.slug (if exists)
                  if (ios.slug) {
                    providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                    if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                    if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                    providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
                  }
                  // Also populate using ios.provider_id (for legacy lookups where question.provider_id = alphanumeric ID)
                  providerClaimStatus[ios.provider_id] = !!linkedBp.account_id;
                  if (linkedBp.email && !providerEmails[ios.provider_id]) providerEmails[ios.provider_id] = linkedBp.email;
                  if (linkedBp.phone && !providerPhones[ios.provider_id]) providerPhones[ios.provider_id] = linkedBp.phone;
                  providerVerificationState[ios.provider_id] = (linkedBp.verification_state as string) || "unverified";
                }
              }
            }
          }
        }
      }

      // Fetch email history for question notifications sent to these providers
      const providerEmailHistory: Record<string, Array<{
        id: string;
        recipient: string | null;
        created_at: string;
        subject: string;
        delivered_at: string | null;
        first_opened_at: string | null;
        bounced_at: string | null;
        complained_at: string | null;
      }>> = {};

      const uniqueProviderIdsForEmail = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      if (uniqueProviderIdsForEmail.length > 0) {
        const { data: emailLogs } = await db
          .from("email_log")
          .select("id, provider_id, recipient, created_at, subject, delivered_at, first_opened_at, bounced_at, complained_at")
          .in("provider_id", uniqueProviderIdsForEmail)
          .eq("email_type", "question_received")
          .eq("recipient_type", "provider")
          .order("created_at", { ascending: false })
          .limit(500);

        for (const log of emailLogs ?? []) {
          if (!log.provider_id) continue;
          if (!providerEmailHistory[log.provider_id]) {
            providerEmailHistory[log.provider_id] = [];
          }
          providerEmailHistory[log.provider_id].push({
            id: log.id,
            recipient: log.recipient,
            created_at: log.created_at,
            subject: log.subject,
            delivered_at: log.delivered_at,
            first_opened_at: log.first_opened_at,
            bounced_at: log.bounced_at,
            complained_at: log.complained_at,
          });
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
        provider_phone: providerPhones[q.provider_id] || null,
        is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
        verification_state: providerVerificationState[q.provider_id] || null,
        provider_email_history: providerEmailHistory[q.provider_id] || [],
      }));

      return NextResponse.json({ questions: enriched, count, tabCounts: await getTabCounts(dateFrom, dateTo) });
    }

    // For no_contact, show questions where provider is tagged as no contact
    // This is purely organizational - providers where admin couldn't find contact info
    if (noContact) {
      let noContactQuery = db
        .from("provider_questions")
        .select("*")
        .is("canonical_question_id", null)
        .contains("metadata", { provider_no_contact: true })
        .neq("status", "archived")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
        noContactQuery = (noContactQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) noContactQuery = (noContactQuery as any).gte("created_at", dateFrom);
      if (dateTo) noContactQuery = (noContactQuery as any).lt("created_at", dateTo);

      const { data: allNoContactQuestions, error: noContactError } = await noContactQuery;
      if (noContactError) {
        console.error("Admin questions fetch error:", noContactError);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      // Apply provider-based pagination (paginate by provider, not question)
      const { questions, providerCount: count } = paginateByProvider(
        allNoContactQuestions ?? [],
        offset,
        limit
      );

      // Enrich with provider data (same pattern as other tabs)
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      let providerPhones: Record<string, string> = {};
      let providerClaimStatus: Record<string, boolean> = {};
      let providerVerificationState: Record<string, string> = {};
      if (slugs.length > 0) {
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone) providerPhones[p.slug] = p.phone;
        }
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerClaimStatus[p.slug] = !!p.account_id;
            providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
          }
        }

        // Fallback to olera-providers for missing names
        const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
        if (missingFromSlugLookup.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email, phone")
            .in("slug", missingFromSlugLookup)
            .not("deleted", "is", true);
          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
            if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          }
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
        provider_phone: providerPhones[q.provider_id] || null,
        is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
        verification_state: providerVerificationState[q.provider_id] || null,
        provider_email_history: [],
      }));

      return NextResponse.json({ questions: enriched, count, tabCounts: await getTabCounts(dateFrom, dateTo) });
    }

    // For unanswered, show pending questions EXCLUDING those in other priority tabs
    // (Delivery Issues, Not Interested). This ensures tabs are mutually exclusive.
    if (unanswered) {
      let unansweredQuery = db
        .from("provider_questions")
        .select("*")
        .is("canonical_question_id", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10000);

      // Note: Supabase doesn't easily support NOT contains for JSONB.
      // We filter in-memory below to exclude email_dead and provider_not_interested.

      if (searchSlugs) {
        if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
        unansweredQuery = (unansweredQuery as any).in("provider_id", searchSlugs);
      }
      if (dateFrom) unansweredQuery = (unansweredQuery as any).gte("created_at", dateFrom);
      if (dateTo) unansweredQuery = (unansweredQuery as any).lt("created_at", dateTo);

      const { data: allUnansweredQuestions, error: unansweredError } = await unansweredQuery;
      if (unansweredError) {
        console.error("Admin questions fetch error:", unansweredError);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
      }

      // Filter out questions that belong in other tabs:
      // - email_dead → Delivery Issues tab
      // - provider_not_interested → Not Interested tab
      // - needs_provider_email → Needs Email tab
      const filteredQuestions = (allUnansweredQuestions ?? []).filter((q) => {
        const meta = q.metadata as Record<string, unknown> | null;
        if (meta?.email_dead === true) return false;
        if (meta?.provider_not_interested === true) return false;
        if (meta?.needs_provider_email === true) return false;
        return true;
      });

      // Apply provider-based pagination (paginate by provider, not question)
      const { questions, providerCount: count } = paginateByProvider(filteredQuestions, offset, limit);

      // Enrich with provider data
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      let providerPhones: Record<string, string> = {};
      let providerClaimStatus: Record<string, boolean> = {};
      let providerVerificationState: Record<string, string> = {};
      if (slugs.length > 0) {
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone) providerPhones[p.slug] = p.phone;
        }
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerClaimStatus[p.slug] = !!p.account_id;
            providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
          }
        }

        // UUID fallback: Some questions store provider_id as business_profiles.id (UUID)
        const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
        if (missingFromSlugLookup.length > 0) {
          const { data: bpByUuid } = await db
            .from("business_profiles")
            .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
            .in("id", missingFromSlugLookup);
          for (const p of bpByUuid ?? []) {
            if (p.id) {
              providerNames[p.id] = p.display_name;
              if (p.source_provider_id) providerEditorIds[p.id] = p.source_provider_id;
              if (p.email) providerEmails[p.id] = p.email;
              if (p.phone) providerPhones[p.id] = p.phone;
              providerClaimStatus[p.id] = !!p.account_id;
              providerVerificationState[p.id] = (p.verification_state as string) || "unverified";
            }
          }
        }

        // Collect source_provider_ids for email fallback (where business_profiles has no email)
        const sourceIdsForFallback = (bpProviders ?? [])
          .filter((p) => p.slug && !p.email && p.source_provider_id)
          .map((p) => ({ slug: p.slug as string, sourceId: p.source_provider_id as string }));

        const missingSlugs = slugs.filter((s) => !providerNames[s]);
        const sourceIdsToQuery = sourceIdsForFallback.map((x) => x.sourceId);

        // Build OR conditions (only include non-empty arrays)
        const iosOrConditions: string[] = [];
        if (missingSlugs.length > 0) {
          iosOrConditions.push(`slug.in.(${missingSlugs.map(s => `"${s}"`).join(',')})`);
        }
        if (sourceIdsToQuery.length > 0) {
          iosOrConditions.push(`provider_id.in.(${sourceIdsToQuery.map(s => `"${s}"`).join(',')})`);
        }

        if (iosOrConditions.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email, phone")
            .or(iosOrConditions.join(','))
            .not("deleted", "is", true);

          // Build lookup by provider_id for email fallback
          const iosEmailById = new Map<string, string>();
          const iosPhoneById = new Map<string, string>();
          for (const p of iosProviders ?? []) {
            if (p.provider_id && p.email) iosEmailById.set(p.provider_id, p.email);
            if (p.provider_id && p.phone) iosPhoneById.set(p.provider_id, p.phone);
          }

          // Fill in email/phone for business_profiles providers via source_provider_id fallback
          for (const { slug, sourceId } of sourceIdsForFallback) {
            if (!providerEmails[slug] && iosEmailById.has(sourceId)) providerEmails[slug] = iosEmailById.get(sourceId)!;
            if (!providerPhones[slug] && iosPhoneById.has(sourceId)) providerPhones[slug] = iosPhoneById.get(sourceId)!;
          }

          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
            if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          }

          // Lookup linked business_profiles via source_provider_id for claim status
          const iosProviderIds = (iosProviders ?? []).map((p) => p.provider_id).filter((id): id is string => !!id);
          if (iosProviderIds.length > 0) {
            const { data: linkedBpProfiles } = await db
              .from("business_profiles")
              .select("slug, source_provider_id, email, phone, account_id, verification_state")
              .in("source_provider_id", iosProviderIds);
            const bpBySourceId = new Map<string, typeof linkedBpProfiles extends (infer T)[] | null ? T : never>();
            for (const bp of linkedBpProfiles ?? []) {
              if (bp.source_provider_id) bpBySourceId.set(bp.source_provider_id, bp);
            }
            for (const ios of iosProviders ?? []) {
              if (ios.provider_id) {
                const linkedBp = bpBySourceId.get(ios.provider_id);
                if (linkedBp) {
                  // Populate using ios.slug (if exists)
                  if (ios.slug) {
                    providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                    if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                    if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                    providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
                  }
                  // Also populate using ios.provider_id (for legacy lookups where question.provider_id = alphanumeric ID)
                  providerClaimStatus[ios.provider_id] = !!linkedBp.account_id;
                  if (linkedBp.email && !providerEmails[ios.provider_id]) providerEmails[ios.provider_id] = linkedBp.email;
                  if (linkedBp.phone && !providerPhones[ios.provider_id]) providerPhones[ios.provider_id] = linkedBp.phone;
                  providerVerificationState[ios.provider_id] = (linkedBp.verification_state as string) || "unverified";
                }
              }
            }
          }
        }
      }

      // Fetch email history for question notifications sent to these providers
      const providerEmailHistory: Record<string, Array<{
        id: string;
        recipient: string | null;
        created_at: string;
        subject: string;
        delivered_at: string | null;
        first_opened_at: string | null;
        bounced_at: string | null;
        complained_at: string | null;
      }>> = {};

      const uniqueProviderIdsForEmail = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      if (uniqueProviderIdsForEmail.length > 0) {
        const { data: emailLogs } = await db
          .from("email_log")
          .select("id, provider_id, recipient, created_at, subject, delivered_at, first_opened_at, bounced_at, complained_at")
          .in("provider_id", uniqueProviderIdsForEmail)
          .eq("email_type", "question_received")
          .eq("recipient_type", "provider")
          .order("created_at", { ascending: false })
          .limit(500);

        for (const log of emailLogs ?? []) {
          if (!log.provider_id) continue;
          if (!providerEmailHistory[log.provider_id]) {
            providerEmailHistory[log.provider_id] = [];
          }
          providerEmailHistory[log.provider_id].push({
            id: log.id,
            recipient: log.recipient,
            created_at: log.created_at,
            subject: log.subject,
            delivered_at: log.delivered_at,
            first_opened_at: log.first_opened_at,
            bounced_at: log.bounced_at,
            complained_at: log.complained_at,
          });
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
        provider_phone: providerPhones[q.provider_id] || null,
        is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
        verification_state: providerVerificationState[q.provider_id] || null,
        provider_email_history: providerEmailHistory[q.provider_id] || [],
      }));

      return NextResponse.json({ questions: enriched, count, tabCounts: await getTabCounts(dateFrom, dateTo) });
    }

    // Standard query path (for answered, archived, and "all" tabs)
    // Uses provider-based pagination like other tabs
    let query = db
      .from("provider_questions")
      .select("*")
      .is("canonical_question_id", null)
      .order("created_at", { ascending: false })
      .limit(50000);

    // "answered" tab includes both "answered" and "approved" statuses
    if (status === "answered") {
      query = query.in("status", ["answered", "approved"]);
    } else if (status) {
      query = query.eq("status", status);
    }
    if (providerId) query = query.eq("provider_id", providerId);
    if (searchSlugs) {
      if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
      query = query.in("provider_id", searchSlugs);
    }
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lt("created_at", dateTo);

    const { data: allQuestions, error } = await query;

    if (error) {
      console.error("Admin questions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Apply provider-based pagination (paginate by provider, not question)
    const { questions, providerCount: count } = paginateByProvider(allQuestions ?? [], offset, limit);

    // Enrich with provider display names
    const slugs = [...new Set((questions ?? []).map((q) => q.provider_id).filter(Boolean))];

    let providerNames: Record<string, string> = {};
    let providerEditorIds: Record<string, string> = {};
    let providerEmails: Record<string, string> = {};
    let providerPhones: Record<string, string> = {};
    let providerClaimStatus: Record<string, boolean> = {};
    let providerVerificationState: Record<string, string> = {};

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: Direct lookup via business_profile_id (proper FK - most reliable)
    // Questions with business_profile_id set get accurate data directly
    // ═══════════════════════════════════════════════════════════════════════════
    const questionsWithBpId = (questions ?? []).filter((q: Record<string, unknown>) => q.business_profile_id);
    const bpIds = [...new Set(questionsWithBpId.map((q: Record<string, unknown>) => q.business_profile_id as string))];

    if (bpIds.length > 0) {
      const { data: bpDirect } = await db
        .from("business_profiles")
        .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
        .in("id", bpIds);

      // Map by business_profile_id so we can look up by question's business_profile_id
      const bpById = new Map<string, typeof bpDirect extends (infer T)[] | null ? T : never>();
      for (const bp of bpDirect ?? []) {
        if (bp.id) bpById.set(bp.id, bp);
      }

      // Populate data for each question with business_profile_id
      for (const q of questionsWithBpId) {
        const qTyped = q as Record<string, unknown>;
        const bp = bpById.get(qTyped.business_profile_id as string);
        if (bp && qTyped.provider_id) {
          const slug = qTyped.provider_id as string;
          if (bp.display_name && !providerNames[slug]) providerNames[slug] = bp.display_name;
          if (bp.source_provider_id && !providerEditorIds[slug]) providerEditorIds[slug] = bp.source_provider_id;
          if (bp.email && !providerEmails[slug]) providerEmails[slug] = bp.email;
          if (bp.phone && !providerPhones[slug]) providerPhones[slug] = bp.phone;
          providerClaimStatus[slug] = !!bp.account_id;
          providerVerificationState[slug] = (bp.verification_state as string) || "unverified";
        }
      }

    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: Slug-based lookups for questions without business_profile_id
    // This handles legacy questions that don't have the FK populated yet
    // Only process slugs that weren't already populated by Phase 1
    // ═══════════════════════════════════════════════════════════════════════════
    const slugsStillMissing = slugs.filter(s => providerClaimStatus[s] === undefined);

    if (slugsStillMissing.length > 0) {
      // Try business_profiles first (only for slugs not already populated)
      const { data: bpProviders } = await db
        .from("business_profiles")
        .select("slug, display_name, source_provider_id, email, phone, account_id, verification_state, metadata")
        .in("slug", slugsStillMissing);

      // ADD to existing maps (don't overwrite Phase 1 data)
      for (const p of bpProviders ?? []) {
        if (p.slug && p.display_name && !providerNames[p.slug]) providerNames[p.slug] = p.display_name;
        if (p.slug && p.source_provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.source_provider_id;
        if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
        if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
      }

      // Build claim/verification status maps (only for slugs not already set)
      for (const p of bpProviders ?? []) {
        if (p.slug && providerClaimStatus[p.slug] === undefined) {
          providerClaimStatus[p.slug] = !!p.account_id;
          providerVerificationState[p.slug] = (p.verification_state as string) || "unverified";
        }
      }


      // UUID fallback: Some questions store provider_id as business_profiles.id (UUID)
      // Try to find providers not matched by slug using UUID lookup
      const missingFromSlugLookup = slugs.filter((s) => !providerNames[s]);
      if (missingFromSlugLookup.length > 0) {
        const { data: bpByUuid } = await db
          .from("business_profiles")
          .select("id, slug, display_name, source_provider_id, email, phone, account_id, verification_state")
          .in("id", missingFromSlugLookup);
        for (const p of bpByUuid ?? []) {
          if (p.id) {
            // Index by the UUID (which is the provider_id in the question)
            providerNames[p.id] = p.display_name;
            if (p.source_provider_id) providerEditorIds[p.id] = p.source_provider_id;
            if (p.email) providerEmails[p.id] = p.email;
            if (p.phone) providerPhones[p.id] = p.phone;
            providerClaimStatus[p.id] = !!p.account_id;
            providerVerificationState[p.id] = (p.verification_state as string) || "unverified";
          }
        }
      }

      // Collect source_provider_ids for email fallback (where business_profiles has no email)
      const sourceIdsForFallback = (bpProviders ?? [])
        .filter((p) => p.slug && !p.email && p.source_provider_id)
        .map((p) => ({ slug: p.slug as string, sourceId: p.source_provider_id as string }));

      // For slugs not found in business_profiles, try olera-providers
      const missingSlugs = slugs.filter((s) => !providerNames[s]);
      const sourceIdsToQuery = sourceIdsForFallback.map((x) => x.sourceId);

      // Build OR conditions (only include non-empty arrays)
      // For legacy support, also check provider_id for missingSlugs (some stored as provider_id, not slug)
      const iosOrConditions: string[] = [];
      if (missingSlugs.length > 0) {
        iosOrConditions.push(`slug.in.(${missingSlugs.map(s => `"${s}"`).join(',')})`);
      }
      const providerIdsToCheck = [...missingSlugs, ...sourceIdsToQuery];
      if (providerIdsToCheck.length > 0) {
        iosOrConditions.push(`provider_id.in.(${providerIdsToCheck.map(s => `"${s}"`).join(',')})`);
      }

      if (iosOrConditions.length > 0) {
        const { data: iosProviders, error: iosError } = await db
          .from("olera-providers")
          .select("slug, provider_id, provider_name, email, phone, deleted")
          .or(iosOrConditions.join(','));

        // Filter out deleted providers
        const activeIosProviders = (iosProviders ?? []).filter(p => p.deleted !== true);

        // Build lookup by provider_id for email fallback
        const iosEmailById = new Map<string, string>();
        const iosPhoneById = new Map<string, string>();
        for (const p of activeIosProviders) {
          if (p.provider_id && p.email) iosEmailById.set(p.provider_id, p.email);
          if (p.provider_id && p.phone) iosPhoneById.set(p.provider_id, p.phone);
        }

        // Fill in email/phone for business_profiles providers via source_provider_id fallback
        for (const { slug, sourceId } of sourceIdsForFallback) {
          if (!providerEmails[slug] && iosEmailById.has(sourceId)) providerEmails[slug] = iosEmailById.get(sourceId)!;
          if (!providerPhones[slug] && iosPhoneById.has(sourceId)) providerPhones[slug] = iosPhoneById.get(sourceId)!;
        }

        for (const p of activeIosProviders) {
          if (p.slug && p.provider_name && !providerNames[p.slug]) providerNames[p.slug] = p.provider_name;
          if (p.slug && p.provider_id && !providerEditorIds[p.slug]) providerEditorIds[p.slug] = p.provider_id;
          if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
          if (p.slug && p.phone && !providerPhones[p.slug]) providerPhones[p.slug] = p.phone;
          // Also handle legacy provider_id as slug
          if (p.provider_id && p.provider_name && !providerNames[p.provider_id]) providerNames[p.provider_id] = p.provider_name;
        }

        // Lookup linked business_profiles via source_provider_id for claim status
        // This handles cases where question.provider_id = olera-providers.slug but the
        // claimed business_profiles has a different slug (linked via source_provider_id)
        const iosProviderIds = activeIosProviders
          .map((p) => p.provider_id)
          .filter((id): id is string => !!id);
        if (iosProviderIds.length > 0) {
          const { data: linkedBpProfiles } = await db
            .from("business_profiles")
            .select("slug, source_provider_id, email, phone, account_id, verification_state")
            .in("source_provider_id", iosProviderIds);
          // Build lookup from ios provider_id to bp data
          const bpBySourceId = new Map<string, typeof linkedBpProfiles extends (infer T)[] | null ? T : never>();
          for (const bp of linkedBpProfiles ?? []) {
            if (bp.source_provider_id) bpBySourceId.set(bp.source_provider_id, bp);
          }

          // For each ios provider, populate claim status from linked bp
          for (const ios of activeIosProviders) {
            if (ios.provider_id) {
              const linkedBp = bpBySourceId.get(ios.provider_id);
              if (linkedBp) {
                // Populate using ios.slug (if exists)
                if (ios.slug) {
                  providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                  if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                  if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                  providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
                }
                // Also populate using ios.provider_id (for legacy lookups where question.provider_id = alphanumeric ID)
                providerClaimStatus[ios.provider_id] = !!linkedBp.account_id;
                if (linkedBp.email && !providerEmails[ios.provider_id]) providerEmails[ios.provider_id] = linkedBp.email;
                if (linkedBp.phone && !providerPhones[ios.provider_id]) providerPhones[ios.provider_id] = linkedBp.phone;
                providerVerificationState[ios.provider_id] = (linkedBp.verification_state as string) || "unverified";
              }
            }
          }
        }

        // Strategy 4: reverse-match auto-generated slugs for providers with slug=null
        const finalMissing = missingSlugs.filter((s) => !providerNames[s]);
        if (finalMissing.length > 0) {
          // Collect matched provider_ids for batch claim status lookup
          const strategy4MatchedProviderIds: { slug: string; providerId: string }[] = [];

          // For each missing slug, extract a name prefix and search candidates
          for (const missingSlug of finalMissing) {
            const slugParts = missingSlug.split("-");
            const namePrefix = slugParts.slice(0, 3).join("-");
            const { data: candidates } = await db
              .from("olera-providers")
              .select("provider_id, provider_name, state, email, phone")
              .not("deleted", "is", true)
              .is("slug", null)
              .ilike("provider_name", `${namePrefix.replace(/-/g, "%")}%`)
              .limit(20);
            if (candidates) {
              for (const c of candidates) {
                const generatedSlug = generateProviderSlug(c.provider_name, c.state);
                if (generatedSlug === missingSlug) {
                  providerNames[missingSlug] = c.provider_name;
                  providerEditorIds[missingSlug] = c.provider_id;
                  // Also capture email/phone from Strategy 4 matches
                  if (c.email && !providerEmails[missingSlug]) providerEmails[missingSlug] = c.email;
                  if (c.phone && !providerPhones[missingSlug]) providerPhones[missingSlug] = c.phone;
                  // Track for batch claim status lookup
                  strategy4MatchedProviderIds.push({ slug: missingSlug, providerId: c.provider_id });
                  break;
                }
              }
            }
          }

          // Batch lookup claim status for Strategy 4 matches
          if (strategy4MatchedProviderIds.length > 0) {
            const providerIdsToLookup = strategy4MatchedProviderIds.map(m => m.providerId);
            const { data: linkedBpForStrategy4 } = await db
              .from("business_profiles")
              .select("source_provider_id, email, phone, account_id, verification_state")
              .in("source_provider_id", providerIdsToLookup);

            const bpBySourceIdStrategy4 = new Map<string, typeof linkedBpForStrategy4 extends (infer T)[] | null ? T : never>();
            for (const bp of linkedBpForStrategy4 ?? []) {
              if (bp.source_provider_id) bpBySourceIdStrategy4.set(bp.source_provider_id, bp);
            }

            // Populate claim status for Strategy 4 matches
            for (const { slug, providerId } of strategy4MatchedProviderIds) {
              const linkedBp = bpBySourceIdStrategy4.get(providerId);
              if (linkedBp) {
                providerClaimStatus[slug] = !!linkedBp.account_id;
                if (linkedBp.email && !providerEmails[slug]) providerEmails[slug] = linkedBp.email;
                if (linkedBp.phone && !providerPhones[slug]) providerPhones[slug] = linkedBp.phone;
                providerVerificationState[slug] = (linkedBp.verification_state as string) || "unverified";
              } else {
                // No linked BP means unclaimed
                providerClaimStatus[slug] = false;
              }
            }
          }
        }
      }
    }

    // Fetch provider-level archive info from archived_question_providers for all tabs
    // (archived providers may have old answered questions showing in other tabs)
    let providerArchiveInfo: Record<string, { reason: string | null; notes: string | null; archived_by: string | null; archived_at: string | null }> = {};
    if (slugs.length > 0) {
      const { data: archiveRecords } = await db
        .from("archived_question_providers")
        .select("provider_id, reason, notes, archived_by, archived_at")
        .in("provider_id", slugs);
      for (const rec of archiveRecords ?? []) {
        if (rec.provider_id) {
          providerArchiveInfo[rec.provider_id] = {
            reason: rec.reason,
            notes: rec.notes,
            archived_by: rec.archived_by,
            archived_at: rec.archived_at,
          };
        }
      }
    }

    // FINAL FALLBACK: For any slugs still missing claim status, do a direct lookup
    // This catches any providers that slipped through the earlier lookups
    const stillMissingClaimStatus = slugs.filter(s => providerClaimStatus[s] === undefined);
    if (stillMissingClaimStatus.length > 0) {
      // Query olera-providers for these slugs
      const { data: fallbackIos } = await db
        .from("olera-providers")
        .select("slug, provider_id, email, phone")
        .in("slug", stillMissingClaimStatus)
        .not("deleted", "is", true);

      if (fallbackIos && fallbackIos.length > 0) {
        // Get the provider_ids to lookup linked business_profiles
        const fallbackProviderIds = fallbackIos.map(p => p.provider_id).filter(Boolean) as string[];

        if (fallbackProviderIds.length > 0) {
          const { data: fallbackBps } = await db
            .from("business_profiles")
            .select("source_provider_id, email, phone, account_id, verification_state")
            .in("source_provider_id", fallbackProviderIds);

          // Build lookup map
          const fallbackBpBySourceId = new Map<string, typeof fallbackBps extends (infer T)[] | null ? T : never>();
          for (const bp of fallbackBps ?? []) {
            if (bp.source_provider_id) fallbackBpBySourceId.set(bp.source_provider_id, bp);
          }

          // Populate claim status and email
          for (const ios of fallbackIos) {
            if (ios.slug && ios.provider_id) {
              const linkedBp = fallbackBpBySourceId.get(ios.provider_id);
              if (linkedBp) {
                providerClaimStatus[ios.slug] = !!linkedBp.account_id;
                if (linkedBp.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = linkedBp.email;
                if (linkedBp.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = linkedBp.phone;
                providerVerificationState[ios.slug] = (linkedBp.verification_state as string) || "unverified";
              } else {
                // No linked BP - use iOS data
                if (ios.email && !providerEmails[ios.slug]) providerEmails[ios.slug] = ios.email;
                if (ios.phone && !providerPhones[ios.slug]) providerPhones[ios.slug] = ios.phone;
              }
            }
          }
        }
      }
    }

    // Fetch email history for question notifications sent to these providers
    const providerEmailHistory: Record<string, Array<{
      id: string;
      recipient: string | null;
      created_at: string;
      subject: string;
      delivered_at: string | null;
      first_opened_at: string | null;
      bounced_at: string | null;
      complained_at: string | null;
    }>> = {};

    const uniqueProviderIds = [...new Set((questions ?? []).map((q) => q.provider_id).filter(Boolean))];
    if (uniqueProviderIds.length > 0) {
      const { data: emailLogs } = await db
        .from("email_log")
        .select("id, provider_id, recipient, created_at, subject, delivered_at, first_opened_at, bounced_at, complained_at")
        .in("provider_id", uniqueProviderIds)
        .eq("email_type", "question_received")
        .eq("recipient_type", "provider")
        .order("created_at", { ascending: false })
        .limit(500);

      for (const log of emailLogs ?? []) {
        if (!log.provider_id) continue;
        if (!providerEmailHistory[log.provider_id]) {
          providerEmailHistory[log.provider_id] = [];
        }
        providerEmailHistory[log.provider_id].push({
          id: log.id,
          recipient: log.recipient,
          created_at: log.created_at,
          subject: log.subject,
          delivered_at: log.delivered_at,
          first_opened_at: log.first_opened_at,
          bounced_at: log.bounced_at,
          complained_at: log.complained_at,
        });
      }
    }

    const enriched = (questions ?? []).map((q) => ({
      ...q,
      provider_name: providerNames[q.provider_id] || humanizeProviderId(q.provider_id),
      provider_editor_id: providerEditorIds[q.provider_id] || null,
      provider_email: providerEmails[q.provider_id] || null,
      provider_phone: providerPhones[q.provider_id] || null,
      is_account_claimed: providerClaimStatus[q.provider_id] ?? false,
      verification_state: providerVerificationState[q.provider_id] || null,
      provider_archive_info: providerArchiveInfo[q.provider_id] || null,
      provider_email_history: providerEmailHistory[q.provider_id] || [],
    }));

    return NextResponse.json({
      questions: enriched,
      count: count ?? 0,
      tabCounts: await getTabCounts(dateFrom, dateTo),
    });
  } catch (err) {
    console.error("Admin questions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/questions
 *
 * Permanently delete all questions for a provider from the database.
 * Query param: ?provider_id=<provider_slug_or_id>
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch all questions for this provider for audit logging
    const { data: questions, error: fetchError } = await db
      .from("provider_questions")
      .select("id, provider_id, question, asker_name, status")
      .eq("provider_id", providerId);

    if (fetchError) {
      console.error("Failed to fetch questions for deletion:", fetchError);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this provider" }, { status: 404 });
    }

    // Delete all questions for this provider
    const { error: deleteError } = await db
      .from("provider_questions")
      .delete()
      .eq("provider_id", providerId);

    if (deleteError) {
      console.error("Failed to delete questions:", deleteError);
      return NextResponse.json({ error: "Failed to delete questions" }, { status: 500 });
    }

    // Proper admin audit logging
    await logAuditAction({
      adminUserId: admin.id,
      action: "delete_provider_questions",
      targetType: "provider_questions",
      targetId: providerId,
      details: {
        question_count: questions.length,
        question_ids: questions.map((q) => q.id),
        statuses: [...new Set(questions.map((q) => q.status))],
      },
    });

    return NextResponse.json({ success: true, deleted_count: questions.length, provider_id: providerId });
  } catch (err) {
    console.error("Admin questions DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/questions
 *
 * Update question status (approve, reject, flag) or add answer.
 * Body: { id, status?, answer?, is_public? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { id, status, answer, is_public, archive_reason } = body;

    if (!id) {
      return NextResponse.json({ error: "Question id required" }, { status: 400 });
    }

    const db = getServiceClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (is_public !== undefined) updates.is_public = is_public;

    // When archiving, store the reason in metadata
    if (status === "archived" && archive_reason) {
      const { data: existing } = await db.from("provider_questions").select("metadata").eq("id", id).single();
      const meta = (existing?.metadata || {}) as Record<string, unknown>;
      meta.archive_reason = archive_reason;
      meta.archived_at = new Date().toISOString();
      updates.metadata = meta;
      updates.is_public = false;
    }
    if (answer !== undefined) {
      updates.answer = answer;
      updates.answered_at = new Date().toISOString();
      updates.status = "answered";
      updates.is_public = true;
    }

    const { data, error } = await db
      .from("provider_questions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin question update error:", error);
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }

    // Fan a published answer out to every family who asked this canonical
    // topic. Database reservations make retries and competing publication
    // paths idempotent.
    if (answer && data?.id) {
      try {
        const providerSlug = data.provider_id || "";
        const { data: provider } = await db
          .from("business_profiles")
          .select("display_name")
          .eq("slug", providerSlug)
          .single();

        const notificationResult = await notifyQuestionAskers(db, {
          questionId: data.id,
          providerName: provider?.display_name || "The provider",
          providerSlug,
          question: data.question || "",
          answer,
        });
        if (notificationResult.errors.length > 0) {
          console.error("Answer notification errors:", notificationResult.errors);
        }
      } catch (emailErr) {
        console.error("Answer notification email failed:", emailErr);
      }
    }

    // Log provider-side activity when admin answers. Await the insert so the
    // event is not dropped when the serverless response finishes.
    if (answer && data?.provider_id) {
      const { error: actErr } = await db.from("provider_activity").insert({
        provider_id: data.provider_id,
        event_type: "question_responded",
        metadata: {
          question_id: id,
          question_preview: data.question?.substring(0, 100),
          answer_preview: answer.trim().substring(0, 100),
          asker_name: data.asker_name,
          answered_by_admin: true,
        },
      });
      if (actErr) console.error("[provider_activity] question_responded insert failed:", actErr);
    }

    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("Admin questions PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
