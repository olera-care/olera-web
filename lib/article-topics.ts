/**
 * Topic-based categories for editorial content filtering.
 * Replaces care-type-based tabs on /caregiver-support.
 */

export type ArticleTopic =
  | "costs-and-benefits"
  | "getting-started"
  | "dementia-care"
  | "comparing-care"
  | "legal-and-planning"
  | "wellness-and-support"
  | "end-of-life";

export interface TopicConfig {
  label: string;
  description: string;
}

export const TOPIC_CONFIG: Record<ArticleTopic, TopicConfig> = {
  "costs-and-benefits": {
    label: "Costs & Benefits",
    description: "Insurance, Medicare, Medicaid, financial planning, and payment options",
  },
  "getting-started": {
    label: "Getting Started",
    description: "Guides for new caregivers, hiring help, and understanding care options",
  },
  "dementia-care": {
    label: "Dementia Care",
    description: "Alzheimer's, memory care, diagnosis, and dementia-specific guidance",
  },
  "comparing-care": {
    label: "Comparing Care",
    description: "Side-by-side comparisons of care types, facilities, and services",
  },
  "legal-and-planning": {
    label: "Legal & Planning",
    description: "Power of attorney, guardianship, legal rights, and advance directives",
  },
  "wellness-and-support": {
    label: "Wellness & Support",
    description: "Caregiver stress, support groups, counseling, and self-care",
  },
  "end-of-life": {
    label: "End of Life",
    description: "Hospice, grief, loss, and planning for end-of-life care",
  },
};

export const ALL_TOPICS: ArticleTopic[] = [
  "costs-and-benefits",
  "getting-started",
  "dementia-care",
  "comparing-care",
  "legal-and-planning",
  "wellness-and-support",
  "end-of-life",
];
