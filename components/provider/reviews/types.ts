/**
 * Types for the Review Requests feature
 *
 * These types support the "Send Invites" and "In Person" tabs
 * in the provider reviews page.
 */

export interface ReviewRequestClient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export type DeliveryMethod = "email" | "sms" | "both";

export interface RequestNowState {
  clients: ReviewRequestClient[];
  message: string;
  deliveryMethod: DeliveryMethod;
}

export interface RequestNowContentProps {
  state: RequestNowState;
  onStateChange: (state: RequestNowState) => void;
  /** If provided, shows the review link section (for "In Person" tab) */
  providerSlug?: string | null;
}

export const DEFAULT_MESSAGE = "Hi, we'd love to hear about your experience with us. Would you take a moment to leave a review? It helps other families find quality care.";
