/**
 * Provider Outreach Email Variant Testing
 *
 * Core logic for A/B testing Day 0 email variants. Key functions:
 *   - isVariantTestingActive() - Check if any variants are active
 *   - selectVariantForProvider() - Deterministic variant assignment
 *   - getVariantTemplate() - Fetch variant content
 *
 * Design principles:
 *   - Variant testing is a template swap, not a timing change
 *   - Same automation, same sequence (Day 0, 3, 5, 7)
 *   - Only Day 0 content varies between providers
 *   - Days 3, 5, 7 remain unchanged for all providers
 */

import { getServiceClient } from "@/lib/admin";
import type { EmailDraft, TemplateContext, ProviderOutreachTemplateKey } from "./templates";
import { substituteVars, buildVars, getTemplate } from "./templates";

// ── Types ─────────────────────────────────────────────────────────────────

export interface VariantRow {
  id: string;
  variant_key: string;
  name: string;
  is_control: boolean;
  is_active: boolean;
  allocation_percent: number;
  subject: string;
  body: string;
  enrolled_count: number;
  claimed_count: number;
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export interface VariantAssignment {
  variant_id: string;
  variant_key: string;
}

export interface VariantStats {
  variant_id: string;
  variant_key: string;
  name: string;
  is_control: boolean;
  enrolled_count: number;
  opened_count: number;
  clicked_count: number;
  claimed_count: number;
  claim_rate: number;
}

// ── Core Functions ────────────────────────────────────────────────────────

/**
 * Check if variant testing is currently active.
 *
 * Returns true if at least one variant has is_active = true.
 * When testing is inactive, system uses default templates (current behavior).
 */
export async function isVariantTestingActive(): Promise<boolean> {
  const db = getServiceClient();

  const { count, error } = await db
    .from("provider_outreach_variants")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    console.error("[variant-testing] Error checking active variants:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get all active variants for enrollment.
 *
 * Returns variants sorted by allocation order for consistent assignment.
 */
export async function getActiveVariants(): Promise<VariantRow[]> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("provider_outreach_variants")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[variant-testing] Error fetching active variants:", error);
    return [];
  }

  return data || [];
}

/**
 * Select a variant for a provider using deterministic hash assignment.
 *
 * Algorithm:
 *   1. Hash the provider_id to get a number 0-99
 *   2. Walk through active variants by allocation_percent
 *   3. Assign to the first variant whose cumulative % exceeds the hash
 *
 * This ensures:
 *   - Same provider always gets same variant (deterministic)
 *   - Distribution matches allocation percentages over time
 *   - No database roundtrips needed per-provider (only initial variant fetch)
 *
 * @param providerId - The provider's unique ID
 * @param activeVariants - Pre-fetched active variants (optional, will fetch if not provided)
 * @returns Variant assignment or null if no variants active
 */
export async function selectVariantForProvider(
  providerId: string,
  activeVariants?: VariantRow[]
): Promise<VariantAssignment | null> {
  const variants = activeVariants ?? await getActiveVariants();

  if (variants.length === 0) {
    return null;
  }

  // Hash provider_id to get a consistent bucket 0-99
  const bucket = hashToBucket(providerId);

  // Walk through variants by allocation
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.allocation_percent;
    if (bucket < cumulative) {
      return {
        variant_id: variant.id,
        variant_key: variant.variant_key,
      };
    }
  }

  // Fallback to last variant (handles rounding issues)
  const lastVariant = variants[variants.length - 1];
  return {
    variant_id: lastVariant.id,
    variant_key: lastVariant.variant_key,
  };
}

/**
 * Get variant template content by ID.
 *
 * Returns null if variant not found.
 */
export async function getVariantTemplate(
  variantId: string
): Promise<{ subject: string; body: string } | null> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("provider_outreach_variants")
    .select("subject, body")
    .eq("id", variantId)
    .single();

  if (error || !data) {
    console.error("[variant-testing] Error fetching variant template:", error);
    return null;
  }

  return data;
}

/**
 * Render a variant template with context.
 *
 * Uses the same substitution system as standard templates.
 */
export function renderVariantTemplate(
  variant: { subject: string; body: string },
  context: TemplateContext
): EmailDraft {
  const vars = buildVars(context);

  return {
    subject: substituteVars(variant.subject, vars),
    body: substituteVars(variant.body, vars),
  };
}

/**
 * Get template for Day 0, using variant if assigned.
 *
 * If variantId is provided, fetches and renders the variant template.
 * Otherwise, returns the default intro template.
 */
export async function getDay0Template(
  context: TemplateContext,
  variantId?: string | null
): Promise<EmailDraft> {
  // If no variant assigned, use default intro template
  if (!variantId) {
    return getTemplate("intro", context);
  }

  // Fetch variant template
  const variant = await getVariantTemplate(variantId);

  if (!variant) {
    // Fallback to default if variant not found
    console.warn("[variant-testing] Variant not found, falling back to default:", variantId);
    return getTemplate("intro", context);
  }

  return renderVariantTemplate(variant, context);
}

/**
 * Determine if a template key should use variant (only Day 0 / intro).
 */
export function shouldUseVariant(templateKey: ProviderOutreachTemplateKey): boolean {
  return templateKey === "intro";
}

// ── Stats & Analytics ─────────────────────────────────────────────────────

/**
 * Get per-variant statistics for dashboard display.
 *
 * Includes:
 *   - Enrolled count (from denormalized column)
 *   - Opened/clicked counts (from touchpoints)
 *   - Claimed count (from denormalized column)
 *   - Claim rate (claimed / enrolled)
 */
