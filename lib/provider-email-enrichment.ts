/**
 * Finding an email for a provider that families are asking questions about.
 *
 * Shared by the manual batch script (scripts/enrich-outreach-emails.ts
 * --questions) and the weekly cron (app/api/cron/enrich-question-providers).
 * They MUST NOT drift: the original bug in this area was the script judging
 * ZeroBounce's raw verdict while the send path applied effectiveStatus(), which
 * silently discarded ~70% of real finds. One implementation, one gate.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findEmail,
  normalizeWebsite,
  discoverWebsiteByName,
  CostTracker,
  type ProviderContext,
} from "./medjobs/outreach-enrichment";
import { verifyAndCache, effectiveStatus } from "./email-verification";
import { sendDeferredNotificationsForProvider } from "./admin/send-deferred-notifications";

export interface EnrichTarget {
  slug: string;
  providerId: string;
  name: string | null;
  ctx: ProviderContext;
  /** No website AND no place_id: look the business up by name before scraping. */
  discover: boolean;
  /** Newest question on this provider — used to work fresh inflow first. */
  newestQuestionAt: string;
}

export interface EnrichOutcome {
  slug: string;
  found: boolean;
  source: "scrape" | "perplexity" | null;
  email: string | null;
  verdict: string | null;
  written: boolean;
  questionsSent: number;
  duplicatesSuppressed: number;
  error?: string;
}

/**
 * Providers holding an unanswered question that we cannot email.
 *
 * Ordered NEWEST QUESTION FIRST. The cron caps how many it attempts per run, so
 * this ordering means each run works the providers that just entered the cohort
 * (~10/day) rather than re-burning Perplexity credits on the long tail we
 * already tried and failed to find an address for.
 */
export async function collectQuestionTargets(
  db: SupabaseClient,
  opts: { days?: number; limit?: number } = {},
): Promise<{ targets: EnrichTarget[]; totalUnreachable: number }> {
  const days = opts.days ?? 30;
  const from = new Date(Date.now() - days * 86_400_000).toISOString();

  const newestBySlug = new Map<string, string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await db
      .from("provider_questions")
      .select("provider_id, created_at")
      .eq("status", "pending")
      .gte("created_at", from)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`provider_questions fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data as Array<{ provider_id: string | null; created_at: string }>) {
      if (!row.provider_id) continue;
      const prev = newestBySlug.get(row.provider_id);
      if (!prev || row.created_at > prev) newestBySlug.set(row.provider_id, row.created_at);
    }
    if (data.length < PAGE) break;
    offset += data.length;
  }

  const slugs = Array.from(newestBySlug.keys());
  const rows: Record<string, unknown>[] = [];
  const CHUNK = 200;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, email, website, place_id, city, state, deleted")
      .in("slug", slugs.slice(i, i + CHUNK));
    if (error) throw new Error(`olera-providers fetch: ${error.message}`);
    rows.push(...(data ?? []));
  }

  const unreachable = rows.filter(
    (r) => !r.deleted && !(typeof r.email === "string" && r.email.trim().length > 0),
  );

  const targets: EnrichTarget[] = unreachable
    .map((r) => {
      const slug = r.slug as string;
      const website = normalizeWebsite(r.website as string);
      return {
        slug,
        providerId: r.provider_id as string,
        name: (r.provider_name as string) || null,
        discover: !website && !r.place_id,
        newestQuestionAt: newestBySlug.get(slug) ?? "",
        ctx: {
          name: (r.provider_name as string) || null,
          website,
          place_id: (r.place_id as string) || null,
          city: (r.city as string) || null,
          state: (r.state as string) || null,
        },
      };
    })
    .sort((a, b) => b.newestQuestionAt.localeCompare(a.newestQuestionAt));

  return {
    targets: opts.limit ? targets.slice(0, opts.limit) : targets,
    totalUnreachable: unreachable.length,
  };
}

/**
 * Find, verify, write, and flush the questions that were held because the
 * column was empty. Never throws — a failure on one provider must not abort a
 * batch — so callers read `error` off the outcome.
 */
export async function enrichOneTarget(
  db: SupabaseClient,
  target: EnrichTarget,
  opts: { cost?: CostTracker; verify?: boolean; notify?: boolean; maxQuestions?: number } = {},
): Promise<EnrichOutcome> {
  const { cost, verify = true, notify = true, maxQuestions = 2 } = opts;
  const out: EnrichOutcome = {
    slug: target.slug,
    found: false,
    source: null,
    email: null,
    verdict: null,
    written: false,
    questionsSent: 0,
    duplicatesSuppressed: 0,
  };

  try {
    let ctx = target.ctx;
    if (target.discover) {
      const found = await discoverWebsiteByName(ctx.name, ctx.city, ctx.state, cost);
      ctx = { ...ctx, website: found.website, place_id: found.placeId };
    }

    const res = await findEmail(ctx, cost);
    if (!res.email) return out;
    out.found = true;
    out.source = res.source;
    out.email = res.email;

    if (verify) {
      const raw = await verifyAndCache(res.email);
      // effectiveStatus, NOT the raw verdict. ZeroBounce reports deliverable
      // role addresses (info@, admissions@) as invalid; those are most of what a
      // provider site publishes, and the send path accepts them.
      const status = effectiveStatus(raw.status, raw.subStatus);
      out.verdict = `${status}${raw.subStatus ? `/${raw.subStatus}` : ""}`;
      if (status === "invalid") return out;
    }

    const { error: writeErr } = await db
      .from("olera-providers")
      .update({ email: res.email })
      .eq("slug", target.slug);
    if (writeErr) throw new Error(`write ${target.slug}: ${writeErr.message}`);
    // Keep a claimed account's address in step, the way the admin directory
    // edit does — but never clobber one that already resolved.
    await db
      .from("business_profiles")
      .update({ email: res.email })
      .eq("source_provider_id", target.providerId)
      .is("email", null);
    out.written = true;

    if (notify) {
      const { data: bp } = await db
        .from("business_profiles")
        .select("id, slug, metadata")
        .eq("source_provider_id", target.providerId)
        .limit(1)
        .maybeSingle();
      const meta = ((bp?.metadata as Record<string, unknown>) || {});
      const providerSlug = (bp?.slug as string) || target.slug;
      const variants = [target.slug, target.providerId].filter(
        (v) => v && v !== providerSlug,
      ) as string[];
      const sent = await sendDeferredNotificationsForProvider({
        profileId: (bp?.id as string) || "",
        email: res.email,
        providerName: target.name || "Provider",
        providerSlug,
        additionalSlugVariants: variants,
        leadsUnsubscribed: !!meta.leads_unsubscribed,
        maxQuestions,
      });
      out.questionsSent = sent.questionEmailsSent;
      out.duplicatesSuppressed = sent.questionDuplicatesSuppressed;
    }
  } catch (err) {
    out.error = (err as Error).message;
  }
  return out;
}
