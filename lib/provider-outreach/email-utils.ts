/**
 * Provider Outreach Email Utilities
 *
 * Handles email rendering, variable substitution, and signature composition
 * for provider outreach emails.
 *
 * Reuses the body → HTML markdown conversion from student-outreach
 * but with provider-specific signatures and footers.
 */

import { bodyToHtml } from "../student-outreach/email-markdown";
import {
  type TemplateContext,
  type ProviderOutreachTemplateKey,
  getTemplate,
  substituteVars,
  buildVars,
  composeFooterHtml,
  composeFooterPlainText,
} from "./templates";
import {
  generateClaimUrl,
  generateProviderPortalUrl,
} from "../claim-tokens";

/**
 * Re-export bodyToHtml for convenience
 */
export { bodyToHtml };

/**
 * Rendered email ready for sending
 */
export interface RenderedEmail {
  subject: string;
  preheader?: string;
  html: string;
  text: string;
}

/**
 * Render a provider outreach email with full HTML and plain text versions.
 *
 * @param templateKey - Which template to use (intro, followup, final)
 * @param context - Provider context for variable substitution
 * @returns Rendered email with subject, HTML body, and plain text body
 */
export function renderEmail(
  templateKey: ProviderOutreachTemplateKey,
  context: TemplateContext
): RenderedEmail {
  // Get the template
  const template = getTemplate(templateKey, context);

  // Build substitution variables
  const vars = buildVars(context);

  // Substitute variables in subject, preheader, and body
  const subject = substituteVars(template.subject, vars);
  const preheader = template.preheader ? substituteVars(template.preheader, vars) : undefined;
  const body = substituteVars(template.body, vars);

  // Convert body to HTML and append footer
  const html = bodyToHtml(body) + composeFooterHtml(vars);

  // Build plain text version
  const text = body + composeFooterPlainText(vars);

  return { subject, preheader, html, text };
}

/**
 * Preview an email without sending.
 * Returns the rendered email plus metadata for admin review.
 *
 * @param templateKey - Which template to use
 * @param context - Provider context
 * @returns Rendered email plus preview metadata
 */
export function previewEmail(
  templateKey: ProviderOutreachTemplateKey,
  context: TemplateContext
): RenderedEmail & {
  templateKey: ProviderOutreachTemplateKey;
  context: TemplateContext;
  rawBody: string;
} {
  const rendered = renderEmail(templateKey, context);
  const template = getTemplate(templateKey, context);
  const vars = buildVars(context);
  const rawBody = substituteVars(template.body, vars);

  return {
    ...rendered,
    templateKey,
    context,
    rawBody,
  };
}

/**
 * Default mailing address for CAN-SPAM compliance
 */
const DEFAULT_MAILING_ADDRESS = "340 S Lemon Ave #1439, Walnut, CA 91789";

/**
 * Build the context object from provider data.
 * Used to transform raw provider data into the template context format.
 *
 * IMPORTANT: The `email` field is required to generate magic link tokens.
 * Without it, the claim/manage URLs won't auto-authenticate the provider.
 *
 * @param provider - Provider data from olera-providers table (must include email for magic links)
 * @param options - Optional overrides for URLs and ranking data
 */
