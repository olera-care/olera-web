/**
 * Map free-form admin delete-reason text to the structured deletion_reason
 * enum on olera-providers (introduced in migration 079).
 *
 * Mirrors the keyword regex in the migration's Pass 1 backfill so future
 * admin-UI deletes get the same classification existing rows received.
 *
 * Returns 'data_sweep' when text is empty/null — the historical default for
 * unstructured deletions (see migration 079 Pass 2 commentary).
 */
export type DeletionReason =
  | "provider_request"
  | "duplicate"
  | "out_of_scope"
  | "data_sweep"
  | "other";

export function classifyDeletionReason(text: string | null | undefined): DeletionReason {
  if (!text) return "data_sweep";
  const t = text.toLowerCase();
  if (/\b(request|owner|takedown|removal\s+request|asked\s+to\s+be\s+removed|provider\s+removed)\b/.test(t)) {
    return "provider_request";
  }
  if (/\b(duplicate|dup|copy\s+of)\b/.test(t)) return "duplicate";
  if (/\b(out\s+of\s+scope|not\s+a\s+fit|doesn'?t\s+fit|service\s+model|wrong\s+category|not\s+senior)\b/.test(t)) {
    return "out_of_scope";
  }
  if (/\b(sweep|cleanup|data\s+clean|reclassif|closed|shut\s+down|out\s+of\s+business|bad\s+data|stale|invalid)\b/.test(t)) {
    return "data_sweep";
  }
  return "other";
}
