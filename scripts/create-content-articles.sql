-- ============================================================
-- content_articles table — Supabase CMS for Olera Web
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE content_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  excerpt text DEFAULT '',
  content_json jsonb DEFAULT '{}',
  content_html text DEFAULT '',
  cover_image_url text,
  care_types text[] DEFAULT '{}',
  category text NOT NULL DEFAULT 'guide',
  author_name text NOT NULL DEFAULT 'Olera Team',
  author_role text DEFAULT '',
  author_avatar text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  reading_time text DEFAULT '5 min',
  -- SEO fields
  meta_title text,
  meta_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_url text,
  noindex boolean DEFAULT false,
  structured_data_type text DEFAULT 'Article',
  focus_keyword text,
  twitter_card_type text DEFAULT 'summary_large_image',
  -- Timestamps
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes for common queries
CREATE INDEX idx_content_articles_status ON content_articles(status);
CREATE INDEX idx_content_articles_slug ON content_articles(slug);
CREATE INDEX idx_content_articles_published_at ON content_articles(published_at DESC);
CREATE INDEX idx_content_articles_category ON content_articles(category);
CREATE INDEX idx_content_articles_care_types ON content_articles USING GIN(care_types);

-- RLS: Public can read published articles, service role can do everything
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles"
  ON content_articles
  FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL);

CREATE POLICY "Service role has full access"
  ON content_articles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_content_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_articles_updated_at
  BEFORE UPDATE ON content_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_content_articles_updated_at();