export function buildContextFromProvider(
  provider: {
    provider_id: string;
    name: string;
    email: string; // Required for magic link token generation
    city?: string | null;
    state?: string | null;
    category?: string | null;
    slug: string;
  },
  options?: {
    baseUrl?: string;
    rank?: number;
    total?: number;
    // Override URLs (if provided, these take precedence over generated magic links)
    claimUrl?: string;
    manageUrl?: string;
    removeUrl?: string;
    unsubscribeUrl?: string;
    mailingAddress?: string;
  }
): TemplateContext {
  const baseUrl = options?.baseUrl || "https://olera.care";
  const slug = provider.slug;

  // Generate magic link URLs with signed tokens
  const claimUrl = options?.claimUrl || generateClaimUrl(
    provider.provider_id,
    slug,
    provider.email,
    baseUrl
  );

  const manageUrl = options?.manageUrl || generateProviderPortalUrl(
    slug,
    provider.email,
    "manage",
    baseUrl
  );

  // Remove and unsubscribe URLs - these need provider identification
  // For now, include the slug so the endpoint can look up the provider
  const removeUrl = options?.removeUrl || `${baseUrl}/provider/${slug}/remove`;
  const unsubscribeUrl = options?.unsubscribeUrl || `${baseUrl}/unsubscribe?provider=${slug}`;

  return {
    provider_name: provider.name,
    city: provider.city || "your area",
    state: provider.state || "",
    category: normalizeCategory(provider.category),
    rank: options?.rank,
    total: options?.total,
    // Profile URL is the public listing page (no auth needed)
    profile_url: `${baseUrl}/provider/${slug}`,
    claim_url: claimUrl,
    manage_url: manageUrl,
    remove_url: removeUrl,
    unsubscribe_url: unsubscribeUrl,
    mailing_address: options?.mailingAddress || DEFAULT_MAILING_ADDRESS,
  };
}

/**
 * Normalize provider category to a friendly display string.
 * Handles various formats from the olera-providers table.
 */
function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "care provider";

  // Map common categories to friendly names
  const categoryMap: Record<string, string> = {
    "home-health-agency": "home health agency",
    "home_health_agency": "home health agency",
    "home health agency": "home health agency",
    "nursing-home": "nursing home",
    "nursing_home": "nursing home",
    "nursing home": "nursing home",
    "assisted-living": "assisted living facility",
    "assisted_living": "assisted living facility",
    "assisted living": "assisted living facility",
    "memory-care": "memory care facility",
    "memory_care": "memory care facility",
    "memory care": "memory care facility",
    "adult-day-care": "adult day care center",
    "adult_day_care": "adult day care center",
    "adult day care": "adult day care center",
    hospice: "hospice provider",
    "home-care": "home care provider",
    "home_care": "home care provider",
    "home care": "home care provider",
  };

  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || category.toLowerCase();
}

/**
 * Validate that a provider has sufficient data for outreach.
 * Returns validation errors if any required fields are missing.
 */
export function validateProviderForOutreach(provider: {
  provider_id?: string | null;
  name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  slug?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!provider.provider_id) {
    errors.push("Provider ID is required");
  }

  if (!provider.name) {
    errors.push("Provider name is required");
  }

  if (!provider.email) {
    errors.push("Provider email is required for outreach");
  }

  if (!provider.slug) {
    errors.push("Provider slug is required");
  }

  // City and state are optional but recommended
  if (!provider.city && !provider.state) {
    // This is a warning, not an error
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a dry-run report for a batch of providers.
 * Shows what would be sent without actually sending.
 *
 * @param providers - Array of providers to preview
 * @param templateKey - Which template to use
 * @returns Array of preview data for each provider
 */
export function generateDryRunReport(
  providers: Array<{
    provider_id: string;
    name: string;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    category?: string | null;
    slug: string;
  }>,
  templateKey: ProviderOutreachTemplateKey
): Array<{
  provider: string;
  email: string | null;
  valid: boolean;
  errors: string[];
  preview?: RenderedEmail;
}> {
  return providers.map((provider) => {
    const validation = validateProviderForOutreach(provider);

    if (!validation.valid || !provider.email) {
      return {
        provider: provider.name,
        email: provider.email || null,
        valid: false,
        errors: validation.errors,
      };
    }

    const context = buildContextFromProvider({
      provider_id: provider.provider_id,
      name: provider.name,
      email: provider.email,
      city: provider.city,
      state: provider.state,
      category: provider.category,
      slug: provider.slug,
    });
    const preview = renderEmail(templateKey, context);

    return {
      provider: provider.name,
      email: provider.email,
      valid: true,
      errors: [],
      preview,
    };
  });
}
