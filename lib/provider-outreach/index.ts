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
  bodyToHtml,
  renderEmail,
  previewEmail,
  buildContextFromProvider,
  validateProviderForOutreach,
  generateDryRunReport,
} from "./email-utils";
