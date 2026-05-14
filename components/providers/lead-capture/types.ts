// ============================================================
// Lead Capture Sheet Types
// ============================================================

export type LeadCaptureEntryPoint = "message_host" | "custom_quote" | "book_consultation";

export type LeadCaptureState =
  | "form" // Initial form state
  | "submitting" // Form is being submitted
  | "success" // Submission successful (redirect happening)
  | "provider_block" // Non-family account blocking
  | "error"; // Submission failed

export interface LeadCaptureFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

export interface StaffDisplayInfo {
  name: string;
  role: string;
  image: string | null;
}

export interface LeadCaptureProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  entryPoint: LeadCaptureEntryPoint;
  staff?: StaffDisplayInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (connectionId: string) => void;
  providerCity?: string | null;
  providerState?: string | null;
  providerCategory?: string | null;
}
