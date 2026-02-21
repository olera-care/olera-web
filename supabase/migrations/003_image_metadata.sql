-- ============================================================
-- Provider Image Metadata + Hero Image Selection
-- ============================================================

-- provider_image_metadata: per-image classification and quality scores
CREATE TABLE provider_image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  source_field TEXT NOT NULL CHECK (source_field IN ('provider_logo', 'provider_images')),
  image_type TEXT NOT NULL DEFAULT 'unknown' CHECK (image_type IN ('logo', 'photo', 'unknown')),
  classification_method TEXT,
  classification_confidence REAL DEFAULT 0.0,
  quality_score REAL DEFAULT 0.0 CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  width INT,
  height INT,
  file_size_bytes INT,
  content_type TEXT,
  is_accessible BOOLEAN DEFAULT TRUE,
  is_hero BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, image_url)
);

-- Indexes
CREATE INDEX idx_pim_provider_id ON provider_image_metadata(provider_id);
CREATE INDEX idx_pim_hero ON provider_image_metadata(provider_id) WHERE is_hero = TRUE;
CREATE INDEX idx_pim_image_type ON provider_image_metadata(image_type);

-- RLS: public read, service-role write
ALTER TABLE provider_image_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pim_public_read"
  ON provider_image_metadata FOR SELECT
  USING (TRUE);

-- Add hero_image_url to olera-providers (additive, nullable — safe for iOS)
ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
