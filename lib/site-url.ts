/**
 * Get the correct site URL based on the current environment.
 *
 * This is critical for magic links and email URLs to work correctly:
 * - Production: Uses NEXT_PUBLIC_SITE_URL (olera.care)
 * - Staging: Uses staging URL
 * - Preview deployments: Uses VERCEL_URL (the preview deployment URL)
 *
 * Vercel provides these environment variables:
 * - VERCEL_URL: The deployment URL without protocol (e.g., olera-web-git-feature-123.vercel.app)
 * - VERCEL_ENV: The environment (development, preview, production)
 */
export function getSiteUrl(): string {
  // First priority: explicit NEXT_PUBLIC_SITE_URL (used in production)
  // But only use it if we're actually in production environment
  const vercelEnv = process.env.VERCEL_ENV;
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;

  console.log("[getSiteUrl] VERCEL_ENV:", vercelEnv);
  console.log("[getSiteUrl] VERCEL_URL:", vercelUrl);
  console.log("[getSiteUrl] NEXT_PUBLIC_SITE_URL:", explicitUrl);

  // In production, always use the explicit URL
  if (vercelEnv === "production" && explicitUrl) {
    console.log("[getSiteUrl] Using production URL:", explicitUrl);
    return explicitUrl;
  }

  // In preview/staging, use the VERCEL_URL if available
  // This ensures magic links redirect to the correct preview deployment
  if (vercelUrl) {
    const url = `https://${vercelUrl}`;
    console.log("[getSiteUrl] Using VERCEL_URL:", url);
    return url;
  }

  // Fallback: use explicit URL or default
  const fallback = explicitUrl || "https://olera.care";
  console.log("[getSiteUrl] Using fallback:", fallback);
  return fallback;
}