export async function getVariantStats(): Promise<VariantStats[]> {
  const db = getServiceClient();

  // Fetch all variants (active or not, for historical view)
  const { data: variants, error: variantError } = await db
    .from("provider_outreach_variants")
    .select("id, variant_key, name, is_control, enrolled_count, claimed_count")
    .order("created_at", { ascending: true });

  if (variantError || !variants) {
    console.error("[variant-testing] Error fetching variants for stats:", variantError);
    return [];
  }

  // Fetch touchpoint counts per variant
  // We join through provider_outreach_tracking to get variant_id
  const { data: touchpoints, error: touchpointError } = await db
    .from("provider_outreach_touchpoints")
    .select(`
      touchpoint_type,
      provider_id
    `)
    .in("touchpoint_type", ["email_opened", "email_clicked"]);

  if (touchpointError) {
    console.error("[variant-testing] Error fetching touchpoints:", touchpointError);
  }

  // Get variant assignments for these providers
  const providerIds = [...new Set((touchpoints || []).map(t => t.provider_id))];

  const variantMap = new Map<string, { opened: number; clicked: number }>();
  for (const v of variants) {
    variantMap.set(v.id, { opened: 0, clicked: 0 });
  }

  if (providerIds.length > 0) {
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, variant_id")
      .in("provider_id", providerIds)
      .not("variant_id", "is", null);

    const providerToVariant = new Map<string, string>();
    for (const t of tracking || []) {
      if (t.variant_id) {
        providerToVariant.set(t.provider_id, t.variant_id);
      }
    }

    // Count touchpoints per variant
    for (const tp of touchpoints || []) {
      const variantId = providerToVariant.get(tp.provider_id);
      if (variantId && variantMap.has(variantId)) {
        const counts = variantMap.get(variantId)!;
        if (tp.touchpoint_type === "email_opened") {
          counts.opened++;
        } else if (tp.touchpoint_type === "email_clicked") {
          counts.clicked++;
        }
      }
    }
  }

  // Build stats array
  return variants.map((v) => {
    const counts = variantMap.get(v.id) || { opened: 0, clicked: 0 };
    const claimRate = v.enrolled_count > 0
      ? (v.claimed_count / v.enrolled_count) * 100
      : 0;

    return {
      variant_id: v.id,
      variant_key: v.variant_key,
      name: v.name,
      is_control: v.is_control,
      enrolled_count: v.enrolled_count,
      opened_count: counts.opened,
      clicked_count: counts.clicked,
      claimed_count: v.claimed_count,
      claim_rate: Math.round(claimRate * 10) / 10, // Round to 1 decimal
    };
  });
}

// ── CRUD Operations ───────────────────────────────────────────────────────

export interface CreateVariantInput {
  variant_key: string;
  name: string;
  is_control?: boolean;
  is_active?: boolean;
  allocation_percent?: number;
  subject: string;
  body: string;
  notes?: string;
  created_by?: string;
}

/**
 * Create a new variant.
 */
export async function createVariant(
  input: CreateVariantInput
): Promise<{ ok: boolean; variant?: VariantRow; error?: string }> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("provider_outreach_variants")
    .insert({
      variant_key: input.variant_key,
      name: input.name,
      is_control: input.is_control ?? false,
      is_active: input.is_active ?? false,
      allocation_percent: input.allocation_percent ?? 25,
      subject: input.subject,
      body: input.body,
      notes: input.notes,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, variant: data };
}

export interface UpdateVariantInput {
  name?: string;
  is_control?: boolean;
  is_active?: boolean;
  allocation_percent?: number;
  subject?: string;
  body?: string;
  notes?: string;
}

/**
 * Update an existing variant.
 */
export async function updateVariant(
  variantId: string,
  input: UpdateVariantInput
): Promise<{ ok: boolean; variant?: VariantRow; error?: string }> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("provider_outreach_variants")
    .update(input)
    .eq("id", variantId)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, variant: data };
}

/**
 * Delete a variant.
 *
 * Note: This will fail if any providers are assigned to this variant.
 * Consider deactivating instead of deleting for historical data.
 */
export async function deleteVariant(
  variantId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getServiceClient();

  const { error } = await db
    .from("provider_outreach_variants")
    .delete()
    .eq("id", variantId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Get all variants (for admin list view).
 */
export async function getAllVariants(): Promise<VariantRow[]> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("provider_outreach_variants")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[variant-testing] Error fetching all variants:", error);
    return [];
  }

  return data || [];
}

// ── Utility Functions ─────────────────────────────────────────────────────

/**
 * Hash a string to a bucket 0-99.
 *
 * Uses a simple but effective hash function (djb2) that provides
 * good distribution for provider IDs.
 */
function hashToBucket(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to positive number and mod 100
  return Math.abs(hash) % 100;
}

/**
 * Batch assign variants to multiple providers.
 *
 * Used when launching sequences for multiple providers at once.
 * Returns a map of provider_id → VariantAssignment.
 */
export async function selectVariantsForProviders(
  providerIds: string[]
): Promise<Map<string, VariantAssignment>> {
  const variants = await getActiveVariants();
  const assignments = new Map<string, VariantAssignment>();

  if (variants.length === 0) {
    return assignments;
  }

  for (const providerId of providerIds) {
    const assignment = await selectVariantForProvider(providerId, variants);
    if (assignment) {
      assignments.set(providerId, assignment);
    }
  }

  return assignments;
}
