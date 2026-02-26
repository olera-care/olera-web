import { createClient } from "@/lib/supabase/server";
import type { ContentArticle } from "@/types/content";

/**
 * Fetch published articles with optional care type filter.
 * Server-side only — uses the anon client (RLS enforced).
 */
export async function getPublishedArticles(opts?: {
  careType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: ContentArticle[]; total: number }> {
  const supabase = await createClient();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from("content_articles")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .not("published_at", "is", null);

  if (opts?.careType) {
    query = query.contains("care_types", [opts.careType]);
  }

  query = query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("getPublishedArticles error:", error);
    return { articles: [], total: 0 };
  }

  return { articles: (data ?? []) as ContentArticle[], total: count ?? 0 };
}

/**
 * Fetch a single published article by slug.
 * Returns null if not found or not published.
 */
export async function getArticleBySlug(slug: string): Promise<ContentArticle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  return data as ContentArticle;
}

/**
 * Fetch related articles (same care type, excluding current).
 */
export async function getRelatedArticles(
  articleId: string,
  careTypes: string[],
  limit = 3
): Promise<ContentArticle[]> {
  if (careTypes.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_articles")
    .select("*")
    .eq("status", "published")
    .not("published_at", "is", null)
    .neq("id", articleId)
    .contains("care_types", [careTypes[0]])
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedArticles error:", error);
    return [];
  }

  return (data ?? []) as ContentArticle[];
}
