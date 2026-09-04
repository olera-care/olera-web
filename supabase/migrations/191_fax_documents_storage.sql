-- Migration: Create fax-documents storage bucket
--
-- Used by the send-fax API to upload fax HTML content that Telnyx
-- can fetch without being blocked by Vercel's Attack Challenge Mode.
--
-- Files are named: fax-{provider_id}-{timestamp}.html
-- Public access is required so Telnyx can fetch the content.

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fax-documents',
  'fax-documents',
  true,  -- Public bucket so Telnyx can access
  1048576,  -- 1MB limit (fax HTML is small)
  ARRAY['text/html']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to upload (API routes use service role key)
-- Public read is automatic since bucket is public

COMMENT ON TABLE storage.buckets IS 'Storage buckets including fax-documents for Telnyx fax content';
