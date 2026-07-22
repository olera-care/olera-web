/**
 * Provider Outreach Module
 *
 * Cold outreach system for unclaimed providers.
 * Helps providers claim their profiles on Olera.
 */

// Templates
export {
  type EmailDraft,
  type TemplateContext,
  type ProviderOutreachTemplateKey,
  getTemplate,
  substituteVars,
  buildVars,
  TJ_PHOTO_URL,
  tjSignatureHtml,
  tjSignaturePlainText,
  composeFooterHtml,
  composeFooterPlainText,
} from "./templates";

// Cadence
export {
  type CadenceStep,
  PROVIDER_OUTREACH_CADENCE,
  DAYS_AFTER_FINAL_TO_NEEDS_CALL,
  RE_ENGAGE_WAITING_PERIOD_DAYS,
  getCadenceDays,
  getCadenceStepByDay,
  getTemplateKeyForDay,
  getNextCadenceStep,
  isFinalCadenceStep,
  calculateDueDate,
  calculateNeedsCallDate,
  generateTaskSchedule,
} from "./cadence";

// Email utilities
export {
  type RenderedEmail,
  type ProviderGapData,
  bodyToHtml,
  renderEmail,
  previewEmail,
  buildContextFromProvider,
  validateProviderForOutreach,
  getProviderGaps,
  formatGapList,
  // City demand metrics
  getCityViews,
  getCityViewsBatch,
  // Email sending configuration
  PROVIDER_OUTREACH_EMAIL_TYPE,
  PROVIDER_OUTREACH_FROM,
  PROVIDER_OUTREACH_REPLY_TO,
} from "./email-utils";

// Auto re-engage (NOT YET ACTIVATED - see file header for activation instructions)
export {
  type AutoReEngageResult,
  findEligibleReEngageProviders,
  processEligibleReEngageProviders,
  dryRunAutoReEngage,
} from "./auto-re-engage";
