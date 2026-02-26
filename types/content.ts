/**
 * Content CMS types for articles managed via the admin dashboard.
 * Maps to the `content_articles` Supabase table.
 */

import { CareTypeId } from "./forum";
import { ResourceCategory } from "./resource";

export type ContentStatus = "draft" | "published" | "archived";

/**
 * Full article row from `content_articles`.
 */
export interface ContentArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content_json: Record<string, unknown>;
  content_html: string;
  cover_image_url: string | null;
  care_types: CareTypeId[];
  category: ResourceCategory;
  author_name: string;
  author_role: string;
  author_avatar: string | null;
  status: ContentStatus;
  featured: boolean;
  tags: string[];
  reading_time: string;
  // SEO
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  structured_data_type: string;
  focus_keyword: string | null;
  twitter_card_type: string;
  // Timestamps
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Lightweight shape returned by list endpoints (admin + public).
 */
export interface ContentArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  care_types: CareTypeId[];
  category: ResourceCategory;
  author_name: string;
  status: ContentStatus;
  featured: boolean;
  reading_time: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
