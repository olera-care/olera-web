/**
 * Get the correct site URL based on the current environment.
 *
 * Critical for magic links and email URLs to work correctly:
 * - Production: Uses NEXT_PUBLIC_SITE_URL (olera.care)
 * - Staging: Uses staging URL
 * - Preview deployments: Uses VERCEL_URL (the preview deployment URL)
 *
 * Vercel provides these environment variables:
 * - VERCEL_URL: The deployment URL without protocol (e.g., olera-web-git-feature-123.vercel.app)
 * - VERCEL_ENV: The environment (development, preview, production)
 */
export function getSiteUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL;

  // In production, always use the explicit URL
  if (vercelEnv === "production" && explicitUrl) {
    return explicitUrl;
  }

  // In preview/staging, use the VERCEL_URL if available
  // This ensures magic links redirect to the correct preview deployment
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  // Fallback: use explicit URL or default
  return explicitUrl || "https://olera.care";
}
