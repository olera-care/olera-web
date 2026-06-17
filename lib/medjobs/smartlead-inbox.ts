/**
 * Smartlead master-inbox deep-link helpers.
 *
 * The MedJobs CRM lets an admin jump from a row straight into Smartlead's
 * master inbox to read or reply to a thread by hand — useful when a reply
 * warrants a personal touch instead of the automated cadence.
 *
 * Linkage is written at enrollment time into `research_data.smartlead`
 * (cold) / `research_data.smartlead_activation` (activation). lead_id is
 * optional (Smartlead's lead URL convention); campaign_id alone still
 * scopes the inbox to the right campaign. With neither, the root inbox is
 * the graceful fallback — the admin finds the thread manually.
 *
 * Verify the URL convention live if Smartlead changes their UI routing
 * (logged in plans/medjobs-known-issues.md).
 */

export const SMARTLEAD_INBOX_ROOT = "https://app.smartlead.ai/app/master-inbox";

export interface SmartleadLinkage {
  lead_id?: string | number | null;
  campaign_id?: string | number | null;
}

/**
 * Build a master-inbox URL from a linkage. Returns null only when the
 * linkage itself is absent (so callers can hide the affordance on rows
 * that were never enrolled). When the linkage object exists but carries
 * no ids, the root inbox URL is returned.
 */
export function smartleadInboxUrl(
  linkage: SmartleadLinkage | null | undefined,
): string | null {
  if (!linkage) return null;
  const params = new URLSearchParams();
  if (linkage.lead_id != null && String(linkage.lead_id).trim()) {
    params.set("lead_id", String(linkage.lead_id));
  }
  if (linkage.campaign_id != null && String(linkage.campaign_id).trim()) {
    params.set("campaign_id", String(linkage.campaign_id));
  }
  const qs = params.toString();
  return qs ? `${SMARTLEAD_INBOX_ROOT}?${qs}` : SMARTLEAD_INBOX_ROOT;
}

/**
 * Pull the inbox linkage off a row's research_data. Prefers the cold
 * `smartlead` campaign; falls back to the `smartlead_activation` campaign
 * for rows that are only in the activation cadence. lead_id is read
 * opportunistically (not all enrollment paths persist it).
 */
export function linkageFromResearchData(
  researchData:
    | {
        smartlead?: { campaign_id?: number | null; lead_id?: string | number | null } | null;
        smartlead_activation?: { campaign_id?: number | null; lead_id?: string | number | null } | null;
      }
    | null
    | undefined,
): SmartleadLinkage | null {
  const cold = researchData?.smartlead;
  const activation = researchData?.smartlead_activation;
  const source = cold?.campaign_id != null ? cold : activation?.campaign_id != null ? activation : null;
  if (!source) return null;
  return { campaign_id: source.campaign_id ?? null, lead_id: source.lead_id ?? null };
}
