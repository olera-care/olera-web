import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { questionAnsweredEmail } from "@/lib/email-templates";
import { generateProviderSlug } from "@/lib/slugify";

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
    const needsEmail = searchParams.get("needs_email") === "true"; // No email on file
    const deliveryIssues = searchParams.get("delivery_issues") === "true"; // Has email but bounced
    const countOnly = searchParams.get("count_only") === "true";
    const grouped = searchParams.get("grouped") === "true"; // Group questions by provider
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const dateFrom = searchParams.get("date_from"); // ISO date string (inclusive)
    const dateTo = searchParams.get("date_to"); // ISO date string (exclusive — next day)
    const search = searchParams.get("search")?.trim() || "";

    const db = getServiceClient();

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
      if (needsEmail) {
        let countQuery = db
          .from("provider_questions")
          .select("provider_id, metadata")
          .contains("metadata", { needs_provider_email: true })
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

        // Look up providers in business_profiles
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, email, is_active")
          .in("slug", providerIds);

        // Look up providers in olera-providers (legacy)
        const { data: oleraProviders } = await db
          .from("olera-providers")
          .select("slug, email")
          .in("slug", providerIds)
          .not("deleted", "is", true);

        // Build provider status map
        const providerStatus = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean }>();
        for (const id of providerIds) {
          providerStatus.set(id, { exists: false, hasEmail: false, isArchived: false });
        }
        for (const p of bpProviders ?? []) {
          if (p.slug) {
            providerStatus.set(p.slug, { exists: true, hasEmail: !!p.email, isArchived: p.is_active === false });
          }
        }
        for (const p of oleraProviders ?? []) {
          if (p.slug && !providerStatus.get(p.slug)?.exists) {
            providerStatus.set(p.slug, { exists: true, hasEmail: !!p.email, isArchived: false });
          }
        }

        // Count only questions where provider exists, not archived, and has no
        // USABLE email — either none on file, or one verified undeliverable
        // (email_dead, set when the send path suppressed it).
        const validCount = (questionsForCount ?? []).filter((q) => {
          const status = providerStatus.get(q.provider_id);
          const emailDead = (q.metadata as Record<string, unknown> | null)?.email_dead === true;
          return status?.exists && !status.isArchived && (!status.hasEmail || emailDead);
        }).length;

        return NextResponse.json({ count: validCount });
      }

      // Standard count query for non-needs_email filters
      let countQuery = db.from("provider_questions").select("*", { count: "exact", head: true });
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

    // For needs_email or delivery_issues, we need to verify provider status before pagination
    // to ensure count and results match
    if (needsEmail || deliveryIssues) {
      let needsEmailQuery = db
        .from("provider_questions")
        .select("*")
        .contains("metadata", { needs_provider_email: true })
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

      // Look up providers in business_profiles
      const { data: bpProvidersForFilter } = await db
        .from("business_profiles")
        .select("slug, email, is_active")
        .in("slug", providerIds);

      // Look up providers in olera-providers (legacy)
      const { data: oleraProvidersForFilter } = await db
        .from("olera-providers")
        .select("slug, email")
        .in("slug", providerIds)
        .not("deleted", "is", true);

      // Build provider status map
      const providerStatusMap = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean }>();
      for (const id of providerIds) {
        providerStatusMap.set(id, { exists: false, hasEmail: false, isArchived: false });
      }
      for (const p of bpProvidersForFilter ?? []) {
        if (p.slug) {
          providerStatusMap.set(p.slug, { exists: true, hasEmail: !!p.email, isArchived: p.is_active === false });
        }
      }
      for (const p of oleraProvidersForFilter ?? []) {
        if (p.slug && !providerStatusMap.get(p.slug)?.exists) {
          providerStatusMap.set(p.slug, { exists: true, hasEmail: !!p.email, isArchived: false });
        }
      }

      // Filter based on tab:
      // - needs_email: provider has NO email on file
      // - delivery_issues: provider HAS email but it bounced (email_dead)
      const validQuestions = (allNeedsEmailQuestions ?? []).filter((q) => {
        const pStatus = providerStatusMap.get(q.provider_id);
        const emailDead = (q.metadata as Record<string, unknown> | null)?.email_dead === true;
        if (!pStatus?.exists || pStatus.isArchived) return false;

        if (deliveryIssues) {
          // Delivery Issues tab: provider has email but it bounced
          return pStatus.hasEmail && emailDead;
        } else {
          // No Email tab: provider has no email
          return !pStatus.hasEmail;
        }
      });

      // Apply pagination manually
      const questions = validQuestions.slice(offset, offset + limit);
      const count = validQuestions.length;

      // Continue to enrichment below with these filtered questions
      // (fall through to the enrichment code)
      const slugs = [...new Set(questions.map((q) => q.provider_id).filter(Boolean))];
      let providerNames: Record<string, string> = {};
      let providerEditorIds: Record<string, string> = {};
      let providerEmails: Record<string, string> = {};
      if (slugs.length > 0) {
        // Try business_profiles first
        const { data: bpProviders } = await db
          .from("business_profiles")
          .select("slug, display_name, source_provider_id, email")
          .in("slug", slugs);
        providerNames = Object.fromEntries(
          (bpProviders ?? []).map((p) => [p.slug, p.display_name])
        );
        providerEditorIds = Object.fromEntries(
          (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
        );
        for (const p of bpProviders ?? []) {
          if (p.slug && p.email) providerEmails[p.slug] = p.email;
        }

        // For slugs not found in business_profiles, try olera-providers
        const missingSlugs = slugs.filter((s) => !providerNames[s]);
        if (missingSlugs.length > 0) {
          const { data: iosProviders } = await db
            .from("olera-providers")
            .select("slug, provider_id, provider_name, email")
            .in("slug", missingSlugs)
            .not("deleted", "is", true);
          for (const p of iosProviders ?? []) {
            if (p.slug && p.provider_name) providerNames[p.slug] = p.provider_name;
            if (p.slug && p.provider_id) providerEditorIds[p.slug] = p.provider_id;
            if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
          }
        }
      }

      const enriched = questions.map((q) => ({
        ...q,
        provider_name: providerNames[q.provider_id] || null,
        provider_editor_id: providerEditorIds[q.provider_id] || null,
        provider_email: providerEmails[q.provider_id] || null,
      }));

      // Calculate accurate tab counts by checking provider email status
      // We need to count no_email vs delivery_issues separately
      const allQuestionsForCounts = (allNeedsEmailQuestions ?? []);
      let noEmailCount = 0;
      let deliveryIssuesCount = 0;

      for (const q of allQuestionsForCounts) {
        const pStatus = providerStatusMap.get(q.provider_id);
        const emailDead = (q.metadata as Record<string, unknown> | null)?.email_dead === true;
        if (!pStatus?.exists || pStatus.isArchived) continue;

        if (pStatus.hasEmail && emailDead) {
          deliveryIssuesCount++;
        } else if (!pStatus.hasEmail) {
          noEmailCount++;
        }
      }

      // Fetch other tab counts
      const [pendingCountNE, archivedCountNE] = await Promise.all([
        db.from("provider_questions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("provider_questions").select("*", { count: "exact", head: true }).eq("status", "archived"),
      ]);

      const tabCountsNE = {
        pending: pendingCountNE.count ?? 0,
        no_email: noEmailCount,
        delivery_issues: deliveryIssuesCount,
        archived: archivedCountNE.count ?? 0,
      };

      // If grouped mode, transform flat list into provider-grouped structure
      if (grouped) {
        // Fetch additional provider metadata for grouping
        const providerSlugsForMeta = [...new Set(enriched.map((q) => q.provider_id).filter(Boolean))];
        const providerMetadata: Record<string, {
          phone: string | null;
          isAccountClaimed: boolean;
          verificationState: string | null;
          isArchived: boolean;
        }> = {};

        if (providerSlugsForMeta.length > 0) {
          const { data: bpMeta } = await db
            .from("business_profiles")
            .select("slug, phone, account_id, is_active, metadata")
            .in("slug", providerSlugsForMeta);

          for (const p of bpMeta ?? []) {
            if (p.slug) {
              const meta = (p.metadata as Record<string, unknown>) || {};
              providerMetadata[p.slug] = {
                phone: p.phone || null,
                isAccountClaimed: !!p.account_id,
                verificationState: (meta.verification_state as string) || null,
                isArchived: p.is_active === false || meta.admin_archived === true,
              };
            }
          }
        }

        // Group questions by provider
        const providerGroups: Record<string, {
          provider: {
            id: string;
            name: string | null;
            slug: string;
            email: string | null;
            phone: string | null;
            editorId: string | null;
            isAccountClaimed: boolean;
            verificationState: string | null;
            isArchived: boolean;
          };
          stats: {
            total: number;
            needsEmail: number;
            pending: number;
            answered: number;
            archived: number;
          };
          questions: typeof enriched;
        }> = {};

        for (const q of enriched) {
          const pid = q.provider_id;
          if (!pid) continue;

          if (!providerGroups[pid]) {
            const meta = providerMetadata[pid] || {
              phone: null,
              isAccountClaimed: false,
              verificationState: null,
              isArchived: false,
            };
            providerGroups[pid] = {
              provider: {
                id: pid,
                name: q.provider_name || null,
                slug: pid,
                email: q.provider_email || null,
                phone: meta.phone,
                editorId: q.provider_editor_id || null,
                isAccountClaimed: meta.isAccountClaimed,
                verificationState: meta.verificationState,
                isArchived: meta.isArchived,
              },
              stats: { total: 0, needsEmail: 0, pending: 0, answered: 0, archived: 0 },
              questions: [],
            };
          }

          providerGroups[pid].questions.push(q);
          providerGroups[pid].stats.total++;

          // Update stats based on question properties
          const qMeta = (q.metadata as Record<string, unknown>) || {};
          // Count questions needing email attention (no email OR dead/bounced email)
          if (qMeta.needs_provider_email || qMeta.email_dead) providerGroups[pid].stats.needsEmail++;
          if (q.status === "pending" || q.status === "approved") providerGroups[pid].stats.pending++;
          if (q.status === "answered") providerGroups[pid].stats.answered++;
          if (q.status === "archived") providerGroups[pid].stats.archived++;
        }

        // Convert to array and sort by total questions descending
        const providers = Object.values(providerGroups).sort((a, b) => b.stats.total - a.stats.total);

        return NextResponse.json({
          providers,
          totalProviders: providers.length,
          totalQuestions: count,
          tabCounts: tabCountsNE,
        });
      }

      return NextResponse.json({ questions: enriched, count, tabCounts: tabCountsNE });
    }

    // Standard query path (non-needs_email)
    let query = db
      .from("provider_questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (providerId) query = query.eq("provider_id", providerId);
    if (searchSlugs) {
      if (searchSlugs.length === 0) return NextResponse.json({ questions: [], count: 0 });
      query = query.in("provider_id", searchSlugs);
    }
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lt("created_at", dateTo);

    const { data: questions, count, error } = await query;

    if (error) {
      console.error("Admin questions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Enrich with provider display names
    const slugs = [...new Set((questions ?? []).map((q) => q.provider_id).filter(Boolean))];
    let providerNames: Record<string, string> = {};
    let providerEditorIds: Record<string, string> = {};
    let providerEmails: Record<string, string> = {};
    if (slugs.length > 0) {
      // Try business_profiles first
      const { data: bpProviders } = await db
        .from("business_profiles")
        .select("slug, display_name, source_provider_id, email")
        .in("slug", slugs);
      providerNames = Object.fromEntries(
        (bpProviders ?? []).map((p) => [p.slug, p.display_name])
      );
      providerEditorIds = Object.fromEntries(
        (bpProviders ?? []).filter((p) => p.source_provider_id).map((p) => [p.slug, p.source_provider_id])
      );
      for (const p of bpProviders ?? []) {
        if (p.slug && p.email) providerEmails[p.slug] = p.email;
      }

      // For slugs not found in business_profiles, try olera-providers
      const missingSlugs = slugs.filter((s) => !providerNames[s]);
      if (missingSlugs.length > 0) {
        const { data: iosProviders } = await db
          .from("olera-providers")
          .select("slug, provider_id, provider_name, email")
          .in("slug", missingSlugs)
          .not("deleted", "is", true);
        for (const p of iosProviders ?? []) {
          if (p.slug && p.provider_name) providerNames[p.slug] = p.provider_name;
          if (p.slug && p.provider_id) providerEditorIds[p.slug] = p.provider_id;
          if (p.slug && p.email && !providerEmails[p.slug]) providerEmails[p.slug] = p.email;
        }

        // Also try by provider_id for legacy slugs
        const stillMissing = missingSlugs.filter((s) => !providerNames[s]);
        if (stillMissing.length > 0) {
          const { data: legacyProviders } = await db
            .from("olera-providers")
            .select("provider_id, provider_name")
            .in("provider_id", stillMissing)
            .not("deleted", "is", true);
          for (const p of legacyProviders ?? []) {
            if (p.provider_id && p.provider_name) providerNames[p.provider_id] = p.provider_name;
          }
        }

        // Strategy 4: reverse-match auto-generated slugs for providers with slug=null
        const finalMissing = missingSlugs.filter((s) => !providerNames[s]);
        if (finalMissing.length > 0) {
          // For each missing slug, extract a name prefix and search candidates
          for (const missingSlug of finalMissing) {
            const slugParts = missingSlug.split("-");
            const namePrefix = slugParts.slice(0, 3).join("-");
            const { data: candidates } = await db
              .from("olera-providers")
              .select("provider_id, provider_name, state")
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
                  break;
                }
              }
            }
          }
        }
      }
    }

    const enriched = (questions ?? []).map((q) => ({
      ...q,
      provider_name: providerNames[q.provider_id] || null,
      provider_editor_id: providerEditorIds[q.provider_id] || null,
      provider_email: providerEmails[q.provider_id] || null,
    }));

    // Fetch tab counts - need accurate no_email vs delivery_issues split
    const [pendingCount, archivedCount, needsEmailQuestions] = await Promise.all([
      db.from("provider_questions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      db.from("provider_questions").select("*", { count: "exact", head: true }).eq("status", "archived"),
      db.from("provider_questions")
        .select("provider_id, metadata")
        .contains("metadata", { needs_provider_email: true })
        .neq("status", "archived")
        .neq("status", "rejected")
        .limit(10000),
    ]);

    // Calculate accurate no_email vs delivery_issues counts
    let noEmailCount = 0;
    let deliveryIssuesCount = 0;

    if (needsEmailQuestions.data && needsEmailQuestions.data.length > 0) {
      const providerIdsForCount = [...new Set(needsEmailQuestions.data.map((q) => q.provider_id).filter(Boolean))];

      // Look up provider email status
      const [{ data: bpForCount }, { data: oleraForCount }] = await Promise.all([
        db.from("business_profiles").select("slug, email, is_active").in("slug", providerIdsForCount),
        db.from("olera-providers").select("slug, email").in("slug", providerIdsForCount).not("deleted", "is", true),
      ]);

      const providerEmailStatus = new Map<string, { hasEmail: boolean; isArchived: boolean }>();
      for (const id of providerIdsForCount) {
        providerEmailStatus.set(id, { hasEmail: false, isArchived: false });
      }
      for (const p of bpForCount ?? []) {
        if (p.slug) providerEmailStatus.set(p.slug, { hasEmail: !!p.email, isArchived: p.is_active === false });
      }
      for (const p of oleraForCount ?? []) {
        if (p.slug && !providerEmailStatus.get(p.slug)?.hasEmail) {
          const existing = providerEmailStatus.get(p.slug);
          providerEmailStatus.set(p.slug, { hasEmail: !!p.email, isArchived: existing?.isArchived ?? false });
        }
      }

      for (const q of needsEmailQuestions.data) {
        const status = providerEmailStatus.get(q.provider_id);
        if (!status || status.isArchived) continue;
        const emailDead = (q.metadata as Record<string, unknown> | null)?.email_dead === true;

        if (status.hasEmail && emailDead) {
          deliveryIssuesCount++;
        } else if (!status.hasEmail) {
          noEmailCount++;
        }
      }
    }

    const tabCounts = {
      pending: pendingCount.count ?? 0,
      no_email: noEmailCount,
      delivery_issues: deliveryIssuesCount,
      archived: archivedCount.count ?? 0,
    };

    // If grouped mode, transform flat list into provider-grouped structure
    if (grouped) {
      // Fetch additional provider metadata for grouping
      const providerSlugsForMeta = [...new Set(enriched.map((q) => q.provider_id).filter(Boolean))];
      const providerMetadata: Record<string, {
        phone: string | null;
        isAccountClaimed: boolean;
        verificationState: string | null;
        isArchived: boolean;
      }> = {};

      if (providerSlugsForMeta.length > 0) {
        const { data: bpMeta } = await db
          .from("business_profiles")
          .select("slug, phone, account_id, is_active, metadata")
          .in("slug", providerSlugsForMeta);

        for (const p of bpMeta ?? []) {
          if (p.slug) {
            const meta = (p.metadata as Record<string, unknown>) || {};
            providerMetadata[p.slug] = {
              phone: p.phone || null,
              isAccountClaimed: !!p.account_id,
              verificationState: (meta.verification_state as string) || null,
              isArchived: p.is_active === false || meta.admin_archived === true,
            };
          }
        }
      }

      // Group questions by provider
      const providerGroups: Record<string, {
        provider: {
          id: string;
          name: string | null;
          slug: string;
          email: string | null;
          phone: string | null;
          editorId: string | null;
          isAccountClaimed: boolean;
          verificationState: string | null;
          isArchived: boolean;
        };
        stats: {
          total: number;
          needsEmail: number;
          pending: number;
          answered: number;
          archived: number;
        };
        questions: typeof enriched;
      }> = {};

      for (const q of enriched) {
        const pid = q.provider_id;
        if (!pid) continue;

        if (!providerGroups[pid]) {
          const meta = providerMetadata[pid] || {
            phone: null,
            isAccountClaimed: false,
            verificationState: null,
            isArchived: false,
          };
          providerGroups[pid] = {
            provider: {
              id: pid,
              name: q.provider_name || null,
              slug: pid,
              email: q.provider_email || null,
              phone: meta.phone,
              editorId: q.provider_editor_id || null,
              isAccountClaimed: meta.isAccountClaimed,
              verificationState: meta.verificationState,
              isArchived: meta.isArchived,
            },
            stats: { total: 0, needsEmail: 0, pending: 0, answered: 0, archived: 0 },
            questions: [],
          };
        }

        providerGroups[pid].questions.push(q);
        providerGroups[pid].stats.total++;

        // Update stats based on question properties
        const qMeta = (q.metadata as Record<string, unknown>) || {};
        // Count questions needing email attention (no email OR dead/bounced email)
        if (qMeta.needs_provider_email || qMeta.email_dead) providerGroups[pid].stats.needsEmail++;
        if (q.status === "pending" || q.status === "approved") providerGroups[pid].stats.pending++;
        if (q.status === "answered") providerGroups[pid].stats.answered++;
        if (q.status === "archived") providerGroups[pid].stats.archived++;
      }

      // Convert to array and sort by total questions descending
      const providers = Object.values(providerGroups).sort((a, b) => b.stats.total - a.stats.total);

      return NextResponse.json({
        providers,
        totalProviders: providers.length,
        totalQuestions: count ?? 0,
        tabCounts,
      });
    }

    // Standard flat response
    return NextResponse.json({
      questions: enriched,
      count: count ?? 0,
      tabCounts,
    });
  } catch (err) {
    console.error("Admin questions error:", err);
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

    // Email the asker when their question is answered (fire-and-forget)
    if (answer && data?.asker_email) {
      try {
        const providerSlug = data.provider_id || "";
        const { data: provider } = await db
          .from("business_profiles")
          .select("display_name")
          .eq("slug", providerSlug)
          .single();

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
        await sendEmail({
          to: data.asker_email,
          subject: `${provider?.display_name || "A provider"} answered your question on Olera`,
          html: questionAnsweredEmail({
            askerName: data.asker_name || "there",
            providerName: provider?.display_name || "The provider",
            question: data.question,
            answer,
            providerUrl: `${siteUrl}/provider/${providerSlug}`,
          }),
          emailType: "question_answered",
          recipientType: "family",
          providerId: providerSlug,
        });
      } catch (emailErr) {
        console.error("Answer notification email failed:", emailErr);
      }
    }

    // Log provider-side activity when admin answers (fire-and-forget)
    if (answer && data?.provider_id) {
      db.from("provider_activity").insert({
        provider_id: data.provider_id,
        event_type: "question_responded",
        metadata: {
          question_id: id,
          question_preview: data.question?.substring(0, 100),
          answer_preview: answer.trim().substring(0, 100),
          asker_name: data.asker_name,
          answered_by_admin: true,
        },
      }).then(({ error: actErr }: { error: { message: string } | null }) => {
        if (actErr) console.error("[provider_activity] question_responded insert failed:", actErr);
      });
    }

    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("Admin questions PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
