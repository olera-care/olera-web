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

/**
 * Re-export bodyToHtml for convenience
 */
export { bodyToHtml };

/**
 * Rendered email ready for sending
 */
export interface RenderedEmail {
  subject: string;
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

  // Substitute variables in subject and body
  const subject = substituteVars(template.subject, vars);
  const body = substituteVars(template.body, vars);

  // Convert body to HTML and append footer
  const html = bodyToHtml(body) + composeFooterHtml();

  // Build plain text version
  const text = body + composeFooterPlainText();

  return { subject, html, text };
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
 * Build the context object from provider data.
 * Used to transform raw provider data into the template context format.
 *
 * @param provider - Provider data from olera-providers table
 * @param profileUrl - Full URL to the provider's profile page
 * @param claimUrl - Full URL to claim/verify the profile
 */
export function buildContextFromProvider(
  provider: {
    name: string;
    city?: string | null;
    state?: string | null;
    category?: string | null;
    slug: string;
  },
  baseUrl: string = "https://olera.care"
): TemplateContext {
  return {
    provider_name: provider.name,
    city: provider.city || "your area",
    state: provider.state || "", // Empty state handled in templates
    category: normalizeCategory(provider.category),
    profile_url: `${baseUrl}/${provider.slug}`,
    claim_url: `${baseUrl}/provider/onboarding?org=${provider.slug}`,
    sender_name: "TJ",
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
  name?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  slug?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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

    if (!validation.valid) {
      return {
        provider: provider.name,
        email: provider.email || null,
        valid: false,
        errors: validation.errors,
      };
    }

    const context = buildContextFromProvider(provider);
    const preview = renderEmail(templateKey, context);

    return {
      provider: provider.name,
      email: provider.email || null,
      valid: true,
      errors: [],
      preview,
    };
  });
}
